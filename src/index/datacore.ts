import { deferred, Deferred } from "utils/deferred";
import { Datastore, Substorer } from "index/datastore";
import { LocalStorageCache } from "index/persister";
import { Indexable } from "index/types/indexable";
import { FileImporter, ImportThrottle } from "index/web-worker/importer";
import { ImportResult } from "index/web-worker/message";
import { App, Component, EventRef, Events, MetadataCache, TAbstractFile, TFile, Vault } from "obsidian";
import { Settings } from "settings";
import { MarkdownListBlock, MarkdownListItem, MarkdownPage } from "./types/markdown/markdown";

/** Central API object; handles initialization, events, debouncing, and access to datacore functionality. */
export class Datacore extends Component {
    /** Access to the obsidian vault. */
    vault: Vault;
    /** Provides access to per-(markdown)-file metadata. */
    metadataCache: MetadataCache;
    /** Datacore events, mainly used to update downstream views. This object is shadowed by the Datacore object itself. */
    events: Events;

    /** In-memory index over all stored metadata. */
    datastore: Datastore;
    /** Asynchronous multi-threaded file importer with throttling. */
    importer: FileImporter;
    /** Local-storage backed cache of metadata objects. */
    persister: LocalStorageCache;
    /** Only set when datacore is in the midst of initialization; tracks current progress. */
    initializer?: DatacoreInitializer;
    /** If true, datacore is fully hydrated and all files have been indexed. */
    initialized: boolean;

    constructor(public app: App, public version: string, public settings: Settings) {
        super();

        this.vault = app.vault;
        this.metadataCache = app.metadataCache;
        this.persister = new LocalStorageCache("primary", version);
        this.events = new Events();

        this.datastore = new Datastore(app.vault, app.metadataCache, settings);
        this.initialized = false;

        this.addChild(
            (this.importer = new FileImporter(app.vault, app.metadataCache, () => {
                return {
                    workers: settings.importerNumThreads,
                    utilization: Math.max(0.1, Math.min(1.0, settings.importerUtilization)),
                } as ImportThrottle;
            }))
        );
    }

    /** Obtain the current index revision, for determining if anything has changed. */
    get revision() {
        return this.datastore.revision;
    }

    /** Initialize datacore by scanning persisted caches and all available files, and queueing parses as needed. */
    initialize() {
        // The metadata cache is updated on initial file index and file loads.
        this.registerEvent(this.metadataCache.on("resolve", (file) => this.reload(file)));

        // Renames do not set off the metadata cache; catch these explicitly.
        this.registerEvent(this.vault.on("rename", this.rename, this));

        // File creation does cause a metadata change, but deletes do not. Clear the caches for this.
        this.registerEvent(
            this.vault.on("delete", (file) => {
                if (file instanceof TFile) {
                    this.datastore.delete(file.path);
                }
            })
        );

        // Asynchronously initialize actual content in the background using a lifecycle-respecting object.
        const init = (this.initializer = new DatacoreInitializer(this));
        init.finished().then((stats) => {
            this.initialized = true;
            this.initializer = undefined;
            this.removeChild(init);

            const durationSecs = (stats.durationMs / 1000.0).toFixed(3);
            console.log(
                `Datacore: Imported all files in the vault in ${durationSecs}s ` +
                    `(${stats.imported} imported, ${stats.skipped} skipped).`
            );

            this.datastore.touch();
            this.trigger("update", this.revision);
        });

        this.addChild(init);
    }

    private rename(file: TAbstractFile, oldPath: string) {
        if (!(file instanceof TFile)) {
            return;
        }

        // Delete the file at the old path, then request a reload at the new path.
        // This is less optimal than what can probably be done, but paths are used in a bunch of places
        // (for sections, tasks, etc to refer to their parent file) and it requires some finesse to fix.
        this.datastore.delete(oldPath);
        this.reload(file);
    }

    /** Queue a file for reloading; this is done asynchronously in the background and may take a few seconds. */
    public async reload(file: TFile): Promise<Indexable> {
        const result = await this.importer.import<ImportResult>(file);

        if (result.type === "error") {
            throw new Error(`Failed to import file '${file.name}: ${result.$error}`);
        } else if (result.type === "markdown") {
            const parsed = MarkdownPage.from(result.result, (link) => {
                const rpath = this.metadataCache.getFirstLinkpathDest(link.path, result.result.$path!);
                if (rpath) return link.withPath(rpath.path);
                else return link;
            });

            this.datastore.store(parsed, (object, store) => {
                store(object.$sections, (section, store) => {
                    store(section.$blocks, (block, store) => {
                        if (block instanceof MarkdownListBlock) {
                            // Recursive store function for storing list heirarchies.
                            const storeRec: Substorer<MarkdownListItem> = (item, store) =>
                                store(item.$elements, storeRec);

                            store(block.$elements, storeRec);
                        }
                    });
                });
            });

            this.trigger("update", this.revision);
            return parsed;
        }

        throw new Error("Encountered unrecognized import result type: " + (result as any).type);
    }

