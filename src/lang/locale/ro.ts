// Română

export default {
    // General
    VIEWS: "Views",
    FORMATTING: "Formatting",
    PERFORMANCE: "Performance",

    // Views settings
    PAGINATION: "Pagination",
    PAGINATION_DESC: "If enabled, splits up views into pages of results which can be traversed via buttons at the top and bottom of the view. This substantially improves the performance of large views, and can help with visual clutter. Note that this setting can also be set on a per-view basis.",
    DEFAULT_PAGE_SIZE: "Default page size",
    DEFAULT_PAGE_SIZE_DESC: "The number of entries to show per page, by default. This can be overriden on a per-view basis.",
    SCROLL_ON_PAGE_CHANGE: "Scroll on page change",
    SCROLL_ON_PAGE_CHANGE_DESC: "If enabled, table that are paged will scroll to the top of the table when the page changes. This can be overriden on a per-view basis.",

    // Formatting settings
    EMPTY_VALUES: "Empty values",
    EMPTY_VALUES_DESC: "What to show for unset/empty properties.",
    DEFAULT_DATE_FORMAT: "Default date format",
    DEFAULT_DATE_FORMAT_DESC: "The default format that dates are rendered in. Uses luxon date formatting.",
    DEFAULT_DATETIME_FORMAT: "Default date/time format",
    DEFAULT_DATETIME_FORMAT_DESC: "The default format that date-times are rendered in. Uses luxon date formatting.",

    // Performance settings
    INLINE_FIELDS: "Inline fields",
    INLINE_FIELDS_DESC: "If enabled, inline fields will be parsed in all documents. Finding inline fields requires a full text scan through each document, which noticably slows down indexing for large vaults. Disabling this functionality will mean metadata will only come from tags, links, and Properties / frontmatter",
    IMPORTER_THREADS: "Importer threads",
    IMPORTER_THREADS_DESC: "The number of importer threads to use for parsing metadata.",
    IMPORTER_UTILIZATION: "Importer utilization",
    IMPORTER_UTILIZATION_DESC: "How much CPU time each importer thread should use, as a fraction (0.1 - 1.0).",
    MAX_RECURSIVE_RENDER_DEPTH: "Maximum recursive render depth",
    MAX_RECURSIVE_RENDER_DEPTH_DESC: "Maximum depth that objects will be rendered to (i.e., how many levels of subproperties will be rendered by default). This avoids infinite recursion due to self-referential objects and ensures that rendering objects is acceptably performant.",

    // Commands
    REINDEX_VAULT: "Reindex entire vault",

    // Loading
    LOADING_TITLE: "Datacore is getting ready...",
    VIEW_RENDERING: "< View is rendering >",};
