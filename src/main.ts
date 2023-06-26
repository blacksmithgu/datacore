import { DatacoreLocalApi } from "api/local-api";
import { DatacoreApi } from "api/plugin-api";
import { Datacore } from "index/datacore";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { createElement, render } from "preact";
import { DEFAULT_SETTINGS, Settings } from "settings";
import { IndexStatusBar } from "ui/index-status";
import { JavascriptRenderer } from "ui/javascript";

/** Reactive data engine for your Obsidian.md vault. */
export default class DatacorePlugin extends Plugin {
    /** Plugin-wide default settings. */
    public settings: Settings;

    /** Central internal state. */
    public core: Datacore;
    /** Externally visible API for querying. */
    public api: DatacoreApi;

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) ?? {});
        this.addSettingTab(new GeneralSettingsTab(this.app, this));

        // Initialize the core API for usage in all views and downstream apps.
        this.addChild((this.core = new Datacore(this.app, this.manifest.version, this.settings)));
        this.api = new DatacoreApi(this.core);

        // Add a visual aid for what datacore is currently doing.
        this.mountIndexState(this.addStatusBarItem(), this.core);

        // Add a hook for all datacorejs blocks.
        this.registerMarkdownCodeBlockProcessor(
            "datacorejs",
            (source, el, ctx) => {
                const localApi = new DatacoreLocalApi(this.api, ctx.sourcePath);
                ctx.addChild(new JavascriptRenderer(localApi, el, ctx.sourcePath, source));
            },
            -100
        );

        // Initialize as soon as the workspace is rewady.
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

    /** Render datacore indexing status using the index. */
    mountIndexState(root: HTMLElement, core: Datacore): void {
        render(createElement(IndexStatusBar, { datacore: core }), root);

        // Unmount on exit.
        this.register(() => {
            render(() => null, root);
        });
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
            .addText((text) => {
                text.setValue("" + this.plugin.settings.importerNumThreads).onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (isNaN(parsed)) return;

                    this.plugin.updateSettings({ importerNumThreads: parsed });
                });
            });

        new Setting(this.containerEl)
            .setName("Importer Utilization")
            .setDesc("How much CPU time each importer thread should use, as a fraction (0.1 - 1.0).")
            .addText((text) => {
                text.setValue(this.plugin.settings.importerUtilization.toFixed(2)).onChange(async (value) => {
                    const parsed = parseFloat(value);
                    if (isNaN(parsed)) return;

                    const limited = Math.max(0.1, Math.min(1.0, parsed));
                    this.plugin.updateSettings({ importerUtilization: limited });
                });
            });
    }
}