    // Event propogation.

    /** Called whenever the index updates to a new revision. This is the broadest possible datacore event. */
    public on(evt: "update", callback: (revision: number) => any, context?: any): EventRef;

    on(evt: string, callback: (...data: any) => any, context?: any): EventRef {
        return this.events.on(evt, callback, context);
    }

    /** Unsubscribe from an event using the event and original callback. */
    off(evt: string, callback: (...data: any) => any) {
        this.events.off(evt, callback);
    }

    /** Unsubscribe from an event using the event reference.  */
    offref(ref: EventRef) {
        this.events.offref(ref);
    }

    /** Trigger an update event. */
    private trigger(evt: "update", revision: number): void;

    /** Trigger an event. */
    private trigger(evt: string, ...args: any[]): void {
        this.events.trigger(evt, ...args);
    }
}

/** Lifecycle-respecting file queue which will import files, reading them from the file cache if needed. */
export class DatacoreInitializer extends Component {
    /** Number of concurrent operations the initializer will perform. */
    static BATCH_SIZE: number = 8;

    /** Whether the initializer should continue to run. */
    active: boolean;

    /** Queue of files to still import. */
    queue: TFile[];
    /** The files actively being imported. */
    current: TFile[];
    /** Deferred promise which resolves when importing is done. */
    done: Deferred<InitializationStats>;

    /** The time that init started in milliseconds. */
    start: number;
    /** Total number of files to import. */
    files: number;
    /** Total number of imported files so far. */
    initialized: number;
    /** Total number of imported files. */
    imported: number;
    /** Total number of skipped files. */
    skipped: number;

    constructor(public core: Datacore) {
        super();

        this.active = false;
        this.queue = this.core.vault.getMarkdownFiles();
        this.files = this.queue.length;
        this.start = Date.now();
        this.current = [];
        this.done = deferred();

        this.initialized = this.imported = this.skipped = 0;
    }

    async onload() {
        // Queue BATCH_SIZE elements from the queue to import.
        this.active = true;

        this.runNext();
    }

    /** Promise which resolves when the initialization completes. */
    finished(): Promise<InitializationStats> {
        return this.done;
    }

    /** Cancel initialization. */
    onunload() {
        if (this.active) {
            this.active = false;
            this.done.reject("Initialization was cancelled before completing.");
        }
    }

    /** Poll for another task to execute from the queue. */
    private runNext() {
        // Do nothing if max number of concurrent operations already running.
        if (!this.active || this.current.length >= DatacoreInitializer.BATCH_SIZE) {
            return;
        }

        // There is space available to execute another.
        const next = this.queue.pop();
        if (next) {
            this.current.push(next);
            this.init(next)
                .then((result) => this.handleResult(next, result))
                .catch((result) => this.handleResult(next, result));

            this.runNext();
        } else if (!next && this.current.length == 0) {
            this.active = false;

            // All work is done, resolve.
            this.done.resolve({
                durationMs: Date.now() - this.start,
                files: this.files,
                imported: this.imported,
                skipped: this.skipped,
            });
        }
    }

    /** Process the result of an initialization and queue more runs. */
    private handleResult(file: TFile, result: InitializationResult) {
        this.current.remove(file);
        this.initialized++;

        if (result.status === "skipped") this.skipped++;
        else if (result.status === "imported") this.imported++;

        // Queue more jobs for processing.
        this.runNext();
    }

    /** Initialize a specific file. */
    private async init(file: TFile): Promise<InitializationResult> {
        try {
            const metadata = this.core.metadataCache.getFileCache(file);
            if (!metadata) return { status: "skipped" };

            await this.core.reload(file);
            return { status: "imported" };
        } catch (ex) {
            console.log("Datacore: Failed to import file: ", ex);
            return { status: "skipped" };
        }
    }
}

/** Statistics about a successful vault initialization. */
export interface InitializationStats {
    /** How long initializaton took in miliseconds. */
    durationMs: number;
    /** Total number of files that were imported */
    files: number;
    /** The number of files that were loaded and imported via background workers. */
    imported: number;
    /** The number of files that were skipped due to no longer existing or not being ready. */
    skipped: number;
}

/** The result of initializing a file. */
interface InitializationResult {
    status: "skipped" | "imported";
}
