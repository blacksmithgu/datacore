import { Datastore } from "index/datastore";
import { LocalStorageCache } from "index/persister";
import { FileImporter, ImportThrottle } from "index/web-worker/importer";
import { ImportResult } from "index/web-worker/message";
import { App, Component, MetadataCache, TAbstractFile, TFile, Vault } from "obsidian";
import { Settings } from "settings";

/** Central API object; handles initialization, events, debouncing, and access to datacore functionality. */
export class Datacore extends Component {
    /** Access to the obsidian vault. */
    vault: Vault;
    /** Provides access to per-(markdown)-file metadata. */
    metadataCache: MetadataCache;

    /** In-memory index over all stored metadata. */
    datastore: Datastore;
    /** Asynchronous multi-threaded file importer with throttling. */
    importer: FileImporter;
    /** Local-storage backed cache of metadata objects. */
    persister: LocalStorageCache;
    /** If true, datacore is fully hydrated and all files have been indexed. */
    initialized: boolean;

    constructor(public app: App, public version: string, public settings: Settings) {
        super();

        this.datastore = new Datastore();
        this.initialized = false;

        this.addChild(this.importer = new FileImporter(app.vault, app.metadataCache, () => {
            return {
                workers: settings.importerNumThreads,
                utilization: Math.max(0.1, Math.min(1.0, settings.importerUtilization))
            } as ImportThrottle;
        }));
    }

    /** Obtain the current index revision, for determining if anything has changed. */
    get revision() {
        return this.datastore.revision;
    }

    /** Initialize datacore by scanning persisted caches and all available files, and queueing parses as needed. */
    initialize() {
        // The metadata cache is updated on initial file index and file loads.
        this.registerEvent(this.metadataCache.on("resolve", file => this.reload(file)));

        // Renames do not set off the metadata cache; catch these explicitly.
        this.registerEvent(this.vault.on("rename", this.rename, this));

        // File creation does cause a metadata change, but deletes do not. Clear the caches for this.
        this.registerEvent(this.vault.on("delete", af => {
            // TODO: Update index.
        }));

        // Asynchronously initialize actual content in the background using a lifecycle-respecting object.
        const init = new DatacoreInitializer(this, this.vault.getMarkdownFiles(), () => {
            this.initialized = true;
            this.removeChild(init);
        });

        this.addChild(init);
    }

    private rename(file: TAbstractFile, oldPath: string) {
        // Do nothing right now.
    }

    /** Queue a file for reloading; this is done asynchronously in the background and may take a few seconds. */
    private async reload(file: TFile): Promise<{}> {
        return {};
    }

    /** Perform an asynchronous data import of the given file, adding it to the index when finished. */
    private async import(file: TFile): Promise<void> {
        return this.importer.import<ImportResult>(file).then(result => {
            // TODO: Add to index.
        });
    }
}

/** Lifecycle-respecting file queue which will import files, reading them from the file cache if needed. */
export class DatacoreInitializer extends Component {
    /** Number of concurrent operations the initializer will perform. */
    static BATCH_SIZE: number = 8;

    /** Whether the initializer should continue to run. */
    private active: boolean;
    /** Queue of files to still import. */
    private queue: TFile[];
    /** The files actively being imported. */
    private current: TFile[];

    constructor(public core: Datacore, files: TFile[], public finish: () => void) {
        super();

        this.active = true;
        this.queue = ([] as TFile[]).concat(files);
    }

    async onload() {
        // On load, start loading files one by one and importing them into datacore.
        // Start by queueing BATCH_SIZE elements.
    }

    /** Handle a specific file. */
    async handle(file: TFile) {

    }

    onunload() {
        this.active = false;
    }
}