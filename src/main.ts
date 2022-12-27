import { Plugin } from "obsidian";

/** Reactive data engine for your Obsidian.md vault. */
export default class DatacorePlugin extends Plugin {
    /** Plugin-wide default settings. */
    public settings: {};

    async onload() {
        console.log(`Datacore: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`);
    }

    public onunload() {
        console.log(`Datacore: version ${this.manifest.version} unloaded.`);
    }
}