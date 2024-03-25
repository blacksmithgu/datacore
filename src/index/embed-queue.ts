import { Queue } from "@datastructures-js/queue";
import { Result } from "api/result";
import { Component, TFile, Vault } from "obsidian";
import { Deferred, deferred } from "utils/deferred";

/** Queues up loads of files to reduce the maximum number of concurrent loads. */
export class EmbedQueue extends Component {
    /** Set of pending loads. */
    private queue: Queue<TFile> = new Queue();
    /** Set of promises waiting on each path. */
    private promises: Map<string, Deferred<string>[]> = new Map();
    /** Active set of loads. */
    private active: Map<string, Promise<string>> = new Map();
    /** If true, prevent any further loads. */
    private shutdown: boolean = false;

    public constructor(public vault: Vault, public concurrency: () => number) {
        super();
    }

    /** Read a file asynchronously, controlling concurrency to prevent too many files being loaded simultaneously. */
    public async read(file: TFile): Promise<string> {
        if (this.shutdown) return Promise.reject("Embed queue is shutdown.");

        const promise = deferred<string>();

        // If we aren't already in the queue, add ourselves to queue. Otherwise just append outselfs to the interested watcher for the queue.
        if (!this.promises.has(file.path)) {
            this.queue.push(file);
            this.promises.set(file.path, [promise]);
        } else {
            this.promises.get(file.path)!.push(promise);
        }

        this.schedule();
        return promise;
    }

    /** Schedule more loads from the queue into the active set if there is available space. */
    private schedule() {
        while (this.active.size < this.concurrency() && this.queue.size() > 0) {
            const file = this.queue.pop()!;

            const read = this.vault.cachedRead(file);
            this.active.set(file.path, read);

            read.then((content) => this.finish(file, Result.success(content))).catch((error) =>
                this.finish(file, Result.failure(error))
            );
        }
    }

    /** Communicate the result of a loaded file and then schedule more files to be loaded. */
    private finish(file: TFile, result: Result<string, any>) {
        this.active.delete(file.path);

        const promises = this.promises.get(file.path) ?? [];
        this.promises.delete(file.path);

        if (result.successful) {
            promises.forEach((promise) => promise.resolve(result.value));
        } else {
            promises.forEach((promise) => promise.reject(result.error));
        }

        this.schedule();
    }

    /** Cancell all outstanding loads on unload. */
    public onunload(): void {
        // Reject all outstanding loads.
        for (const promises of this.promises.values()) {
            promises.forEach((promise) => promise.reject("Embed queue is shutting down."));
        }

        this.shutdown = true;
    }
}
