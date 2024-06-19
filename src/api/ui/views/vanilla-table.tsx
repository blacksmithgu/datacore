import { GroupElement, Grouping, Groupings, Literal } from "expression/literal";
import { useContext, useMemo } from "preact/hooks";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { useInterning } from "ui/hooks";
import { Fragment } from "preact/jsx-runtime";
import { VNode, isValidElement } from "preact";

import "./table.css";

/** A simple column definition which allows for custom renderers and titles. */
export interface VanillaColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | VNode | (() => string | VNode);

    /** If present, the CSS width to apply to the column. 'minimum' will set the column size to it's smallest possible value, while 'maximum' will do the opposite. */
    width?: "minimum" | "maximum" | string;

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
    render?: (value: V, object: T) => Literal | VNode;
}

/** All available props for a vanilla table. */
export interface VanillaTableProps<T> {
    /** The columns to render in the table. */
    columns: VanillaColumn<T>[];

    /** The rows to render; may potentially be grouped or just a plain array. */
    rows: Grouping<T>;

    /**
     * If set to a boolean - enables or disables paging.
     * If set to a number, paging will be enabled with the given number of rows per page.
     */
    paging?: boolean | number;
}

export function VanillaTable<T>(props: VanillaTableProps<T>) {
    // Cache columns by reference equality of the specific columns. Columns have various function references
    // inside them and so cannot be compared by value equality.
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });

    return (
        <table className="datacore-table">
            <thead>
                <tr className="datacore-table-header-row">
                    {columns.map((col) => (
                        <VanillaTableHeaderCell column={col} />
                    ))}
                </tr>
            </thead>
            <tbody>
                {props.rows.map((row) => (
                    <VanillaRowGroup level={0} columns={columns} element={row} />
                ))}
            </tbody>
        </table>
    );
}

/** An individual column cell in the table. */
export function VanillaTableHeaderCell<T>({ column }: { column: VanillaColumn<T> }) {
    const header: string | VNode = useMemo(() => {
        if (!column.title) {
            return column.id;
        } else if (typeof column.title === "function") {
            return column.title();
        } else {
            return column.title;
        }
    }, [column.id, column.title]);

    const realWidth = useMemo(
        () => (column.width === "minimum" ? "1px" : column.width === "maximum" ? "auto" : column.width),
        [column.width]
    );

    // We use an internal div to avoid flex messing with the table layout.
    return (
        <th width={realWidth} className="datacore-table-header-cell">
            <div className="datacore-table-header-title">{header}</div>
        </th>
    );
}

/** A grouping in the table, or an individual row. */
export function VanillaRowGroup<T>({
    level,
    columns,
    element,
}: {
    level: number;
    columns: VanillaColumn<T>[];
    element: T | GroupElement<T>;
}) {
    if (Groupings.isElementGroup(element)) {
        return (
            <Fragment>
                <TableGroupHeader level={level} value={element.key} width={columns.length} />
                {element.rows.map((row) => (
                    <VanillaRowGroup level={level + 1} columns={columns} element={row} />
                ))}
            </Fragment>
        );
    } else {
        return <TableRow level={level} row={element} columns={columns} />;
    }
}

/** A header of a grouped set of columns. */
export function TableGroupHeader<T>({ level, value, width }: { level: number; value: Literal; width: number }) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);
    return (
        <tr className="datacore-table-group-header">
            <td colSpan={width}>
                <h2>
                    <Lit sourcePath={sourcePath} inline={true} value={value} />
                </h2>
            </td>
        </tr>
    );
}

/** A single row inside the table. */
export function TableRow<T>({ level, row, columns }: { level: number; row: T; columns: VanillaColumn<T>[] }) {
    return (
        <tr className="datacore-table-row" style={level ? `padding-left: ${level * 5}px` : undefined}>
            {columns.map((col) => (
                <TableRowCell row={row} column={col} />
            ))}
        </tr>
    );
}

/** A single cell inside of a row of the table. */
export function TableRowCell<T>({ row, column }: { row: T; column: VanillaColumn<T> }) {
    const value = useMemo(() => column.value(row), [row, column.value]);
    const renderable = useMemo(() => {
        if (column.render) return column.render(value, row);
        else return value;
    }, [row, column.render, value]);
    const rendered = useAsElement(renderable);

    return <td className="datacore-table-cell">{rendered}</td>;
}

/** Ensure that a given literal or element input is rendered as a JSX.Element. */
function useAsElement(element: VNode | Literal): VNode {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return useMemo(() => {
        if (isValidElement(element)) {
            return element as VNode;
        } else {
            return <Lit sourcePath={sourcePath} inline={true} value={element as any} />;
        }
    }, [element]);
}
