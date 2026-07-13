import { App } from "obsidian";
import { GroupElement, Grouping, Literal } from "expression/literal";
import { TreeTableRowData } from "utils/tree";
import { GroupingConfig, TableColumn } from "./views/table";
import { Context as ReactContext, createContext, Dispatch, PropsWithChildren, ReactNode, useContext } from "preact/compat";
import { SortDirection, SortOn } from "./views/table-dispatch";

export type TableKind = "table" | "tree-table";

export type TableData<T, K extends TableKind> = K extends "tree-table" ? TreeTableRowData<T> : T;

type CreateRowFn<E, K extends TableKind = "table"> = K extends "table"
    ? (
          prevElement: TableData<E, "table"> | null,
          parentGroup: GroupElement<TableData<E, "table">> | null,
          app: App
      ) => Promise<unknown>
    : (
          prevElement: TableData<E, "tree-table"> | null,
          parentElement: TableData<E, "tree-table"> | null,
          parentGroup: GroupElement<TableData<E, "tree-table">> | null,
          app: App
      ) => Promise<unknown>;

type ClickCallbackFn<T, K extends TableKind = "table"> = K extends "table"
    ? (
          previousElement: GroupElement<T> | T | null,
          element: GroupElement<T> | T | null,
          groupConfig?: GroupingConfig<T>
      ) => () => Promise<void>
    : (
          previousElement: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
          parent: TreeTableRowData<T> | null,
          maybeGroup: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
          groupConfig?: GroupingConfig<TreeTableRowData<T>>
      ) => () => Promise<void>;

type TreeTableProps<T> = {
    id?: (obj: T) => string;
    childSelector: (raw: T) => T[];
};

export type GenericTableViewProps<T, K extends TableKind = "table"> = {
    /** The type of table to render. */
    type: K;
    /** The columns to render in the table. */
    columns: TableColumn<T>[];
    /** The rows to render; may potentially be grouped or just a plain array. */
    rows: T[] | Grouping<T>;
    groupings?:
        | GroupingConfig<TableData<T, K>>
        | GroupingConfig<TableData<T, K>>[]
        | ((key: Literal, rows: Grouping<TableData<T, K>>) => Literal | ReactNode);
    /**
     * If set to a boolean - enables or disables paging.
     * If set to a number, paging will be enabled with the given number of rows per page.
     */
    paging?: boolean | number;

    /**
     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.
     * If a number, will scroll only if the number is greater than the current page size.
     **/
    scrollOnPaging?: boolean | number;

    /** The fields to sort the view on, if relevant. */
    sortOn?: SortOn[];

    /** whether this table allows creation new elements. */
    creatable?: boolean;
    createRow?: CreateRowFn<T, K>;
} & (K extends "tree-table" ? TreeTableProps<T> : {});

export type GenericTableState<T, K extends TableKind = "table"> = {
    /** mapping of column ids to sort directions */
    sorts: Record<string, SortDirection>;
} & (K extends "tree-table"
    ? {
          /** mapping of row ids to whether they are open or not */
          openMap: Map<string, boolean>;
          /** function to get the id of a row */
          id: (obj: T) => string;
      }
    : {});

export type GenericTableAction<T, K extends TableKind = "table"> =
    | {
          type: "sort-column";
          column: string;
          direction: SortDirection | undefined;
      }
    | (K extends "tree-table"
          ?
                | {
                      type: "row-expand";
                      row: T;
                      newValue: boolean;
                  }
                | { type: "open-map-changed"; newValue: Map<string, boolean> }
          : never);

export type GenericTableContext<T, K extends TableKind = "table"> = {
    state: GenericTableState<T, K>;
    dispatch: Dispatch<GenericTableAction<T, K>>;
    clickCallbackFactory: ClickCallbackFn<T, K>;
};

export const GENERIC_TABLE_CONTEXT = createContext<GenericTableContext<any, any> | null>(null);

export function useGenericTableContext<T, K extends TableKind = "table">() {
    return useContext(GENERIC_TABLE_CONTEXT) as GenericTableContext<T, K>;
}

export function typedTableContext<T, K extends TableKind = "table">() {
    return GENERIC_TABLE_CONTEXT as ReactContext<GenericTableContext<T, K>>;
}

/**
 * Provides a context for a generic table.
 * @hidden
 * @group Components
 */

export function TableContextProvider<T, K extends TableKind = "table">({
    children,
    ...props
}: PropsWithChildren<GenericTableContext<T, K>>) {
    const Context = typedTableContext<T, K>();
	return <Context.Provider value={props}>{children}</Context.Provider>;
}
