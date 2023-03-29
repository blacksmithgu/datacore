import { DatacoreApi } from "api/plugin-api";
import { Datacore } from "index/datacore";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, Settings } from "settings";

/** Reactive data engine for your Obsidian.md vault. */
export default class DatacorePlugin extends Plugin {
    /** Plugin-wide default settings. */
    public settings: Settings;

    /** Central internal state. */
    public core: Datacore;
    /** Externally visible API for querying. */
    public api: DatacoreApi;

    async onload() {
        this.settings = Object.assign(DEFAULT_SETTINGS, (await this.loadData()) ?? {});
        this.addSettingTab(new GeneralSettingsTab(this.app, this));

        this.addChild((this.core = new Datacore(this.app, this.manifest.version, this.settings)));
        this.api = new DatacoreApi(this.core);

        if (!this.app.workspace.layoutReady) {
            this.app.workspace.onLayoutReady(async () => this.core.initialize());
        } else {
            this.core.initialize();
        }

        // Make the API globally accessible from any context.
        window.datacore = this.api;

        console.log(`Datacore: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`);
    }

    onunload() {
        console.log(`Datacore: version ${this.manifest.version} unloaded.`);
    }

    async updateSettings(settings: Partial<Settings>) {
        Object.assign(this.settings, settings);
        await this.saveData(this.settings);
    }
}

/** Datacore Settings Tab. */
class GeneralSettingsTab extends PluginSettingTab {
    constructor(app: App, private plugin: DatacorePlugin) {
        super(app, plugin);
    }

    public display(): void {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "General Settings" });

        new Setting(this.containerEl)
            .setName("Importer Threads")
            .setDesc("The number of importer threads to use for parsing metadata.")
            .addSlider((slider) => {
                slider
                    .setLimits(1, 8, 1)
                    .setValue(this.plugin.settings.importerNumThreads)
                    .onChange(async (value) => await this.plugin.updateSettings({ importerNumThreads: value }));
            });

        new Setting(this.containerEl)
            .setName("Importer Utilization")
            .setDesc("How much CPU time each importer thread should use (10% - 100%).")
            .addSlider((slider) => {
                slider
                    .setLimits(0.1, 1.0, 0.1)
                    .setValue(this.plugin.settings.importerUtilization)
                    .onChange(async (value) => await this.plugin.updateSettings({ importerUtilization: value }));
            });
    }
}
