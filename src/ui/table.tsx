import { Literal, Literals } from "expression/literal";
import { h, isValidElement, JSX, RenderableProps } from "preact";
import { Dispatch, useContext, useMemo, useReducer } from "preact/hooks";
import { CURRENT_FILE_CONTEXT, Lit } from "./markdown";
import { useInterning, useStableCallback } from "./hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";

export interface TableState<T> {
    /** The actual row data to render. */
    rows: T[];

    /** The columns in the table; they will be rendered in the order they show up in the array. */
    columns: TableColumn<T>[];

    /** Whether the table can be sorted. */
    sortable?: boolean;
    /** The fields to sort the view on, if relevant. */
    sortOn?: SortOn[];

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
export type SortOn =
    { type: "column"; id: string; direction: SortDirection };

export interface TableColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | JSX.Element | (() => string | JSX.Element);

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
    render?: (value: V, object: T) => Literal | JSX.Element;

    /** Optional comparator function which will be used for sorting; if not present, the default value comparator will be used instead. */
    comparator?: (first: V, second: V, firstObject: T, secondObject: T) => number;

    /** Enables or disables sorting on this column. */
    sortable?: boolean;
}

/** Low level table view which handles state transitions via the given dispatcher. */
export function TableView<T>(props: RenderableProps<TableState<T> & { dispatch: TableDispatcher<T> }>) {
    // Cache columns by reference equality of the specific columns. Columns have various function references
    // inside them and so cannot be compared by value equality.
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });

    // Cache sorts by value equality and filter to only sortable valid fields.
    const rawSorts = useInterning(props.sortOn, (a, b) => Literals.compare(a, b) == 0);
    const sorts = useMemo(() => {
        return rawSorts?.filter(sort => {
            const column = columns.find(col => col.id == sort.id);
            return column && (column.sortable ?? true);
        })
    }, [columns, rawSorts]);

    // Apply sorting to the rows as appropriate.
    const rows = useMemo(() => {
        if (sorts == undefined || sorts.length == 0) return props.rows;

        return ([] as T[]).concat(props.rows).sort((a, b) => {
            for (let sortKey of sorts) {
                const column = columns.find(col => col.id == sortKey.id);
                if (!column) continue;

                const comparer = column.comparator ?? DEFAULT_TABLE_COMPARATOR;
                const result = comparer(column.value(a), column.value(b), a, b);
                if (result != 0) return result;
            }

            return 0;
        });
    }, [props.rows, sorts]);

    return (
        <table className="datacore-table">
            <thead>
                <tr className="datacore-table-header-row">
                    {columns.map((col) => (
                        <TableHeaderCell column={col} sort={props.sortOn?.find(s => s.id == col.id)?.direction} dispatch={props.dispatch} />
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => <TableRow row={row} columns={columns} />)}
            </tbody>
        </table>
    );
}

/** An individual column cell in the table. */
export function TableHeaderCell<T>({ column, sort, dispatch }: { column: TableColumn<T>; sort?: SortDirection; dispatch: TableDispatcher<T> }) {
    const header: string | JSX.Element = useMemo(() => {
        if (!column.title) {
            return column.id;
        } else if (typeof column.title === "function") {
            return column.title();
        } else {
            return column.title;
        }
    }, [column.id, column.title]);

    const sortClicked = useStableCallback((_event: MouseEvent) => {
        if (sort == undefined) dispatch.sortOnColumn(column.id, "ascending");
        else if (sort == "ascending") dispatch.sortOnColumn(column.id, "descending");
        else dispatch.sortOnColumn(column.id, undefined);
    }, [sort, dispatch, column.id]);

    return <th className="datacore-table-header-cell">
        {column.sortable && <SortButton direction={sort} onClick={sortClicked} />}
        <div className="datacore-table-header-title">
            {header}
        </div>
    </th>;
}

/** A single row inside the table. */
export function TableRow<T>({ row, columns }: { row: T; columns: TableColumn<T>[] }) {
    return (
        <tr className="datacore-table-row">
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
export function SortButton({ direction, onClick }: { direction?: SortDirection; onClick?: (evt: MouseEvent) => any }) {
    const icon = useMemo(() => {
        if (direction == "ascending") return faSortDown;
        else if (direction == "descending") return faSortUp;
        return faSort;
    }, [direction]);

    return (
        <div onClick={onClick}>
            <FontAwesomeIcon icon={icon} />
        </div>
    );
}

/** Ensure that a given literal or element input is rendered as a JSX.Element. */
function useAsElement(element: JSX.Element | Literal): JSX.Element {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return useMemo(() => {
        if (isValidElement(element)) {
            return element;
        } else {
            return <Lit sourcePath={sourcePath} inline={false} value={element as any} />;
        }
    }, [element]);
}

/////////////////
// Table Hooks //
/////////////////

export type TableAction =
    | { type: "reset-all" }
    | { type: "reset-sort" }
    | { type: "sort-column", column: string, direction?: "ascending" | "descending" }
    | { type: "add-column", column: TableColumn<Literal>, index?: number }
    | { type: "remove-column", column: string }
    ;

/** Central reducer which updates table state predictably. */
export function tableReducer<T>(state: TableState<T>, action: TableAction): TableState<T> {
    switch (action.type) {
        case "reset-all":
            return {
                ...state,
                sortOn: undefined,
            };
        case "reset-sort":
            return { ...state, sortOn: undefined };
        case "sort-column":
            return {
                ...state,
                sortOn: [{
                    type: "column",
                    id: action.column,
                    direction: action.direction ?? "ascending"
                }]
            };
        case "add-column":

    }

    // In case of ignored operations.
    console.warn(`datacore: Encountered unrecognized table operation: ${action}`);
    return state;
}

/** Convienent wrapper around the table state reducer which provides more strongly typed methods. */
export class TableDispatcher<T> {
    public constructor(public reducer: Dispatch<TableAction>) {}

    /** Reset the table view. */
    reset() {
        this.reducer({ type: "reset-all" });
    }

    /** Reset all sort fields. */
    resetSort() {
        this.reducer({ type: "reset-sort" });
    }

    /** Sort on the given column in the given direction. */
    sortOnColumn(column: string, direction: "ascending" | "descending" | undefined) {
        this.reducer({ type: "sort-column", column, direction });
    }
}

/** Exposes the full table state as well as various functions for manipulating it. */
export function useTableDispatch<T>(initial: TableState<T> | (() => TableState<T>)): [TableState<T>, TableDispatcher<T>] {
    const init = useMemo(() => typeof initial == "function" ? initial() : initial, []);
    const [state, dispatcher] = useReducer<TableState<T>, TableAction>(tableReducer, init);
    const fancyDispatch = useMemo(() => new TableDispatcher(dispatcher), [dispatcher]);

    return [state, fancyDispatch];
}

/** Default comparator for sorting on a table column. */
export const DEFAULT_TABLE_COMPARATOR: <T>(a: Literal, b: Literal, ao: T, bo: T) => number =
    (a, b, _ao, _bo) => Literals.compare(a, b);

////////////////////
// Table Wrappers //
////////////////////

/** Standard table view which provides all of the default interactions, callbacks, and bindings to the table. */
export function DefaultTableView<T>(initial: TableState<T> & { rows: T[] }) {
    const [state, dispatch] = useTableDispatch(initial);

    return <TableView<T> dispatch={dispatch} {...state} />;
}