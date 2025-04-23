/**
 * @module views
 */
import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";
import { Dispatch, useCallback, useContext, useMemo, useRef } from "preact/hooks";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { useAsElement, useInterning, useStableCallback } from "ui/hooks";
import { Fragment } from "preact/jsx-runtime";
import { faSortDown, faSortUp, faSort } from "@fortawesome/free-solid-svg-icons";
import {useTableDispatch, type SortDirection, type SortOn, TABLE_CONTEXT, TableContext, useTableContext, CommonTableContext} from "./table-dispatch";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PropsWithChildren, ReactNode } from "preact/compat";

import { ControlledPager, useDatacorePaging } from "./paging";

import "./table.css";
import { EditableElement, useEditableDispatch } from "ui/fields/editable";
import "./misc.css";
import { App } from "obsidian";


/**
 * A simple column definition which allows for custom renderers and titles.
 * @group Props
 * @typeParam T - the type of each row
 * @typeParam V - the type of the value in this column
 */
export interface TableColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | ReactNode | (() => string | ReactNode);

    /** If present, the CSS width to apply to the column. 'minimum' will set the column size to it's smallest possible value, while 'maximum' will do the opposite. */
    width?: "minimum" | "maximum" | string;

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
		render?: (value: V, object: T) => Literal | ReactNode;
		
		/** whether or not this column can be sorted on. */
		sortable?: boolean;

		/** comparator used when sorting this column. */
		comparator?: (first: V, second: V, firstObject: T, secondObject: T) => number;

    /** whether this column is editable or not */
    editable?: boolean;

    /** Rendered when editing the column */
    editor?: EditableElement<V>;

    /** Props to pass to the editor component (if any) */
    editorProps: unknown;

    /** Called when the column value updates. */
    onUpdate?: (value: V, object: T) => unknown;
}

/**
 * Metadata for configuring how groupings in the data should be handled.
 * @group Props
 */
export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be handled. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | ReactNode;
    /** How creating a new element in this group should be handled. */
    create?: (prevGroup: GroupElement<T> | null, app: App) => Promise<unknown>;
}

/**
 * All available props for a table.
 * @group Props
 */
export interface TableViewProps<T> {
    /** The columns to render in the table. */
    columns: TableColumn<T>[];

    /** The rows to render; may potentially be grouped or just a plain array. */
    rows: Grouping<T>;

    /** Allows for grouping header columns to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | ReactNode);

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
    /** called to create a new item in a grouping */
    createRow?: (prevElement: T | null, parentGroup: GroupElement<T> | null, app: App) => Promise<unknown>;
}

/**
 * A simple table which supports grouping, sorting, paging, and custom columns.
 * @group Components
 * @param props
 */
