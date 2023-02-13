/** Controls and creates Dataview file importers, allowing for asynchronous loading and parsing of files. */

import { Transferable } from "index/web-worker/transferable";
import ImportWorker from "index/web-worker/importer.worker";
import { Component, MetadataCache, TFile, Vault } from "obsidian";

/** Settings for throttling import. */
export interface ImportThrottle {
    workers: number;
}

/** Default throttle configuration. */
export const DEFAULT_THROTTLE = {
    workers: 2
}

/** Multi-threaded file parser which debounces rapid file requests automatically. */
export class FileImporter extends Component {
    /* Background workers which do the actual file parsing. */
    workers: Map<number, PoolWorker>;
    /** The next worker ID to hand out. */
    nextWorkerId: number;

    /** List of files which have been queued for a reload. */
    queue: [TFile, (success: any) => void, (failure: any) => void][];
    /** Outstanding loads indexed by path. */
    outstanding: Map<string, Promise<any>>;
    /** Throttle settings. */
    throttle: () => ImportThrottle;

    public constructor(public vault: Vault, public metadataCache: MetadataCache, throttle?: () => ImportThrottle) {
        super();
        this.workers = new Map();
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

    /** Poll from the queue and execute if there is an available worker. */
    private schedule() {
        if (this.queue.length == 0) return;

        const worker = this.availableWorker();
        if (!worker) return;

        const [file, resolve, reject] = this.queue.shift()!;

        worker.active = [file, resolve, reject];
        this.vault.cachedRead(file).then(c =>
            worker!.worker.postMessage({
                path: file.path,
                contents: c,
                stat: file.stat,
                metadata: this.metadataCache.getFileCache(file),
            })
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
            worker.active = undefined;
            this.schedule();
        }
    }

    /** Obtain an available worker, returning undefined if one does not exist. */
    private availableWorker(): PoolWorker | undefined {
        for (let worker of this.workers.values()) {
            if (!worker.active) {
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
        let worker = {
            id: this.nextWorkerId++,
            worker: new ImportWorker(),
        };

        worker.worker.onmessage = evt => this.finish(worker, Transferable.value(evt.data));
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
    }
}

/** A worker in the pool of executing workers. */
interface PoolWorker {
    /** The id of this worker. */
    id: number;
    /** The raw underlying worker. */
    worker: Worker;
    /** The active promise this worker is working on, if any. */
    active?: [TFile, (success: any) => void, (failure: any) => void];
}

/** Terminate a pool worker. */
function terminate(worker: PoolWorker) {
    worker.worker.terminate();

    if (worker.active) worker.active[2]("Terminated");
    worker.active = undefined;
}