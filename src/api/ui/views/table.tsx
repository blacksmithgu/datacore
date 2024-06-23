import { Literal, Literals } from "expression/literal";
import { CURRENT_FILE_CONTEXT, DATACORE_CONTEXT, Lit } from "../../../ui/markdown";
import { useInterning, useStableCallback } from "../../../ui/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";

import { Fragment, VNode, isValidElement } from "preact";
import { Reducer, useContext, useMemo, useReducer, Dispatch } from "preact/hooks";
import { Grouping } from "../grouping";
import { ControlledPager } from "./paging";

import "styles/reactive-table.css";

/** Contains only the actual relevant state for a table (i.e., excluding initial props). */
export interface TableState<T> {
    /** The columns in the table; they will be rendered in the order they show up in the array. */
    columns: TableColumn<T>[];

    /** Whether the table can be sorted. */
    sortable?: boolean;
    /** The fields to sort the view on, if relevant. */
    sortOn?: SortOn[];

    /** Whether the table can be grouped. */
    groupable?: boolean;
    /** The fields to group the view on, if relevant. */
    groupOn?: GroupOn[];

    /**
     * If a boolean, enables/disables paging with the default configuration. If a number, paging will be
     * enabled with the given number of entries per page.
     */
    paging?: number | boolean;
    /** The current page the view is on, if paging is enabled. */
    page?: number;
}

/** The sort direction of a sort. */
export type SortDirection = "ascending" | "descending";

/** The ways that the table can be sorted. */
export type SortOn = { type: "column"; id: string; direction: SortDirection };

/** The ways that the data in the table can be grouped. */
export type GroupOn = { type: "column"; id: string; flatten?: boolean };

export interface TableColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | VNode | (() => string | VNode);

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
    render?: (value: V, object: T) => Literal | VNode;

    /** Optional comparator function which will be used for sorting; if not present, the default value comparator will be used instead. */
    comparator?: (first: V, second: V, firstObject: T, secondObject: T) => number;

    /** Enables or disables sorting on this column. */
    sortable?: boolean;

    /** Enables or disables grouping on this column. */
    groupable?: boolean;

    /** enables or disables editing on this column. */
    editable?: boolean;
    /** called when the value is updated via editing */
    update?: (value: V) => any;
}

/** Low level table view which handles state transitions via the given dispatcher. */
export function ControlledTableView<T>(props: TableState<T> & { rows: T[]; dispatch: Dispatch<TableAction> }) {
    const settings = useContext(DATACORE_CONTEXT).settings;

    // Cache columns by reference equality of the specific columns. Columns have various function references
    // inside them and so cannot be compared by value equality.
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });

    // Filter out any grouping columns, as those will be shown as groups instead.
    const visualColumns = useMemo(() => {
        if (!props.groupOn) return columns;
        else return columns.filter((col) => !props.groupOn!.some((group) => group.id == col.id));
    }, [columns, props.groupOn]);

    const rawGroups = useInterning(props.groupOn, (a, b) => Literals.compare(a, b) == 0);
    const groups = useMemo(() => {
        return rawGroups
            ?.map((group) => {
                const column = columns.find((col) => col.id == group.id);
                if (!column) return undefined;
                if (!column.groupable) return undefined;

                return { column: column, flatten: group.flatten, comparator: column.comparator, value: column.value };
            })
            .filter((x) => !!x);
    }, [columns, rawGroups]);

    // Cache sorts by value equality and filter to only sortable valid fields.
    const rawSorts = useInterning(props.sortOn, (a, b) => Literals.compare(a, b) == 0);
    const sorts = useMemo(() => {
        return rawSorts?.filter((sort) => {
            const column = columns.find((col) => col.id == sort.id);
            return column && (column.sortable ?? true);
        });
    }, [columns, rawSorts]);

    // Apply sorting to the rows as appropriate.
    const rows = useMemo(() => {
        if (sorts == undefined || sorts.length == 0) return props.rows;

        return ([] as T[]).concat(props.rows).sort((a, b) => {
            for (let sortKey of sorts) {
                const column = columns.find((col) => col.id == sortKey.id);
                if (!column) continue;

                const comparer = column.comparator ?? DEFAULT_TABLE_COMPARATOR;
                const direction = sortKey.direction === "ascending" ? 1 : -1;
                const result = direction * comparer(column.value(a), column.value(b), a, b);
                if (result != 0) return result;
            }

            return 0;
        });
    }, [props.rows, sorts]);

    // Then group if grouping is set.
    const groupedRows: Grouping<T> = useMemo(() => {
        if (groups == undefined || groups.length == 0) return Grouping.leaf(rows);

        return Grouping.groupBy(
            rows,
            groups.map((g) => ({
                flatten: g!.flatten,
                value: g!.value,
                comparator: g!.comparator
                    ? (a: Literal, b: Literal) => g!.comparator!(g!.value(a as T), g!.value(b as T), a as T, b as T)
                    : undefined,
            }))
        );
    }, [rows, groups]);

    // And finally apply pagination.
    const pageSize = typeof props.paging === "number" ? props.paging : settings.defaultPageSize;
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

    // Slice the groups to respect paging.
    const pagedGroupedRows = useMemo(() => {
        if (!props.paging) return groupedRows;

        const currentPage = props.page ?? 0;
        return Grouping.slice(groupedRows, currentPage * pageSize, (currentPage + 1) * pageSize);
    }, [props.paging, props.page, pageSize, groupedRows]);

    return (
        <table className="datacore-table">
            <thead>
                <tr className="datacore-table-header-row">
                    {visualColumns.map((col) => (
                        <TableHeaderCell
                            column={col}
                            sort={props.sortOn?.find((s) => s.id == col.id)?.direction}
                            sortable={(props.sortable ?? true) && (col.sortable ?? true)}
                            dispatch={props.dispatch}
                        />
                    ))}
                </tr>
            </thead>
            <tbody>
                <TableBody level={0} columns={visualColumns} rows={pagedGroupedRows} dispatch={props.dispatch} />
            </tbody>
            {/* Lowermost table footer contains paging. */}
            {props.paging !== false && (
                <tfoot>
                    <tr>
                        <td colSpan={visualColumns.length}>
                            <ControlledPager
                                totalPages={totalPages}
                                page={props.page ?? 0}
                                setPage={(page) => props.dispatch({ type: "set-page", page })}
                            />
                        </td>
                    </tr>
                </tfoot>
            )}
        </table>
    );
}

