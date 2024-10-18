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
    /** If set, views will scroll to the top of the view on page changes. */
    scrollOnPageChange: boolean;

    /**
     * Maximum depth that objects will be rendered to (i.e., how many levels of subproperties
     * will be rendered by default). This avoids infinite recursion due to self referential objects
     * and also ensures that rendering objects is acceptably performant.
     */
    maxRecursiveRenderDepth: number;

    /** The default format that dates are rendered in (using luxon's moment-like formatting). */
    defaultDateFormat: string;
    /** The default format that date-times are rendered in (using luxons moment-like formatting). */
    defaultDateTimeFormat: string;
    /** Markdown text for how to render null values in tables or similar. */
    renderNullAs: string;

    /** Whether to index inline fields by default. Inline field parsing requires a full scan of the document, which can make indexing take 2-3x longer. */
    indexInlineFields: boolean;

    /** Whether to check task items off recursively in datacore views */
    recursiveTaskCompletion: boolean;

    /** Name of the inline field in which to store completion date/time */
    taskCompletionText: string;

    /** If enabled, automatic completions will use emoji shorthand ✅ YYYY-MM-DD instead of [completion:: date]. */
    taskCompletionUseEmojiShorthand: boolean;
    /** Whether to index list and task item text and states. Indexing lists & tasks requires some additional regex parsing which makes indexing modestly slower. */
    indexListItems: boolean;
}

/** Default settings for the plugin. */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze<Settings>({
    importerNumThreads: 2,
    importerUtilization: 0.75,

    enableJs: false,

    defaultPagingEnabled: true,
    defaultPageSize: 50,
    scrollOnPageChange: false,

    maxRecursiveRenderDepth: 5,

    defaultDateFormat: "MMMM dd, yyyy",
    defaultDateTimeFormat: "h:mm a - MMMM dd, yyyy",

    renderNullAs: "-",

    indexInlineFields: true,
    recursiveTaskCompletion: false,
    taskCompletionText: "completedAt",
    taskCompletionUseEmojiShorthand: false,
    indexListItems: true,
});
