import { DatacoreApi } from "api/api";
import { Datacore } from "index/datacore";
import { DateTime } from "luxon";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, Settings } from "settings";

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

        new Setting(this.containerEl).setName("Views").setHeading();

        new Setting(this.containerEl)
            .setName("Pagination")
            .setDesc(
                "If enabled, splits up views into pages of results which can be traversed " +
                    "via buttons at the top and bottom of the view. This substantially improves " +
                    "the performance of large views, and can help with visual clutter. Note that " +
                    "this setting can also be set on a per-view basis."
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.defaultPagingEnabled).onChange(async (value) => {
                    await this.plugin.updateSettings({ defaultPagingEnabled: value });
                });
            });

        new Setting(this.containerEl)
            .setName("Default page size")
            .setDesc("The number of entries to show per page, by default. This can be overriden on a per-view basis.")
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
            .setName("Scroll on page change")
            .setDesc(
                "If enabled, table that are paged will scroll to the top of the table when the page changes. " +
                    "This can be overriden on a per-view basis."
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.scrollOnPageChange).onChange(async (value) => {
                    await this.plugin.updateSettings({ scrollOnPageChange: value });
                });
            });

        new Setting(this.containerEl).setName("Formatting").setHeading();

        new Setting(this.containerEl)
            .setName("Empty values")
            .setDesc("What to show for unset/empty properties.")
            .addText((text) => {
                text.setValue(this.plugin.settings.renderNullAs).onChange(async (value) => {
                    await this.plugin.updateSettings({ renderNullAs: value });
                });
            });

        new Setting(this.containerEl)
            .setName("Default date format")
            .setDesc(
                "The default format that dates are rendered in. Uses luxon date formatting (https://github.com/moment/luxon/blob/master/docs/formatting.md#formatting-with-tokens-strings-for-cthulhu)."
            )
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
            .setName("Default date/time format")
            .setDesc(
                "The default format that date-times are rendered in. Uses luxon date formatting (https://github.com/moment/luxon/blob/master/docs/formatting.md#formatting-with-tokens-strings-for-cthulhu)."
            )
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

        new Setting(this.containerEl).setName("Performance").setHeading();

        new Setting(this.containerEl)
            .setName("Inline fields")
            .setDesc(
                "If enabled, inline fields will be parsed in all documents. Finding inline fields requires a full text scan through each document, " +
                    "which noticably slows down indexing for large vaults. Disabling this functionality will mean metadata will only come from tags, links, and " +
                    "Properties / frontmatter"
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.indexInlineFields).onChange(async (value) => {
                    await this.plugin.updateSettings({ indexInlineFields: value });

                    // TODO: Request a full index drop + reindex for correctness.
                });
            });

        new Setting(this.containerEl)
            .setName("Importer threads")
            .setDesc("The number of importer threads to use for parsing metadata.")
            .addText((text) => {
                text.setValue("" + this.plugin.settings.importerNumThreads).onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (isNaN(parsed)) return;

                    await this.plugin.updateSettings({ importerNumThreads: parsed });
                });
            });

        new Setting(this.containerEl)
            .setName("Importer utilization")
            .setDesc("How much CPU time each importer thread should use, as a fraction (0.1 - 1.0).")
            .addText((text) => {
                text.setValue(this.plugin.settings.importerUtilization.toFixed(2)).onChange(async (value) => {
                    const parsed = parseFloat(value);
                    if (isNaN(parsed)) return;

                    const limited = Math.max(0.1, Math.min(1.0, parsed));
                    await this.plugin.updateSettings({ importerUtilization: limited });
                });
            });

        new Setting(this.containerEl)
            .setName("Maximum recursive render depth")
            .setDesc(
                "Maximum depth that objects will be rendered to (i.e., how many levels of subproperties " +
                    "will be rendered by default). This avoids infinite recursion due to self-referential objects " +
                    "and ensures that rendering objects is acceptably performant."
            )
            .addText((text) => {
                text.setValue(this.plugin.settings.maxRecursiveRenderDepth.toString()).onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (isNaN(parsed)) return;
                    await this.plugin.updateSettings({ maxRecursiveRenderDepth: parsed });
                });
            });
    }
}
