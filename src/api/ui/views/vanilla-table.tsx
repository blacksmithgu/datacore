import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";
import { useCallback, useContext, useMemo, useRef, useState } from "preact/hooks";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { useInterning } from "ui/hooks";
import { Fragment } from "preact/jsx-runtime";
import { VNode, isValidElement } from "preact";
import { ControlledPager, useDatacorePaging } from "./paging";

import "./table.css";
import { combineClasses } from "../basics";
import { Editable, useEditableDispatch } from "ui/fields/editable";

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

		/** whether this column is editable or not */
		editable?: boolean;

		/** Rendered when editing the column */
		editor?:(value: V, object: T) => JSX.Element;

		/** Called when the column value updates. */
		onUpdate?:(value: V) => unknown;
}

/** Metadata for configuring how groupings in the data should be handled. */
export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be handled. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | VNode;
    /** whether to display this group's key as a row. */
    displayAsRow: boolean;
}

/** All available props for a vanilla table. */
export interface VanillaTableProps<T> {
    /** The columns to render in the table. */
    columns: VanillaColumn<T>[];

    /** The rows to render; may potentially be grouped or just a plain array. */
    rows: Grouping<T>;

    /** Allows for grouping header columns to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | VNode);

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
}

export function VanillaTable<T>(props: VanillaTableProps<T>) {
    // Cache columns by reference equality of the specific columns. Columns have various function references
    // inside them and so cannot be compared by value equality.
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });

    const totalElements = useMemo(() => Groupings.count(props.rows), [props.rows]);
    const paging = useDatacorePaging({
        initialPage: 0,
        paging: props.paging,
        scrollOnPageChange: props.scrollOnPaging,
        elements: totalElements,
    });
    const tableRef = useRef<HTMLDivElement>(null);

    const setPage = useCallback(
        (page: number) => {
            if (page != paging.page && paging.scroll) {
                tableRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                });
            }

            paging.setPage(page);
        },
        [paging.page, paging.setPage, paging.scroll, tableRef]
    );

    const pagedRows = useMemo(() => {
        if (paging.enabled)
            return Groupings.slice(props.rows, paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);
        else return props.rows;
    }, [paging.page, paging.pageSize, paging.enabled, props.rows]);

    const groupings = useMemo(() => {
        if (!props.groupings) return undefined;
        if (Array.isArray(props.groupings)) return props.groupings;

        if (Literals.isFunction(props.groupings)) return [{ render: props.groupings, displayAsRow: false }];
        else return [props.groupings];
    }, [props.groupings]);

    return (
        <div ref={tableRef}>
            <table className="datacore-table">
                <thead>
                    <tr className="datacore-table-header-row">
                        <th width={1} />
                        {columns.map((col) => (
                            <VanillaTableHeaderCell column={col} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {pagedRows.map((row) => (
                        <VanillaRowGroup level={0} groupings={groupings} columns={columns} element={row} />
                    ))}
                </tbody>
            </table>
            {paging.enabled && <ControlledPager page={paging.page} totalPages={paging.totalPages} setPage={setPage} />}
        </div>
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
    groupings,
}: {
    level: number;
    columns: VanillaColumn<T>[];
    element: T | GroupElement<T>;
    groupings?: GroupingConfig<T>[];
}) {
    const [open, setOpen] = useState(true);
    if (Groupings.isElementGroup(element)) {
        const groupingConfig = groupings ? groupings[Math.min(groupings.length - 1, level)] : undefined;
        return (
            <Fragment>
                {groupingConfig?.displayAsRow ? (
                    <TableRow
                        open={open}
                        openChanged={setOpen}
                        row={element.key as T}
                        columns={columns}
                        level={level}
                        hasChildren={element.rows.length > 0}
                    />
                ) : (
                    <TableGroupHeader
                        level={level}
                        value={element}
                        width={columns.length}
                        config={groupingConfig}
                        open={open}
                        openChanged={setOpen}
                    />
                )}
                {open
                    ? element.rows.map((row) => (
                          <VanillaRowGroup level={level + 1} columns={columns} element={row} groupings={groupings} />
                      ))
                    : null}
            </Fragment>
        );
    } else {
        return (
            <TableRow
                hasChildren={false}
                open={open}
                openChanged={setOpen}
                level={level}
                row={element}
                columns={columns}
            />
        );
    }
}

/** A header of a grouped set of columns. */
export function TableGroupHeader<T>({
    level,
    value,
    width,
    config,
    open,
    openChanged,
}: {
    level: number;
    value: GroupElement<T>;
    width: number;
    config?: GroupingConfig<T>;
    openChanged: (b: boolean) => void;
    open: boolean;
}) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);
    const rawRenderable = useMemo(() => {
        if (config?.render) return config.render(value.key, value.rows);
        else
            return (
                <h2>
                    <Lit sourcePath={sourcePath} inline={true} value={value.key} />
                </h2>
            );
    }, [config?.render, value.key, value.rows]);
    const renderable = useAsElement(rawRenderable);

    return (
        <tr className="datacore-table-group-header" style={{ paddingLeftt: `${level * 25}px` }}>
            <td colSpan={1}>
                <TableCollapser open={open} openChanged={openChanged} />
            </td>
            <td colSpan={width}>{renderable}</td>
        </tr>
    );
}

/** A single row inside the table. */
export function TableRow<T>({
    level,
    row,
    columns,
    openChanged,
    open,
    hasChildren = false,
}: {
    level: number;
    row: T;
    columns: VanillaColumn<T>[];
    openChanged: (b: boolean) => void;
    open: boolean;
    hasChildren?: boolean;
}) {
    return (
        <tr className="datacore-table-row" data-level={level}>
            <td style={level ? `padding-left: ${level * 25}px;` : undefined}>
                {hasChildren ? <TableCollapser open={open} openChanged={openChanged} /> : null}
            </td>
            {columns.map((col) => (
                <TableRowCell row={row} column={col} level={level} />
            ))}
        </tr>
    );
}

/** A single cell inside of a row of the table. */
export function TableRowCell<T>({ row, column, level }: { row: T; column: VanillaColumn<T>; level?: number }) {
    const value = useMemo(() => column.value(row), [row, column.value]);
    const renderable = useMemo(() => {
        if (column.render) return column.render(value, row);
        else return value;
    }, [row, column.render, value]);
		
    const rendered = useAsElement(renderable);
		
		
		const [editableState, dispatch] = useEditableDispatch<typeof value>({
			content: value,
			isEditing: false,
			updater: column.onUpdate!
		})
		const editor = useMemo(() => {
			if(column.editable && column.editor) return column.editor(value, row);
			else return null;
		}, [row, column.editor, column.editable, value])
    return <td
            style={level ? `padding-left: ${level * 25}px;` : undefined}
            data-level={level} 
		 className="datacore-table-cell"><Editable<typeof value> defaultRender={rendered} editor={editor} dispatch={dispatch} state={editableState}/></td>;
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

function TableCollapser({ openChanged, open }: { openChanged: (b: boolean) => void; open: boolean }) {
    return (
        <div
            onClick={() => openChanged(!open)}
            className={combineClasses("datacore-collapser", !open ? "is-collapsed" : undefined)}
            dir="auto"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="svg-icon right-triangle"
            >
                <path d="M3 8L12 17L21 8"></path>
            </svg>
        </div>
    );
}
