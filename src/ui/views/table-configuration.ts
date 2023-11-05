/** Central configuration for all Datacore views. */

export type MaybeArray<T> = T | T[];

/** User-facing configuration for a table view. */
export interface TableViewConfiguration {
    /** The columns to render in the table; order will be in the order the columns are defined. */
    columns?: (string | ColumnViewConfiguration)[];

    /** The initial sort on the table when it is viewed. */
    ["initial-sort"]?: MaybeArray<string | TableSortConfiguration>;

    /** The initial group on the table when it is viewed. */
    ["initial-group"]?: MaybeArray<string | TableGroupConfiguration>;

    /** Controls whether the table is visually sortable. */
    sortable?: boolean;

    /** Controls whether the table is visually groupable. */
    groupable?: boolean;

    /** Controls whether paging is enabled (and if numeric, the size of each page). */
    paging?: boolean | number;
}

export interface TableSortConfiguration {
    /** The column to sort on. */
    column: string;
    /** The direction of the sort; defaults to 'ascending'. */
    direction?: "ascending" | "descending";
}

export interface TableGroupConfiguration {
    /** The column to group on. */
    column: string;
    /** If present, whether to flatten the column before grouping (such as for tags). */
    flatten?: boolean;
}

/** Configuration for a column. */
export interface ColumnViewConfiguration {
    /** The ID of the column. */
    id?: string;
    /** An expression indicating the value to render. */
    value: string;
    /** If present, the special way to render the given field. */
    render?: string | ColumnRenderConfiguration;
    /** Distinct title for the column; can contain Markdown. */
    title?: string;
    /** Whether the column is visually sortable. */
    sortable?: boolean;
    /** Whether the column is visually groupable. */
    groupable?: boolean;
}

/** Configuration for special rendering for a column, such as rendering it as a 'rating'. */
export interface ColumnRenderConfiguration {
    /** The render mode to use for the given column. */
    type: string;

    /** Configuration for the given render configuration. */
    [key: string]: any;
}
