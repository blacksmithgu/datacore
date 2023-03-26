import { Datastore } from "index/datastore";
import { FileImporter } from "index/web-worker/importer";
import { Plugin } from "obsidian";

/** Reactive data engine for your Obsidian.md vault. */
export default class DatacorePlugin extends Plugin {
    /** Plugin-wide default settings. */
    public settings: {};

    /** Handles all asynchronous file imports */
    public importer: FileImporter;
    /** Central data store which stores data. */
    public store: Datastore;

    async onload() {
        console.log(`Datacore: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`);

        this.store = new Datastore();
        this.addChild(this.importer = new FileImporter(this.app.vault, this.app.metadataCache));

        // Schedule all files to be imported.
        this.app.metadataCache.on('resolved', async () => {
            console.log(`Datacore: Metadata Cache is ready, starting file import.`);
            const start = Date.now();
            const promises: Promise<any>[] = [];
            for (let file of this.app.vault.getMarkdownFiles()) {
                promises.push(this.importer.import(file));
            }

            await Promise.all(promises);
            console.log(`Imported all files in ${(Date.now() - start)/1000.0}ms`);
        });
    }

    public onunload() {
        console.log(`Datacore: version ${this.manifest.version} unloaded.`);
    }
}