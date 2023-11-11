export type MaybeArray<T> = T | T[];

/** Configuration for a list element. */
export interface ListViewConfiguration {
    ["initial-sort"]: ListSortConfiguration[];
}

export interface ListSortConfiguration {
    /** The value-bearing expression to sort on. */
    expression: string;
    /** The direction of the sort; defaults to 'ascending'. */
    direction?: "ascending" | "descending";
}