/** An individual column cell in the table. */
export function TableHeaderCell<T>({
    column,
    sort,
    sortable,
    dispatch,
}: {
    column: TableColumn<T>;
    sort?: SortDirection;
    sortable: boolean;
    dispatch: Dispatch<TableAction>;
}) {
    const header: string | VNode = useMemo(() => {
        if (!column.title) {
            return column.id;
        } else if (typeof column.title === "function") {
            return column.title();
        } else {
            return column.title;
        }
    }, [column.id, column.title]);

    const sortClicked = useStableCallback(
        (_event: MouseEvent) => {
            if (sort == undefined) dispatch({ type: "sort-column", column: column.id, direction: "ascending" });
            else if (sort == "ascending") dispatch({ type: "sort-column", column: column.id, direction: "descending" });
            else dispatch({ type: "sort-column", column: column.id, direction: undefined });
        },
        [sort, dispatch, column.id]
    );

    // We use an internal div to avoid flex messing with the table layout.
    return (
        <th className="datacore-table-header-cell">
            <div className="datacore-table-header-cell-content">
                {sortable && <SortButton className="datacore-table-sort" direction={sort} onClick={sortClicked} />}
                <div onClick={sortClicked} className="datacore-table-header-title">
                    {header}
                </div>
            </div>
        </th>
    );
}

export function TableBody<T>({
    level,
    columns,
    rows,
    dispatch,
}: {
    level: number;
    columns: TableColumn<T>[];
    rows: Grouping<T>;
    dispatch: Dispatch<TableAction>;
}) {
    if (rows.type === "leaf") {
        return (
            <Fragment>
                {rows.elements.map((row) => (
                    <TableRow level={level} row={row} columns={columns} />
                ))}
            </Fragment>
        );
    } else {
        return (
            <Fragment>
                {rows.elements.map((group) => (
                    <Fragment>
                        <TableGroupHeader level={level} value={group.key} width={columns.length} dispatch={dispatch} />
                        <TableBody level={level + 1} columns={columns} rows={group.value} dispatch={dispatch} />
                    </Fragment>
                ))}
            </Fragment>
        );
    }
}

export function TableGroupHeader<T>({
    level,
    value,
    width,
    dispatch,
}: {
    level: number;
    value: Literal;
    width: number;
    dispatch: Dispatch<TableAction>;
}) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);
    return (
        <tr className="datacore-table-group-header">
            <td colSpan={width}>
                <Lit sourcePath={sourcePath} inline={true} value={value} />
            </td>
        </tr>
    );
}

/** A single row inside the table. */
export function TableRow<T>({ level, row, columns }: { level: number; row: T; columns: TableColumn<T>[] }) {
    return (
        <tr className="datacore-table-row" style={level ? `padding-left: ${level * 5}px` : undefined}>
            {columns.map((col) => (
                <TableRowCell row={row} column={col} />
            ))}
        </tr>
    );
}

