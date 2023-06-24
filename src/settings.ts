/** All datacore settings. */
export interface Settings {
    /** The number of threads the importer will use for importing. */
    importerNumThreads: number;
    /** The CPU utilization (between 0.1 and 1.0) that importer threads should use. */
    importerUtilization: number;

    /** Are JS views enabled? */
    enableJs: boolean;

    /** Some sane limits for paging and recursive rendering. */
    defaultPageSize: number;
    maxRecursiveRenderDepth: number;

    /** The default format that dates are rendered in (using luxon's moment-like formatting). */
    defaultDateFormat: string;
    /** The default format that date-times are rendered in (using luxons moment-like formatting). */
    defaultDateTimeFormat: string;
    /** Markdown text for how to render null values in tables or similar. */
    renderNullAs: string;
}

/** Default settings for the plugin. */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze<Settings>({
    importerNumThreads: 2,
    importerUtilization: 0.75,

    enableJs: true,

    defaultPageSize: 50,
    maxRecursiveRenderDepth: 5,

    defaultDateFormat: "MMMM dd, yyyy",
    defaultDateTimeFormat: "h:mm a - MMMM dd, yyyy",
    renderNullAs: "-",
});
