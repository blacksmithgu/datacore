import { Literal } from "expression/literal";
import { h, isValidElement, JSX, RenderableProps } from "preact";
import { useContext, useMemo } from "preact/hooks";
import { CURRENT_FILE_CONTEXT, Lit } from "./markdown";

export interface TableState<T> {
    /** The columns in the table; they will be rendered in the order they show up in the array. */
    columns: TableColumn<T>[];

    /** The fields to sort the view on, if relevant. */
    sortOn?: SortOn[];

    /** The fields to group the view on, if relevant. */
    groupOn?: SortOn[];

    /**
     * If a boolean, enables/disables paging with the default configuration. If a number, paging will be
     * enabled with the given number of entries per page.
     */
    paging?: number | boolean;
}

export interface SortOn {
    /** The ID of the column to sort on. */
    column: string;
    /** The direction to sort on. */
    direction: "ascending" | "descending";
}

export interface TableColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | JSX.Element | (() => string | JSX.Element);

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
    render?: (value: V, object: T) => Literal | JSX.Element;

    /** Optional comparator function which will be used for sorting; if not present, the default comparator will be used instead. */
    comparator?: (first: V, second: V, firstObject: T, secondObject: T) => number;

    /** Enables or disables sorting  */
    sortable?: boolean;

    /** Enables or disables grouping on this column. */
    groupable?: boolean;
}

export function TableView<T>(props: RenderableProps<TableState<T> & { rows: T[] }>) {
    return <table className="datacore-table">
        <thead>
            <TableHeader columns={props.columns} />
        </thead>
        <tbody>
            {props.rows.map(row => <TableRow row={row} columns={props.columns} />)}
        </tbody>
    </table>
}

export function TableHeader<T>({ columns }: { columns: TableColumn<T>[] }) {
    return <tr className="datacore-table-header-row">
        {columns.map(col => <TableHeaderCell column={col} />)}
    </tr>
}

export function TableHeaderCell<T>({ column }: { column: TableColumn<T> }) {
    const header: string | JSX.Element = useMemo(() => {
        if (!column.title) {
            return column.id;
        } else if (typeof column.title === "function") {
            return column.title();
        } else {
            return column.title;
        }
    }, [column, column.title]);

    return <th className="datacore-table-header-cell">
        {header}
    </th>;
}

export function TableRow<T>({ row, columns }: { row: T, columns: TableColumn<T>[] }) {
    return <tr className="datacore-table-row">
        {columns.map(col => <TableRowCell row={row} column={col} />)}
    </tr>;
}

export function TableRowCell<T>({ row, column }: { row: T, column: TableColumn<T> }) {
    const value = useMemo(() => column.value(row), [row, column]);
    const renderable = useMemo(() => {
        if (column.render) return column.render(value, row);
        else return value;
    }, [row, column, value]);
    const rendered = useAsElement(renderable);

    return <td className="datacore-table-cell">
        {rendered}
    </td>;
}

/** Ensure that a given literal or element input is rendered as a JSX.Element. */
function useAsElement(element: JSX.Element | Literal): JSX.Element {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return useMemo(() => {
        if (isValidElement(element)) {
            return element;
        } else {
            return <Lit sourcePath={sourcePath} inline={false} value={element as any} />
        }
    }, [element]);
}