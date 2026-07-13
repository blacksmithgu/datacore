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

    /** @internal In-memory index over all stored metadata. */
    datastore: Datastore;
    /** @internal Asynchronous multi-threaded file importer with throttling. */
    importer: FileImporter;
    /** @internal Queue of asynchronous read requests; ensures we limit the maximum number of concurrent file loads. */
    reads: EmbedQueue;
    /** @internal Local-storage backed cache of metadata objects. */
    persister: LocalStorageCache;
    /** @internal Only set when datacore is in the midst of initialization; tracks current progress. */
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
                if (!(file instanceof TFile)) return;

                if (this.datastore.delete(file.path)) {
                    this.trigger("update", this.revision);
                }
            })
        );

        this.index();
    }

    /** Clears all current state and caches and reindexes the entire vault from scratch. */
    async reindex() {
        this.initialized = false;
        this.datastore.clear();

        await this.persister.recreate();

        await this.index();
    }

    /** Indexes all documents in the vault. Wait on this if you want to wait for the whole index to be ready. */
    async index() {
        // Asynchronously initialize actual content in the background using a lifecycle-respecting object.
        const init = (this.initializer = new DatacoreInitializer(this));
        this.addChild(init);

        // Wait only for the cache phase to complete, then signal ready immediately.
        await init.cacheReady();

        this.initialized = true;
        this.datastore.touch();
        this.trigger("update", this.revision);
        this.trigger("initialized");

        // Continue waiting for background imports of stale/missing files.
        await init.finished();

        this.initializer = undefined;
        this.removeChild(init);

        this.datastore.touch();
        this.trigger("update", this.revision);

        // Clean up any documents which no longer exist in the vault.
        const currentFiles = this.vault.getFiles().map((file) => file.path);
        this.persister.synchronize(currentFiles);
    }

    private async rename(file: TAbstractFile, oldPath: string) {
        if (!(file instanceof TFile)) {
            return;
        }

        // Delete the file at the old path, then request a reload at the new path.
        // This is less optimal than what can probably be done, but paths are used in a bunch of places
        // (for sections, tasks, etc to refer to their parent file) and it requires some finesse to fix.
        this.datastore.delete(oldPath);
        await this.reload(file);

        this.trigger("rename", file.path, oldPath);

        // TODO: For correctness, probably have to either fix links in all linked files OR
        // just stop normalizing links in the store. We can traverse the links index to do so
        // but it is fairly painful.
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
            throw new Error(`Failed to import file '${file.name}': ${result.$error}`);
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

            // Store it recursively into the datastore for querying.
            this.storeCanvas(parsed);

            // Write it to the file cache for faster loads in the future.
            this.persister.storeFile(parsed.$path, parsed.json());

            // And finally trigger an update.
            this.trigger("update", this.revision);
            return parsed;
        }

        throw new Error("Encountered unrecognized import result type: " + (result as { type: unknown }).type);
    }

    /** Store a canvas document. */
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

    ///////////////////////
    // Event propogation //
    ///////////////////////

    /** Called whenever the index updates to a new revision. This is the broadest possible datacore event. */
    public on(evt: "update", callback: (revision: number) => void, context?: unknown): EventRef;
    /** Called whenever datacore records a file rename and has finished reindexing the rename. */
    public on(evt: "rename", callback: (newPath: string, oldPath: string) => void, context?: unknown): EventRef;
    /** Called when datacore has initialized and is querable. */
    public on(evt: "initialized", callback: () => void, context?: unknown): EventRef;

    on<T extends Function>(evt: string, callback: T, context?: unknown): EventRef {
        return this.events.on(evt, callback as unknown as (...args: unknown[]) => unknown, context);
    }

    /** Unsubscribe from an event using the event and original callback. */
    off(evt: string, callback: (...data: unknown[]) => void) {
        this.events.off(evt, callback);
    }

    /** Unsubscribe from an event using the event reference.  */
    offref(ref: EventRef) {
        this.events.offref(ref);
    }

    /** Trigger an update event. */
    private trigger(evt: "update", revision: number): void;
    /** Trigger a rename event. */
    private trigger(evt: "rename", newPath: string, oldPath: string): void;
    /** Trigger an initialization event. */
    private trigger(evt: "initialized"): void;

    /** Trigger an event. */
    private trigger(evt: string, ...args: unknown[]): void {
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
    /**
     * Deferred promise which resolves as soon as all cached files have been loaded into the
     * datastore. Files that are stale or missing from the cache continue importing in the
     * background after this resolves.
     */
    cacheReadyDeferred: Deferred<void>;

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

    /** Files that need a full background import (stale or not in cache). */
    private backgroundQueue: TFile[];

    constructor(public core: Datacore) {
        super();

        this.active = false;
        this.queue = this.core.vault.getFiles();
        this.targetTotal = this.queue.length;
        this.files = this.queue.length;
        this.start = Date.now();
        this.current = [];
        this.done = deferred();
        this.cacheReadyDeferred = deferred();

        this.backgroundQueue = [];

        this.initialized = this.imported = this.skipped = this.cached = 0;
    }

    async onload() {
        this.active = true;

        // Phase 1: load everything available from the IndexedDB cache.
        await this.loadFromCache();

        // Signal that the index is usable — cached data is now in the datastore.
        this.cacheReadyDeferred.resolve();

        // Phase 2: import files that were stale or missing from the cache in the background.
        this.runNextBackground();
    }

    /** Promise that resolves once all cached files have been loaded (plugin is usable). */
    cacheReady(): Promise<void> {
        return this.cacheReadyDeferred;
    }

    /** Promise which resolves when the full initialization (including background imports) completes. */
    finished(): Promise<InitializationStats> {
        return this.done;
    }

    /** Cancel initialization. */
    onunload() {
        if (this.active) {
            this.active = false;
            this.cacheReadyDeferred.resolve(); // unblock callers waiting on cache
            this.done.reject("Initialization was cancelled before completing.");
        }
    }

    /** Phase 1: iterate all vault files and load valid cache entries synchronously (in batches). */
    private async loadFromCache() {
        const allFiles = this.queue.slice(); // snapshot
        this.queue = [];

        // Process in parallel batches to keep it fast without hammering IndexedDB.
        const CACHE_BATCH = 32;
        for (let i = 0; i < allFiles.length; i += CACHE_BATCH) {
            if (!this.active) break;

            const batch = allFiles.slice(i, i + CACHE_BATCH);
            await Promise.all(
                batch.map(async (file) => {
                    try {
                        const cached = await this.core.persister.loadFile(file.path);
                        if (cached && cached.time >= file.stat.mtime && cached.version === this.core.version) {
                            if (file.extension === "md") {
                                const data = MarkdownPage.from(cached.data as JsonMarkdownPage, (link) => link);
                                this.core.storeMarkdown(data);
                                this.cached++;
                                this.initialized++;
                                return;
                            }
                        }
                        // Cache miss or stale — queue for background import.
                        this.backgroundQueue.push(file);
                    } catch {
                        this.backgroundQueue.push(file);
                    }
                })
            );
        }
    }

    /** Phase 2: import files that weren't in the cache, respecting BATCH_SIZE concurrency. */
    private runNextBackground() {
        if (!this.active || this.current.length >= DatacoreInitializer.BATCH_SIZE) {
            return;
        }

        const next = this.backgroundQueue.pop();
        if (next) {
            this.current.push(next);

            (async () => {
                try {
                    await this.core.reload(next);
                    this.imported++;
                } catch {
                    this.skipped++;
                }
                this.initialized++;
                this.current.remove(next);
                this.runNextBackground();
            })();

            this.runNextBackground();
        } else if (this.current.length === 0) {
            this.active = false;
            this.done.resolve({
                durationMs: Date.now() - this.start,
                files: this.files,
                imported: this.imported,
                skipped: this.skipped,
                cached: this.cached,
            });
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
// Kept for potential future use.
