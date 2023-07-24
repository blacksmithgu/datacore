/** All datacore settings. */
export interface Settings {
    /** The number of threads the importer will use for importing. */
    importerNumThreads: number;
    /** The CPU utilization (between 0.1 and 1.0) that importer threads should use. */
    importerUtilization: number;

    /** Are JS views enabled? */
    enableJs: boolean;

    /**
     * Whether views are paged by default. This is an important performance optimization,
     * since showing hundreds or thousands of results can be fairly slow!
     */
    defaultPagingEnabled: boolean;
    /** Default paging size for all views (number of entries per page.) */
    defaultPageSize: number;
    /**
     * Maximum depth that objects will be rendered to (i.e., how many levels of subproperties
     * will be rendered by default).
     */
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

    defaultPagingEnabled: true,
    defaultPageSize: 50,
    maxRecursiveRenderDepth: 5,

    defaultDateFormat: "MMMM dd, yyyy",
    defaultDateTimeFormat: "h:mm a - MMMM dd, yyyy",
    renderNullAs: "\-",
});
