/** Controls and creates Dataview file importers, allowing for asynchronous loading and parsing of files. */

import ImportWorker from "index/web-worker/importer.worker";
import { Component, FileManager, MetadataCache, TFile, Vault } from "obsidian";
import { CanvasImport, MarkdownImport, PDFImport } from "index/web-worker/message";
import { Deferred, deferred } from "utils/deferred";

import { Queue } from "@datastructures-js/queue";

/** Settings for throttling import. */
export interface ImportThrottle {
    /** The number of workers to use for imports. */
    workers: number;
    /** A number between 0.1 and 1 which indicates total cpu utilization target; 0.1 means spend 10% of time  */
    utilization: number;
}

/** Default throttle configuration. */
export const DEFAULT_THROTTLE: ImportThrottle = {
    workers: 2,
    utilization: 0.75,
};

/** Multi-threaded file parser which debounces rapid file requests automatically. */
export class FileImporter extends Component {
    /* Background workers which do the actual file parsing. */
    workers: Map<number, PoolWorker>;
    /** The next worker ID to hand out. */
    nextWorkerId: number;
    /** If true, the importer is now inactive and will not process further files. */
    shutdown: boolean;

    /** List of files which have been queued for a reload. */
    queue: Queue<[TFile, Deferred<any>]>;
    /** Outstanding loads indexed by path. */
    outstanding: Map<string, Promise<any>>;
    /** Throttle settings. */
    throttle: () => ImportThrottle;

    public constructor(
        public vault: Vault,
        public fileManager: FileManager,
        public metadataCache: MetadataCache,
        throttle?: () => ImportThrottle
    ) {
        super();
        this.workers = new Map();
        this.shutdown = false;
        this.nextWorkerId = 0;
        this.throttle = throttle ?? (() => DEFAULT_THROTTLE);

        this.queue = new Queue();
        this.outstanding = new Map();
    }

    /**
     * Queue the given file for importing. Multiple import requests for the same file in a short time period will be de-bounced
     * and all be resolved by a single actual file reload.
     */
    public import<T>(file: TFile): Promise<T> {
        // De-bounce repeated requests for the same file.
        let existing = this.outstanding.get(file.path);
        if (existing) return existing;

        let promise = deferred<T>();

        this.outstanding.set(file.path, promise);
        this.queue.enqueue([file, promise]);
        this.schedule();
        return promise;
    }

    /** Reset any active throttles on the importer (such as if the utilization changes). */
    public unthrottle() {
        for (let worker of this.workers.values()) {
            worker.availableAt = Date.now();
        }
    }

    /** Poll from the queue and execute if there is an available worker. */
    private async schedule() {
        if (this.queue.size() == 0 || this.shutdown) return;

        const worker = this.availableWorker();
        if (!worker) return;

        const [file, promise] = this.queue.dequeue()!;
        worker.active = [file, promise, Date.now()];

        try {
            switch (file.extension) {
                case "markdown":
                case "md": {
                    const contents = await this.vault.cachedRead(file);
                    worker!.worker.postMessage({
                        type: "markdown",
                        path: file.path,
                        contents: contents,
                        stat: file.stat,
                        metadata: this.metadataCache.getFileCache(file),
                    } as MarkdownImport);
										break;
								}
								case "pdf": {
									worker!.worker.postMessage({
										type: "pdf",
										resourceURI: this.vault.getResourcePath(file),
										path: file.path,
										stat: file.stat
									} as PDFImport)
									break;
								}
								case "canvas": {
									const contents = await this.vault.cachedRead(file);
									worker!.worker.postMessage({
										type: "canvas",
										path: file.path,
										contents: contents,
										stat: file.stat,
										index: this.fileManager.linkUpdaters.canvas.canvas.index.index[file.path]
									} as CanvasImport)
									break;
								}	
            }
        } catch (ex) {
            console.log("Datacore: Background file reloading failed. " + ex);

            // Message failed, release this worker.
            worker.active = undefined;
        }
    }

    /** Finish the parsing of a file, potentially queueing a new file. */
    private finish(worker: PoolWorker, data: any) {
        if (!worker.active) {
            console.log("Datacore: Received a stale worker message. Ignoring.", data);
            return;
        }

        const [file, promise, start] = worker.active!;

        // Resolve promises to let users know this file has finished.
        if ("$error" in data) promise.reject(data["$error"]);
        else promise.resolve(data);

        // Remove file from outstanding.
        this.outstanding.delete(file.path);

        // Remove this worker if we are over capacity.
        // Otherwise, notify the queue this file is available for new work.
        if (this.workers.size > this.throttle().workers) {
            this.workers.delete(worker.id);
            terminate(worker);
        } else {
            const now = Date.now();
            const throttle = Math.max(0.1, this.throttle().utilization) - 1.0;
            const delay = (now - start) * throttle;

            worker.active = undefined;

            if (delay <= 1e-10) {
                worker.availableAt = now;
                this.schedule();
            } else {
                worker.availableAt = now + delay;

                // Note: I'm pretty sure this will garauntee that this executes AFTER delay milliseconds,
                // so this should be fine; if it's not, we'll have to swap to an external timeout loop
                // which infinitely reschedules itself to the next available execution time.
                setTimeout(this.schedule.bind(this), delay);
            }
        }
    }

    /** Obtain an available worker, returning undefined if one does not exist. */
    private availableWorker(): PoolWorker | undefined {
        const now = Date.now();
        for (let worker of this.workers.values()) {
            if (!worker.active && worker.availableAt <= now) {
                return worker;
            }
        }

        // Make a new worker if we can.
        if (this.workers.size < this.throttle().workers) {
            let worker = this.newWorker();
            this.workers.set(worker.id, worker);
            return worker;
        }

        return undefined;
    }

    /** Create a new worker bound to this importer. */
    private newWorker(): PoolWorker {
        let worker: PoolWorker = {
            id: this.nextWorkerId++,
            availableAt: Date.now(),
            worker: new ImportWorker(),
        };

        worker.worker.onmessage = (evt) => this.finish(worker, evt.data);
        return worker;
    }

    /** Reject all outstanding promises and close all workers on close. */
    public onunload(): void {
        for (let worker of this.workers.values()) {
            terminate(worker);
        }

        while (!this.queue.isEmpty()) {
            const [_file, promise] = this.queue.pop()!;
            promise.reject("Terminated");
        }

        this.shutdown = true;
    }
}

/** A worker in the pool of executing workers. */
interface PoolWorker {
    /** The id of this worker. */
    id: number;
    /** The raw underlying worker. */
    worker: Worker;
    /** UNIX time indicating the next time this worker is available for execution according to target utilization. */
    availableAt: number;
    /** The active promise this worker is working on, if any. */
    active?: [TFile, Deferred<any>, number];
}

/** Terminate a pool worker. */
function terminate(worker: PoolWorker) {
    worker.worker.terminate();

    if (worker.active) worker.active[1].reject("Terminated");
    worker.active = undefined;
}