export function TableView<T>(props: TableViewProps<T>) {
    // Cache columns by reference equality of the specific columns. Columns have various function references
    // inside them and so cannot be compared by value equality.
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });

    // Count total elements and then page appropriately.
    const tableRef = useRef<HTMLDivElement>(null);
    const totalElements = useMemo(() => Groupings.count(props.rows), [props.rows]);
    const paging = useDatacorePaging({
        initialPage: 0,
        paging: props.paging,
        scrollOnPageChange: props.scrollOnPaging,
        elements: totalElements,
        container: tableRef,
    });
		// Cache sorts by value equality and filter to only sortable valid fields.
    const rawSorts = useInterning(props.sortOn, (a, b) => Literals.compare(a, b) == 0);
		const [tableState, dispatch] = useTableDispatch(() => ({
			sorts: Object.fromEntries((rawSorts?.filter((sort) => {
            const column = columns.find((col) => col.id == sort.id);
            return column && (column.sortable ?? true);
        }) ?? []).map(a => [a.id, a.direction]))
		}))
		const idsToColumns = useMemo(() => {
			return Object.fromEntries(columns.map(col => [col.id, col]));
		}, [columns]);
		const sortedRows = useMemo(() => {
        if (tableState.sorts == undefined || Object.keys(tableState.sorts).length == 0) return props.rows;

        const comparators = Object.entries(tableState.sorts).map(([id, direction]) => {
            const col = idsToColumns[id];
            const comp = col.comparator ? ((a: T, b: T) => col.comparator!(col?.value(a), col?.value(b), a, b)) : (a: T, b: T) => DEFAULT_TABLE_COMPARATOR(col.value(a), col.value(b), a, b);
            return {
                fn: comp,
                direction: direction,
            };
        });
        return Groupings.sort<T>(props.rows, comparators);
    }, [props.rows, tableState.sorts, columns]);

    const pagedRows = useMemo(() => {
        if (paging.enabled)
            return Groupings.slice(sortedRows, paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);
        else return sortedRows;
    }, [paging.page, paging.pageSize, paging.enabled, sortedRows]);

    const groupings = useMemo(() => {
        if (!props.groupings) return undefined;
        if (Array.isArray(props.groupings)) return props.groupings;

        if (Literals.isFunction(props.groupings)) return [{ render: props.groupings }];
        else return [props.groupings];
    }, [props.groupings]);
    const app = useContext(APP_CONTEXT);
    const clickCallbackFactory = useCallback(
        (
                previousElement: GroupElement<T> | T | null,
                maybeParent: GroupElement<T> | T | null,
                groupConfig?: GroupingConfig<T>
            ) =>
            async () => {
                if (!props.createRow && !props.creatable) return;
                const group = Groupings.isElementGroup(maybeParent) ? maybeParent : null;
                const getLastActualItem = (item: GroupElement<T> | T | null): T | null => {
                    if (item == null) return null;
                    if (!Groupings.isElementGroup(item)) {
                        return item;
                    } else if (item.rows.length) {
                        return getLastActualItem(item.rows[item.rows.length - 1]);
                    } else {
                        return null;
                    }
                };
                if (groupConfig) {
                    const prevGroup = Groupings.isElementGroup(previousElement) ? previousElement : null;
                    await groupConfig.create?.(prevGroup, app);
                } else await props.createRow?.(getLastActualItem(previousElement), group, app);
            },
        [app, props.createRow, props.creatable]
    );
    return (
      <TableContextProvider dispatch={dispatch} sorts={tableState.sorts}>
        <div ref={tableRef}>
            <table className="datacore-table">
                <thead>
                    <tr className="datacore-table-header-row">
                        {columns.map((col) => (
                            <TableViewHeaderCell column={col} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {pagedRows.map((row, i, a) => (
                        <VanillaRowGroup<T>
                            level={0}
                            groupings={groupings}
                            columns={columns}
                            element={row}
                            callbackFactory={clickCallbackFactory}
                            creatable={props.creatable ?? false}
                            previousElement={i == 0 ? null : a[i - 1]}
                        />
                    ))}
                    {props.creatable && (
                        <CreateButton
                            cols={columns.length}
                            clickCallback={clickCallbackFactory(
                                props.rows.length ? props.rows[props.rows.length - 1] : null,
                                null,
                                undefined
                            )}
                        />
                    )}
                </tbody>
            </table>
            {paging.enabled && (
                <ControlledPager page={paging.page} totalPages={paging.totalPages} setPage={paging.setPage} />
            )}
        </div>
      </TableContextProvider>
    );
}
/**
 * @hidden
 */
function CreateButton({ clickCallback, cols }: { clickCallback: () => Promise<unknown>; cols: number }) {
    return (
        <tr>
            <td colSpan={cols}>
                <button className="dashed-default" style="padding: 0.75em; width: 100%" onClick={clickCallback}>
                    Add item
                </button>
            </td>
        </tr>
    );
}

/**
 * An individual header cell in the table.
 * @hidden
 */
export function TableViewHeaderCell<T>({ column }: { column: TableColumn<T> }) {
    const header: string | ReactNode = useMemo(() => {
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
        <th style={{ width: realWidth }} className="datacore-table-header-cell">
						<div className="datacore-table-header-cell-content">
							{column.sortable && <SortButton columnId={column.id} />}
							<div className="datacore-table-header-title">{header}</div>
						</div>
        </th>
    );
}

/**
 * A grouping in the table, or an individual row.
 * @hidden
 */
export function VanillaRowGroup<T>({
    level,
    columns,
    element,
    groupings,
    callbackFactory,
    creatable = false,
    previousElement,
}: {
    level: number;
    columns: TableColumn<T>[];
    element: T | GroupElement<T>;
    groupings?: GroupingConfig<T>[];
    createRow?: TableViewProps<T>["createRow"];
    creatable: boolean;
    callbackFactory: (
        previousElement: GroupElement<T> | T | null,
        element: GroupElement<T> | T | null,
        groupConfig?: GroupingConfig<T>
    ) => () => Promise<void>;
    previousElement: T | GroupElement<T> | null;
}) {
    if (Groupings.isElementGroup(element)) {
        const groupingConfig = groupings?.[Math.min(groupings.length - 1, level)];

        return (
            <Fragment>
                <TableGroupHeader level={level} value={element} width={columns.length} config={groupingConfig} />
                {element.rows.map((row, i, a) => (
                    <VanillaRowGroup
                        level={level + 1}
                        columns={columns}
                        element={row}
                        creatable={creatable}
                        previousElement={i == 0 ? null : a[i - 1]}
                        callbackFactory={callbackFactory}
                    />
                ))}
                {creatable ? (
                    <tr>
                        <td colSpan={columns.length}>
                            <button
                                className="dashed-default"
                                style="padding: 0.75em"
                                onClick={callbackFactory(previousElement, element, groupingConfig)}
                            >
                                Create new row
                            </button>
                        </td>
                    </tr>
                ) : null}
            </Fragment>
        );
    } else {
        return <TableRow level={level} row={element} columns={columns} />;
    }
}

/**
 * A header of a grouped set of columns.
 * @hidden
 */
export function TableGroupHeader<T>({
    level,
    value,
    width,
    config,
}: {
    level: number;
    value: GroupElement<T>;
    width: number;
    config?: GroupingConfig<T>;
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
        <tr className="datacore-table-group-header">
            <td colSpan={width}>{renderable}</td>
        </tr>
    );
}

/**
 * A single row inside the table.
 * @hidden
 */
export function TableRow<T>({ level, row, columns }: { level: number; row: T; columns: TableColumn<T>[] }) {
    return (
        <tr
            className="datacore-table-row"
            style={level ? `padding-left: ${level * 5}px` : undefined}
            key={"$id" in (row as any) ? (row as any).$id : undefined}
        >
            {columns.map((col) => (
                <TableRowCell row={row} column={col} />
            ))}
        </tr>
    );
}

/**
 * A single cell inside of a row of the table.
 * @hidden
 */
export function TableRowCell<T>({ row, column }: { row: T; column: TableColumn<T> }) {
    const value = column.value(row);
    const [editableState, dispatch] = useEditableDispatch<typeof value>({
        content: value,
        isEditing: false,
        updater: (v) => column.onUpdate && column.onUpdate(v, row),
    });
    const renderable = useMemo(() => {
        if (column.render) {
            let r = column.render(value, row);
            return r;
        } else return value;
    }, [row, column.render, editableState.content, value]);

    const rendered = useAsElement(renderable);

    const { editor: Editor } = column;
    return (
        <td
            onDblClick={() => dispatch({ type: "editing-toggled", newValue: !editableState.isEditing })}
            className="datacore-table-cell"
        >
            {column.editable && editableState.isEditing && Editor ? (
                <Editor field={value} dispatch={dispatch} {...(column.editorProps ?? {})} {...editableState} />
            ) : (
                rendered
            )}
        </td>
    );
}

export function SortButton({
	columnId,
    className,
	contextGetter = useTableContext,
}: {
    className?: string;
		columnId: string;
		contextGetter?: () => CommonTableContext | null;
}) {
		const {dispatch, ...state} = contextGetter()!;
		const direction = state.sorts[columnId];
    const icon = useMemo(() => {
        if (direction == "ascending") return faSortDown;
        else if (direction == "descending") return faSortUp;
        return faSort;
    }, [direction]);
		const onClick = useStableCallback(() => {
			dispatch({type: "sort-column", column: columnId, direction: direction == "ascending" ? "descending" : "ascending"});
		}, [columnId, dispatch, state.sorts]);

    return (
        <div onClick={onClick} className={className}>
            <FontAwesomeIcon icon={icon} />
        </div>
    );
}

/** Default comparator for sorting on a table column. */
export const DEFAULT_TABLE_COMPARATOR: <T>(a: Literal, b: Literal, ao: T, bo: T) => number = (a, b, _ao, _bo) =>
    Literals.compare(a, b);
/**
 * @hidden
 * @group Components
 */
export function TableContextProvider<T>({dispatch, children, ...rest}: PropsWithChildren<TableContext>) {	
	return <TABLE_CONTEXT.Provider value={{dispatch: dispatch, ...rest}}>
		{children}
	</TABLE_CONTEXT.Provider>
}

