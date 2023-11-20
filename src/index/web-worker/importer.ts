/** Controls and creates Dataview file importers, allowing for asynchronous loading and parsing of files. */

import { Transferable } from "index/web-worker/transferable";
import ImportWorker from "index/web-worker/importer.worker";
import { Component, MetadataCache, TFile, Vault } from "obsidian";
import { ImportCommand } from "index/web-worker/message";

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
    /** Is the importer active? */
    shutdown: boolean;

    /** List of files which have been queued for a reload. */
    queue: [TFile, (success: any) => void, (failure: any) => void][];
    /** Outstanding loads indexed by path. */
    outstanding: Map<string, Promise<any>>;
    /** Throttle settings. */
    throttle: () => ImportThrottle;

    public constructor(public vault: Vault, public metadataCache: MetadataCache, throttle?: () => ImportThrottle) {
        super();
        this.workers = new Map();
        this.shutdown = false;
        this.nextWorkerId = 0;
        this.throttle = throttle ?? (() => DEFAULT_THROTTLE);

        this.queue = [];
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

        let promise: Promise<T> = new Promise((resolve, reject) => {
            this.queue.push([file, resolve, reject]);
        });

        this.outstanding.set(file.path, promise);
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
    private schedule() {
        if (this.queue.length == 0 || this.shutdown) return;

        const worker = this.availableWorker();
        if (!worker) return;

        const [file, resolve, reject] = this.queue.shift()!;

        worker.active = [file, resolve, reject, Date.now()];

        let type: string;
        let resPath: string;

        switch(file.extension) {
            case "pdf": {
                type = "pdf";
                resPath = this.vault.getResourcePath(file);
                break;
            }
            case "md": {
                type = "markdown";
                break;
            }
            case "canvas": {
                type = "canvas";
                break;
            }
        }

        this.vault.cachedRead(file).then((c) =>
            worker!.worker.postMessage(
                Transferable.transferable({
                    type,
                    path: file.path,
                    contents: c,
                    stat: file.stat,
                    metadata: this.metadataCache.getFileCache(file),
                    resourceURI: resPath
                } as ImportCommand)
            )
        );
    }

    /** Finish the parsing of a file, potentially queueing a new file. */
    private finish(worker: PoolWorker, data: any) {
        let [file, resolve, reject] = worker.active!;

        // Resolve promises to let users know this file has finished.
        if ("$error" in data) reject(data["$error"]);
        else resolve(data);

        // Remove file from outstanding.
        this.outstanding.delete(file.path);

        // Remove this worker if we are over capacity.
        // Otherwise, notify the queue this file is available for new work.
        if (this.workers.size > this.throttle().workers) {
            this.workers.delete(worker.id);
            terminate(worker);
        } else {
            const now = Date.now();
            const start = worker.active![3];
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

        worker.worker.onmessage = (evt) => this.finish(worker, Transferable.value(evt.data));
        return worker;
    }

    /** Reject all outstanding promises and close all workers on close. */
    public onunload(): void {
        for (let worker of this.workers.values()) {
            terminate(worker);
        }

        for (let [_file, _success, reject] of this.queue) {
            reject("Terminated");
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
    active?: [TFile, (success: any) => void, (failure: any) => void, number];
}

/** Terminate a pool worker. */
function terminate(worker: PoolWorker) {
    worker.worker.terminate();

    if (worker.active) worker.active[2]("Terminated");
    worker.active = undefined;
}
