import { DatacoreApi } from "api/api";
import { Datacore } from "index/datacore";
import { DateTime } from "luxon";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, Settings } from "settings";
import { t } from "lang/helpers";

/** @internal Reactive data engine for your Obsidian.md vault. */
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

        // Primary visual elements (DatacoreJS and Datacore blocks).
        this.registerMarkdownCodeBlockProcessor(
            "datacorejs",
            async (source: string, el, ctx) => this.api.executeJs(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacorejsx",
            async (source: string, el, ctx) => this.api.executeJsx(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacorets",
            async (source: string, el, ctx) => this.api.executeTs(source, el, ctx, ctx.sourcePath),
            -100
        );

        this.registerMarkdownCodeBlockProcessor(
            "datacoretsx",
            async (source: string, el, ctx) => this.api.executeTsx(source, el, ctx, ctx.sourcePath),
            -100
        );

        // Useful debug and non-debug commands.
        // Drops the current index and reindexes all items.
        this.addCommand({
            id: "datacore-reindex-vault",
            name: t("REINDEX_VAULT"),
            callback: async () => {
                console.log("Datacore: dropping the datastore and reindexing all items.");
                await this.core.reindex();
            },
        });

        // Register JS highlighting for codeblocks.
        this.register(this.registerCodeblockHighlighting());

        // Initialize as soon as the workspace is ready.
        this.app.workspace.onLayoutReady(async () => this.core.initialize());

        // Make the API globally accessible from any context.
        window.datacore = this.api;
    }

    /** Register codeblock highlighting and return a closure which unregisters. */
    registerCodeblockHighlighting(): () => void {
        window.CodeMirror.defineMode("datacorejs", (config) => window.CodeMirror.getMode(config, "javascript"));
        window.CodeMirror.defineMode("datacorejsx", (config) => window.CodeMirror.getMode(config, "jsx"));
        window.CodeMirror.defineMode("datacorets", (config) => window.CodeMirror.getMode(config, "text/typescript"));
        window.CodeMirror.defineMode("datacoretsx", (config) =>
            window.CodeMirror.getMode(config, "text/typescript-jsx")
        );

        return () => {
            window.CodeMirror.defineMode("datacorejs", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacorejsx", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacorets", (config) => window.CodeMirror.getMode(config, "null"));
            window.CodeMirror.defineMode("datacoretsx", (config) => window.CodeMirror.getMode(config, "null"));
        };
    }

    /** Update the given settings to new values. */
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

        new Setting(this.containerEl).setName(t("VIEWS")).setHeading();

        new Setting(this.containerEl)
            .setName(t("PAGINATION"))
            .setDesc(t("PAGINATION_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.defaultPagingEnabled).onChange(async (value) => {
                    await this.plugin.updateSettings({ defaultPagingEnabled: value });
                });
            });

        new Setting(this.containerEl)
            .setName(t("DEFAULT_PAGE_SIZE"))
            .setDesc(t("DEFAULT_PAGE_SIZE_DESC"))
            .addDropdown((dropdown) => {
                const OPTIONS: Record<string, string> = {
                    "25": "25",
                    "50": "50",
                    "100": "100",
                    "200": "200",
                    "500": "500",
                };
                const current = "" + this.plugin.settings.defaultPageSize;
                if (!(current in OPTIONS)) OPTIONS[current] = current;

                dropdown
                    .addOptions(OPTIONS)
                    .setValue(current)
                    .onChange(async (value) => {
                        const parsed = parseFloat(value);
                        if (isNaN(parsed)) return;

                        await this.plugin.updateSettings({ defaultPageSize: parsed | 0 });
                    });
            });

        new Setting(this.containerEl)
            .setName(t("SCROLL_ON_PAGE_CHANGE"))
            .setDesc(t("SCROLL_ON_PAGE_CHANGE_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.scrollOnPageChange).onChange(async (value) => {
                    await this.plugin.updateSettings({ scrollOnPageChange: value });
                });
            });

        new Setting(this.containerEl).setName(t("FORMATTING")).setHeading();

        new Setting(this.containerEl)
            .setName(t("EMPTY_VALUES"))
            .setDesc(t("EMPTY_VALUES_DESC"))
            .addText((text) => {
                text.setValue(this.plugin.settings.renderNullAs).onChange(async (value) => {
                    await this.plugin.updateSettings({ renderNullAs: value });
                });
            });

        new Setting(this.containerEl)
            .setName(t("DEFAULT_DATE_FORMAT"))
            .setDesc(t("DEFAULT_DATE_FORMAT_DESC"))
            .addText((text) => {
                text.setValue(this.plugin.settings.defaultDateFormat).onChange(async (value) => {
                    // check if date format is valid
                    try {
                        DateTime.fromMillis(Date.now()).toFormat(value);
                    } catch {
                        return;
                    }
                    await this.plugin.updateSettings({ defaultDateFormat: value });
                });
            });

        new Setting(this.containerEl)
            .setName(t("DEFAULT_DATETIME_FORMAT"))
            .setDesc(t("DEFAULT_DATETIME_FORMAT_DESC"))
            .addText((text) => {
                text.setValue(this.plugin.settings.defaultDateTimeFormat).onChange(async (value) => {
                    try {
                        DateTime.fromMillis(Date.now()).toFormat(value);
                    } catch {
                        return;
                    }
                    await this.plugin.updateSettings({ defaultDateTimeFormat: value });
                });
            });

        new Setting(this.containerEl).setName(t("PERFORMANCE")).setHeading();

        new Setting(this.containerEl)
            .setName(t("INLINE_FIELDS"))
            .setDesc(t("INLINE_FIELDS_DESC"))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.indexInlineFields).onChange(async (value) => {
                    await this.plugin.updateSettings({ indexInlineFields: value });

                    // TODO: Request a full index drop + reindex for correctness.
                });
            });

        new Setting(this.containerEl)
            .setName(t("IMPORTER_THREADS"))
            .setDesc(t("IMPORTER_THREADS_DESC"))
            .addText((text) => {
                text.setValue("" + this.plugin.settings.importerNumThreads).onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (isNaN(parsed)) return;

                    await this.plugin.updateSettings({ importerNumThreads: parsed });
                });
            });

        new Setting(this.containerEl)
            .setName(t("IMPORTER_UTILIZATION"))
            .setDesc(t("IMPORTER_UTILIZATION_DESC"))
            .addText((text) => {
                text.setValue(this.plugin.settings.importerUtilization.toFixed(2)).onChange(async (value) => {
                    const parsed = parseFloat(value);
                    if (isNaN(parsed)) return;

                    const limited = Math.max(0.1, Math.min(1.0, parsed));
                    await this.plugin.updateSettings({ importerUtilization: limited });
                });
            });

        new Setting(this.containerEl)
            .setName(t("MAX_RECURSIVE_RENDER_DEPTH"))
            .setDesc(t("MAX_RECURSIVE_RENDER_DEPTH_DESC"))
            .addText((text) => {
                text.setValue(this.plugin.settings.maxRecursiveRenderDepth.toString()).onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (isNaN(parsed)) return;
                    await this.plugin.updateSettings({ maxRecursiveRenderDepth: parsed });
                });
            });
    }
}
