import { deferred, Deferred } from "utils/deferred";
import { Datastore, Substorer } from "index/datastore";
import { LocalStorageCache } from "index/persister";
import { Indexable, INDEXABLE_EXTENSIONS } from "index/types/indexable";
import { FileImporter, ImportThrottle } from "index/web-worker/importer";
import { ImportResult } from "index/web-worker/message";
import { App, Component, EventRef, Events, MetadataCache, TAbstractFile, TFile, Vault } from "obsidian";
import { Settings } from "settings";
import { MarkdownListBlock, MarkdownListItem, MarkdownPage } from "./types/markdown";
import { GenericFile } from "./types/files";
import { DateTime } from "luxon";
import { EmbedQueue } from "./embed-queue";
import { JsonMarkdownPage } from "./types/json/markdown";
import { Canvas, CanvasTextCard } from "./types/canvas";

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
    /** Queue of asynchronous read requests; ensures we limit the maximum number of concurrent file loads. */
    reads: EmbedQueue;
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
            (this.importer = new FileImporter(app.vault, app.fileManager, app.metadataCache, () => {
                return {
                    workers: settings.importerNumThreads,
                    utilization: Math.max(0.1, Math.min(1.0, settings.importerUtilization)),
                } as ImportThrottle;
            }))
        );

        // TODO (blacksmithgu): Add a new setting for embed queue concurrency.
        this.addChild((this.reads = new EmbedQueue(app.vault, () => 8)));
    }

    /** Obtain the current index revision, for determining if anything has changed. */
    get revision() {
        return this.datastore.revision;
    }

    /** Initialize datacore by scanning persisted caches and all available files, and queueing parses as needed. */
    initialize() {
        // Metadata cache handles markdown file updates.
        this.registerEvent(this.metadataCache.on("resolve", (file) => this.reload(file)));

        // Renames do not set off the metadata cache; catch these explicitly.
        this.registerEvent(this.vault.on("rename", this.rename, this));

        // Handle generic file creates and updates; resolve generally only applies to markdown files
        // but we do keep basic metadata about all files.
        this.registerEvent(
            this.vault.on("create", (file) => {
                if (!(file instanceof TFile)) return;

                // Handled by the metadata cache.
                if (INDEXABLE_EXTENSIONS.has(file.extension.toLowerCase())) return;

                this.reload(file);
            })
        );

        this.registerEvent(
            this.vault.on("modify", (file) => {
                if (!(file instanceof TFile)) return;

                // Handled by the metadata cache.
                if (INDEXABLE_EXTENSIONS.has(file.extension.toLowerCase())) return;

                this.reload(file);
            })
        );

        // File creation does cause a metadata change, but deletes do not. Clear the caches for this.
        this.registerEvent(
            this.vault.on("delete", (file) => {
                if (file instanceof TFile) {
                    this.datastore.delete(file.path);
                }
            })
        );

        this.index();
    }

    /** Starts the background initializer. */
    index() {
        // Asynchronously initialize actual content in the background using a lifecycle-respecting object.
        const init = (this.initializer = new DatacoreInitializer(this));
        init.finished().then((stats) => {
            this.initialized = true;
            this.initializer = undefined;
            this.removeChild(init);

            const durationSecs = (stats.durationMs / 1000.0).toFixed(3);
            console.log(
                `Datacore: Imported all files in the vault in ${durationSecs}s ` +
                    `(${stats.imported} imported, ${stats.cached} cached, ${stats.skipped} skipped).`
            );

            this.datastore.touch();
            this.trigger("update", this.revision);
            this.trigger("initialized");

            // Clean up any documents which no longer exist in the vault.
            // TODO: I think this may race with other concurrent operations, so
            // this may need to happen at the start of init and not at the end.
            const currentFiles = this.vault.getFiles().map((file) => file.path);
            this.persister
                .synchronize(currentFiles)
                .then((cleared) => console.log(`Datacore: dropped ${cleared.size} out-of-date file metadata blocks.`));
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

        // TODO: For correctness, probably have to either fix links in all linked files OR
        // just stop normalizing links in the store.
    }

    /**
     * Read a file from the Obsidian cache efficiently, limiting the number of concurrent request and debouncing
     * multiple requests for the same file.
     */
    public async read(file: TFile): Promise<string> {
        return this.reads.read(file);
    }

    /** Queue a file for reloading; this is done asynchronously in the background and may take a few seconds. */
    public async reload(file: TFile): Promise<Indexable> {
        // Filter files by file extensions.
        if (!INDEXABLE_EXTENSIONS.has(file.extension)) {
            const result = new GenericFile(
                file.path,
                DateTime.fromMillis(file.stat.ctime),
                DateTime.fromMillis(file.stat.mtime),
                file.stat.size
            );

            this.datastore.store(result);
            return result;
        }

        const result = await this.importer.import<ImportResult>(file);

        if (result.type === "error") {
            throw new Error(`Failed to import file '${file.name}: ${result.$error}`);
        } else if (result.type === "markdown") {
            // Parse the file and normalize metadata from it.
            const parsed = MarkdownPage.from(result.result, (link) => {
                const rpath = this.metadataCache.getFirstLinkpathDest(link.path, result.result.$path!);
                if (rpath) return link.withPath(rpath.path);
                else return link;
            });

            // Store it recursively into the datastore for querying.
            this.storeMarkdown(parsed);

            // Write it to the file cache for faster loads in the future.
            this.persister.storeFile(parsed.$path, parsed.json());

            // And finally trigger an update.
            this.trigger("update", this.revision);
            return parsed;
        } else if (result.type === "canvas") {
            const parsed = Canvas.from(result.result, (link) => {
                const rpath = this.metadataCache.getFirstLinkpathDest(link.path, result.result.$path!);
                if (rpath) return link.withPath(rpath.path);
                else return link;
            });
            this.storeCanvas(parsed);
            this.persister.storeFile(parsed.$path, parsed.json());
            this.trigger("update", this.revision);
            return parsed;
        }

        throw new Error("Encountered unrecognized import result type: " + (result as any).type);
    }

    public storeCanvas(data: Canvas) {
        this.datastore.store(data, (object, store) => {
            store(object.$cards, (card, store) => {
                if (card instanceof CanvasTextCard) {
                    store(card.$sections, (section, store) => {
                        store(section.$blocks, (block, store) => {
                            if (block instanceof MarkdownListBlock) {
                                // Recursive store function for storing list heirarchies.
                                const storeRec: Substorer<MarkdownListItem> = (item, store) =>
                                    store(item.$elements, storeRec);

                                store(block.$elements, storeRec);
                            }
                        });
                    });
                }
            });
        });
    }

    /** Store a markdown document. */
    public storeMarkdown(data: MarkdownPage) {
        this.datastore.store(data, (object, store) => {
            store(object.$sections, (section, store) => {
                store(section.$blocks, (block, store) => {
                    if (block instanceof MarkdownListBlock) {
                        // Recursive store function for storing list heirarchies.
                        const storeRec: Substorer<MarkdownListItem> = (item, store) => store(item.$elements, storeRec);

                        store(block.$elements, storeRec);
                    }
                });
            });
        });
    }

    // Event propogation.

    /** Called whenever the index updates to a new revision. This is the broadest possible datacore event. */
    public on(evt: "update", callback: (revision: number) => any, context?: any): EventRef;
    public on(evt: "initialized", callback: () => any, context?: any): EventRef;

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
    /** Trigger an initialization event. */
    private trigger(evt: "initialized"): void;

    /** Trigger an event. */
    private trigger(evt: string, ...args: any[]): void {
        console.log("triggering", evt);
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

    /** The total number of target files to import. */
    targetTotal: number;
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
    /** Total number of cached files. */
    cached: number;

    constructor(public core: Datacore) {
        super();

        this.active = false;
        this.queue = this.core.vault.getFiles();
        this.targetTotal = this.queue.length;
        this.files = this.queue.length;
        this.start = Date.now();
        this.current = [];
        this.done = deferred();

        this.initialized = this.imported = this.skipped = this.cached = 0;
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
                cached: this.cached,
            });
        }
    }

    /** Process the result of an initialization and queue more runs. */
    private handleResult(file: TFile, result: InitializationResult) {
        this.current.remove(file);
        this.initialized++;

        if (result.status === "skipped") this.skipped++;
        else if (result.status === "imported") this.imported++;
        else if (result.status === "cached") this.cached++;

        // Queue more jobs for processing.
        this.runNext();
    }

    /** Initialize a specific file. */
    private async init(file: TFile): Promise<InitializationResult> {
        try {
            // Handle loading markdown files from cache.
            const cached = await this.core.persister.loadFile(file.path);
            if (cached && cached.time >= file.stat.mtime && cached.version == this.core.version) {
                if (file.extension === "md") {
                    const data = MarkdownPage.from(cached.data as JsonMarkdownPage, (link) => link);
                    this.core.storeMarkdown(data);
                    return { status: "cached" };
                }
            }

            // Does not match an existing import type, just reload normally.
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
    /** The number of files loaded from the IndexedDB cache. */
    cached: number;
}

/** The result of initializing a file. */
interface InitializationResult {
    status: "skipped" | "imported" | "cached";
}
