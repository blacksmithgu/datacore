import localforage from "localforage";

/** A piece of data that has been cached for a specific version and time. */
export interface Cached<T> {
    /** The version of the plugin that the data was written to cache with. */
    version: string;
    /** The UNIX epoch time in milliseconds that the data was written to cache. */
    time: number;
    /** The data that was cached. */
    data: T;
}

/** Simpler wrapper for a file-backed cache for arbitrary metadata. */
export class LocalStorageCache {
    public persister: LocalForage;

    public constructor(public appId: string, public version: string) {
        this.persister = localforage.createInstance({
            name: "datacore/cache/" + appId,
            driver: [localforage.INDEXEDDB],
            description: "Cache metadata about files and sections in the datacore index.",
        });
    }

    /** Drop the entire cache instance and re-create a new fresh instance. */
    public async recreate() {
        await localforage.dropInstance({ name: "datacore/cache/" + this.appId });

        this.persister = localforage.createInstance({
            name: "datacore/cache/" + this.appId,
            driver: [localforage.INDEXEDDB],
            description: "Cache metadata about files and sections in the datacore index.",
        });
    }

    /** Load file metadata by path. */
    public async loadFile(path: string): Promise<Cached<Partial<any>> | null | undefined> {
        return this.persister.getItem(this.fileKey(path)).then((raw) => {
            return raw as any as Cached<Partial<any>>;
        });
    }

    /** Store file metadata by path. */
    public async storeFile(path: string, data: Partial<any>): Promise<void> {
        await this.persister.setItem(this.fileKey(path), {
            version: this.version,
            time: Date.now(),
            data: data,
        });
    }

    /** Drop old file keys that no longer exist. */
    public async synchronize(existing: string[] | Set<string>): Promise<Set<string>> {
        let keys = new Set(await this.allFiles());
        for (let exist of existing) keys.delete(exist);

        // Any keys remaining after deleting existing keys are non-existent keys that should be cleared from cache.
        for (let key of keys) await this.persister.removeItem(this.fileKey(key));

        return keys;
    }

    /** Obtain a list of all metadata keys. */
    public async allKeys(): Promise<string[]> {
        return this.persister.keys();
    }

    /** Obtain a list of all persisted files. */
    public async allFiles(): Promise<string[]> {
        let keys = await this.allKeys();
        return keys.filter((k) => k.startsWith("file:")).map((k) => k.substring(5));
    }

    /** Get a unique key for a given file path. */
    public fileKey(path: string): string {
        return "file:" + path;
    }
}