/** A single cell inside of a row of the table. */
export function TableRowCell<T>({ row, column }: { row: T; column: TableColumn<T> }) {
    const value = useMemo(() => column.value(row), [row, column.value]);
    const renderable = useMemo(() => {
        if (column.render) return column.render(value, row);
        else return value;
    }, [row, column.render, value]);
    const rendered = useAsElement(renderable);

    return <td className="datacore-table-cell">{rendered}</td>;
}

/** Provides a sort button that has a click handler. */
export function SortButton({
    direction,
    onClick,
    className,
}: {
    direction?: SortDirection;
    onClick?: (evt: MouseEvent) => any;
    className?: string;
}) {
    const icon = useMemo(() => {
        if (direction == "ascending") return faSortDown;
        else if (direction == "descending") return faSortUp;
        return faSort;
    }, [direction]);

    return (
        <div onClick={onClick} className={className}>
            <FontAwesomeIcon icon={icon} />
        </div>
    );
}

/** Ensure that a given literal or element input is rendered as a JSX.Element. */
function useAsElement(element: VNode | Literal): VNode {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return useMemo(() => {
        if (isValidElement(element)) {
            return element as VNode;
        } else {
            return <Lit sourcePath={sourcePath} inline={false} value={element as any} />;
        }
    }, [element]);
}

/** Default comparator for sorting on a table column. */
export const DEFAULT_TABLE_COMPARATOR: <T>(a: Literal, b: Literal, ao: T, bo: T) => number = (a, b, _ao, _bo) =>
    Literals.compare(a, b);

/////////////////
// Table Hooks //
/////////////////

export type TableAction =
    | { type: "reset-all" }
    | { type: "set-page"; page: number }
    | { type: "sort-column"; column: string; direction?: "ascending" | "descending" };

/** Central reducer which updates table state predictably. */
export function tableReducer<T>(state: TableState<T>, action: TableAction): TableState<T> {
    switch (action.type) {
        case "reset-all":
            return {
                ...state,
                sortOn: undefined,
            };
        case "set-page":
            return {
                ...state,
                page: action.page,
            };
        case "sort-column":
            if (action.direction == undefined) {
                return {
                    ...state,
                    sortOn: undefined,
                };
            } else {
                return {
                    ...state,
                    sortOn: [
                        {
                            type: "column",
                            id: action.column,
                            direction: action.direction ?? "ascending",
                        },
                    ],
                };
            }
    }

    // In case of ignored operations or malformed requests.
    console.warn(`datacore: Encountered unrecognized table operation: ${action}`);
    return state;
}

/** Exposes the full table state as well as various functions for manipulating it. */
export function useTableDispatch<T>(
    initial: TableState<T> | (() => TableState<T>)
): [TableState<T>, Dispatch<TableAction>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), []);
    return useReducer(tableReducer as Reducer<TableState<T>, TableAction>, init);
}

////////////////////
// Table Wrappers //
////////////////////

/** Handler for table state updates. If you do not want to handle the event and let the table handle it, just call `next`.  */
export type TableActionHandler = (action: TableAction, next: Dispatch<TableAction>) => any;

/** All props that can be handed off to the table; provides options for being both controlled and uncontrolled. */
export interface TableProps<T> {
    /** Actual data rows to render in the table. */
    rows: T[];

    /** Initial columns for the table. */
    initialColumns?: TableColumn<T>[];
    /** Controlled prop for setting the current table columns. */
    columns?: TableColumn<T>[];

    /** Whether the table can be sorted. */
    sortable?: boolean;

    /** Initial sorts for the table. */
    initialSortOn?: SortOn[];
    /** Controlled prop for setting the sort. */
    sortOn?: SortOn[];

    /**
     * If a boolean, enables/disables paging with the default configuration. If a number, paging will be
     * enabled with the given number of entries per page.
     */
    paging?: number | boolean;

    /** The initial page of the table. */
    initialPage?: number;
    /** Controlled prop for setting the page of the table. */
    page?: number;

    /** If set, state updates will go through this function, which can choose which events to listen to. */
    onUpdate?: TableActionHandler;
}

/** Standard table view which provides the default state implementation. */
export function TableView<T>(props: TableProps<T>) {
    const [state, dispatch] = useTableDispatch(() => ({
        columns: props.initialColumns ?? [],
        page: props.initialPage ?? 0,
        sortOn: props.initialSortOn ?? [],
        paging: props.paging,
        sortable: props.sortable,
    }));

    // Run dispatch events through `onUpdate` if present.
    const proxiedDispatch = useStableCallback(
        (action: TableAction) => {
            if (props.onUpdate) {
                props.onUpdate(action, dispatch);
            } else {
                dispatch(action);
            }
        },
        [props.onUpdate, dispatch]
    );

    // Props take predecence over state.
    return <ControlledTableView<T> dispatch={proxiedDispatch} {...state} {...props} />;
}
