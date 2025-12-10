import { GroupingConfig, TableColumn, TableViewProps } from "./table";
import { useAsElement } from "ui/hooks";
import { useInterning, useStableCallback } from "ui/hooks";
import { Dispatch, Reducer, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "preact/hooks";
import { ControlledPager, useDatacorePaging } from "./paging";
import { DEFAULT_TABLE_COMPARATOR, SortButton, SortDirection, SortOn } from "./table";
import { Context, createContext, Fragment, VNode } from "preact";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { useEditableDispatch } from "ui/fields/editable";
import { combineClasses } from "../basics";
import { Indexable } from "index/types/indexable";
import { App } from "obsidian";
import {TreeTableRowData, TreeUtils} from "utils/tree";
import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";



function useKeyFn<T>(id: TreeTableState<T>["id"], ...deps: any[]) {
    const ret = useCallback(
        (el: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>) => {
            if (Groupings.isElementGroup(el)) {
                return el.key;
            } else {
                return id(el.value);
            }
        },
        [...deps]
    );
    return ret;
}

export interface TreeTableColumn<T, V = Literal> extends TableColumn<T, V> {
    sortable?: boolean;

    comparator?: (first: V, second: V, firstObject: T, secondObject: T) => number;
}

export interface TreeTableState<T> {
    sortOn?: SortOn[];
    openMap?: Map<string, boolean>;
    id: (obj: T) => string;
}

export interface TreeTableProps<T> {
    columns: TreeTableColumn<T>[];
    rows: T[] | Grouping<T>;
    paging?: boolean | number;
    scrollOnPaging?: boolean | number;
    groupings?: TableViewProps<TreeTableRowData<T>>["groupings"];
    sortOn?: SortOn[];
    childSelector: (raw: T) => T[];
    id?: (obj: T) => string;
    creatable?: boolean;
    createRow?: (
        prevElement: TreeTableRowData<T> | null,
        parentElement: TreeTableRowData<T> | null,
        parentGroup: GroupElement<TreeTableRowData<T>> | null,
        app: App
    ) => Promise<unknown>;
}

export type TreeTableAction<T> =
    | { type: "sort-column"; column: string; direction: SortDirection | undefined }
    | {
          type: "row-expand";
          row: T;
          newValue: boolean;
      }
    | { type: "open-map-changed"; newValue: Map<string, boolean> };

export function treeTableReducer<T>(state: TreeTableState<T>, action: TreeTableAction<T>): TreeTableState<T> {
    switch (action.type) {
        case "sort-column":
            if (action.direction == undefined) {
                return { ...state, sortOn: undefined };
            } else {
                return {
                    ...state,
                    sortOn: [
                        {
                            type: "column",
                            id: action.column,
                            direction: action.direction,
                        },
                    ],
                };
            }
        case "row-expand":
            const newMap = new Map<string, boolean>();
            if (!state.openMap) return { ...state };
            for (const k of state.openMap.keys()) newMap.set(k, state.openMap.get(k)!);
            newMap.set(state.id(action.row), action.newValue);
            return { ...state, openMap: newMap };
        case "open-map-changed":
            return { ...state, openMap: action.newValue };
    }
    console.warn("datacore: Encountered unrecognized operation: " + (action as TreeTableAction<T>).type);
    return state;
}

export function useTreeTableDispatch<T>(
    initial: TreeTableState<T> | (() => TreeTableState<T>)
): [TreeTableState<T>, Dispatch<TreeTableAction<T>>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), []);
    return useReducer(treeTableReducer as Reducer<TreeTableState<T>, TreeTableAction<T>>, init);
}

export type RowExpansionContextType<T> = {
    dispatch: Dispatch<TreeTableAction<T>>;
    openMap: Map<string, boolean>;
    id: (obj: T) => string;
};

export const EXPANDED_CONTEXT = createContext<RowExpansionContextType<unknown> | null>(null);

export function TypedExpandedContext<T>() {
    return EXPANDED_CONTEXT as Context<RowExpansionContextType<T>>;
}

export function TreeTableHeaderCell<T>({
    column,
    sort,
    sortable,
}: {
    column: TreeTableColumn<T>;
    sort?: SortDirection;
    sortable: boolean;
}) {
    const { dispatch } = useContext(TypedExpandedContext<T>());
    const header: string | VNode = useMemo(() => {
        if (!column.title) return column.id;
        else if (typeof column.title === "function") return column.title();
        else return column.title;
    }, [column.id, column.title]);

    const sortClicked = useStableCallback(
        (_event: MouseEvent) => {
            if (sort == undefined) dispatch({ type: "sort-column", column: column.id, direction: "ascending" });
            else if (sort == "ascending") dispatch({ type: "sort-column", column: column.id, direction: "descending" });
            else dispatch({ type: "sort-column", column: column.id, direction: undefined });
        },
        [column.id]
    );

    const realWidth = useMemo(
        () => (column.width === "minimum" ? "1px" : column.width === "maximum" ? "auto" : column.width + "px"),
        [column.width]
    );
    return (
        <th style={{ width: realWidth }} className="datacore-table-header-cell">
            <div className="datacore-table-header-cell-content">
                {sortable && <SortButton className="datacore-table-sort" direction={sort} onClick={sortClicked} />}
                <div onClick={sortClicked} className="datacore-table-header-title">
                    {header}
                </div>
            </div>
        </th>
    );
}

export function TreeTableGroupHeader<T>({
    level,
    value,
    width,
    config,
}: {
    level: number;
    value: GroupElement<TreeTableRowData<T>>;
    width: number;
    config?: GroupingConfig<TreeTableRowData<T>>;
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
            <td style={{ paddingLeft: `${level * 1.12}em` }} colSpan={width + 1}>
                {renderable}
            </td>
        </tr>
    );
}
export function TreeTableRowGroup<T>({
    level,
    columns,
    element,
    groupings,
    previousElement,
    clickCallbackFactory,
}: {
    level: number;
    columns: TreeTableColumn<T>[];
    element: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T>;
    groupings?: GroupingConfig<TreeTableRowData<T>>[];
    clickCallbackFactory: (
        previousElement: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
        parent: TreeTableRowData<T> | null,
        maybeGroup: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
        groupConfig?: GroupingConfig<TreeTableRowData<T>>
    ) => () => Promise<void>;
    previousElement: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>> | null;
}) {
    const { id } = useContext(TypedExpandedContext<T>());
    const keyFn = useKeyFn(id);
    const groupIndex = groupings ? Math.min(groupings.length - 1, level) : 0;
    if (Groupings.isElementGroup(element)) {
        const groupingConfig = groupings ? groupings[groupIndex] : undefined;
        return (
            <Fragment key={keyFn(element)}>
                <TreeTableGroupHeader level={level} value={element} width={columns.length} config={groupingConfig} />
                {element.rows.map((row, i, arr) => (
                    <TreeTableRowGroup<T>
                        level={level + 1}
                        columns={columns}
                        element={row}
                        groupings={groupings}
                        clickCallbackFactory={clickCallbackFactory}
                        previousElement={i == 0 ? null : arr[i - 1]}
                    />
                ))}
                <CreateButton
                    cols={columns.length}
                    clickCallback={clickCallbackFactory(previousElement, null, element, groupingConfig)}
                    level={level}
                    isGroup={true}
                />
            </Fragment>
        );
    } else {
        return (
            <TreeTableRow<T>
                previous={previousElement as TreeTableRowData<T>}
                row={element}
                columns={columns}
                level={level - groupIndex + 1}
                key={keyFn(element)}
                clickCallbackFactory={clickCallbackFactory}
                parent={null}
            />
        );
    }
}

function CreateButton({
    clickCallback,
    cols,
    level = 0,
    isGroup = false,
}: {
    clickCallback: () => Promise<unknown>;
    cols: number;
    level?: number;
    isGroup?: boolean;
}) {
		const mul = 1.12;
		if(level < 1) level == 1;
		const paddingLeft = `${mul * (level)}em`
    return (
        <tr data-level={level} data-is-group={isGroup.toString()}>
						{/* {isGroup ? null : <td colSpan={1}></td>} */}
						<td colspan={1}></td>
            <td colSpan={cols} className="datacore-table-row" style={{ paddingLeft }}>
                <button className="dashed-default" style="padding: 0.75em; width: 100%" onClick={clickCallback}>
                    Add item
                </button>
            </td>
        </tr>
    );
}

export function TreeTableRowExpander<T>({ row, level }: { row: T; level: number }) {
    const { openMap, dispatch, id } = useContext(TypedExpandedContext<T>());
    const open = useMemo(() => openMap.get(id(row)) ?? false, [row, openMap, openMap.get(id(row)), dispatch]);
    return (
        <td
            onClick={() => dispatch({ type: "row-expand", row, newValue: !open })}
            style={{ paddingLeft: `${(level - 1) * 1.125}em` }}
        >
            <div className={combineClasses("datacore-collapser", !open ? "is-collapsed" : undefined)} dir="auto">
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
        </td>
    );
}

export function TreeTableRow<T>({
    level,
    row,
    columns,
    parent,
    previous,
    clickCallbackFactory,
}: {
    level: number;
    row: TreeTableRowData<T>;
    columns: TreeTableColumn<T>[];
    parent: TreeTableRowData<T> | null;
    previous: TreeTableRowData<T> | null;

    clickCallbackFactory: (
        previousElement: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
        parent: TreeTableRowData<T> | null,
        maybeGroup: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
        groupConfig?: GroupingConfig<TreeTableRowData<T>>
    ) => () => Promise<void>;
}) {
    const { openMap, id } = useContext(TypedExpandedContext<T>());
    const open = useMemo(() => openMap.get(id(row.value)), [openMap, openMap.get(id(row.value)), row, row.value]);
    const hasChildren = useMemo(() => row.children.length > 0, [row, row.children, row.value]);
    return (
        <Fragment>
            <tr className="datacore-table-row">
                {hasChildren ? <TreeTableRowExpander<T> level={level} row={row.value} /> : <td></td>}
                {columns.map((col, i) => (
                    <TreeTableRowCell<T> row={row} column={col} level={level} isFirst={i == 0} />
                ))}
            </tr>
            {open
                ? row.children.map((child, i, a) => (
                      <TreeTableRow
                          row={child}
                          columns={columns}
                          level={level + 1}
                          key={id(child.value)}
                          parent={row}
                          previous={i == 0 ? null : a[i - 1]}
                          clickCallbackFactory={clickCallbackFactory}
                      />
                  ))
                : null}
            {open ? (
                <CreateButton
                    level={level}
                    clickCallback={clickCallbackFactory(previous, row, null, undefined)}
                    cols={columns.length}
                />
            ) : null}
        </Fragment>
    );
}

export function TreeTableRowCell<T>({
    row,
    column,
    level,
    isFirst = false,
}: {
    row: TreeTableRowData<T>;
    column: TreeTableColumn<T>;
    level: number;
    isFirst: boolean;
}) {
    const value = column.value(row.value);
    const updater = useCallback(
        (v: Literal) => {
            column.onUpdate && column.onUpdate(v, row.value);
        },
        [value, row.value]
    );
    const [editableState, dispatch] = useEditableDispatch<typeof value>({
        content: value,
        isEditing: false,
        updater: (v) => column.onUpdate && column.onUpdate(v, row.value),
    });

    const renderable = useMemo(() => {
        return column.render ? column.render(editableState.content, row.value) : value;
    }, [column.render, value, editableState.content, row.value, updater]);

    const rendered = useAsElement(renderable);

    const { editor: Editor } = column;

    return (
        <td
            style={{ paddingLeft: isFirst ? `${(level - 1) * 1.12}em` : undefined }}
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

export function ControlledTreeTableView<T>(
    props: TreeTableState<T> & TreeTableProps<T> & { dispatch: Dispatch<TreeTableAction<T>> }
) {
    const columns = useInterning(props.columns, (a, b) => {
        if (a.length != b.length) return false;
        return a.every((value, index) => value == b[index]);
    });
    const totalElements = useMemo(() => {
        if (Groupings.isGrouping(props.rows)) return Groupings.count(props.rows);
        else
            return props.rows.reduce(
                (pv, cv) => pv + TreeUtils.countInTreeRow(TreeUtils.ofNode(cv, props.childSelector)),
                0
            );
    }, [props.rows]);
    const tableRef = useRef<HTMLDivElement>(null);
    const paging = useDatacorePaging({
        initialPage: 0,
        paging: props.paging,
        scrollOnPageChange: props.scrollOnPaging,
        elements: totalElements,
        container: tableRef,
    });
    const rawSorts = useInterning(props.sortOn, (a, b) => Literals.compare(a, b) == 0);
    const sorts = useMemo(() => {
        return rawSorts?.filter((sort) => {
            const column = columns.find((col) => col.id == sort.id);
            return column && (column.sortable ?? true);
        });
    }, [columns, rawSorts]);
    const groupings = useMemo(() => {
        if (!props.groupings) return undefined;
        if (Array.isArray(props.groupings)) return props.groupings;

        if (Literals.isFunction(props.groupings)) return [{ render: props.groupings }];
        else return [props.groupings];
    }, [props.groupings]);
    const rawRows = useMemo(() => {
        if (!Groupings.isGrouping(props.rows)) return TreeUtils.ofArray(props.rows, props.childSelector);
        return TreeUtils.ofGrouping(props.rows, props.childSelector);
    }, [props.rows]);
    const rows = useMemo(() => {
        if (sorts == undefined || sorts.length == 0) return rawRows;
        const comparators = sorts.map((x) => {
            const col = columns.find((y) => y.id == x.id)!;
            const comp = col?.comparator ?? DEFAULT_TABLE_COMPARATOR;
            return {
                fn: comp,
                direction: x.direction,
                actualValue: col.value,
            };
        });
        return TreeUtils.sort<T, Literal>(rawRows, comparators) as Grouping<TreeTableRowData<T>>;
    }, [rawRows, sorts]);

    const pagedRows = useMemo(() => {
        if (paging.enabled)
            return TreeUtils.slice(rows, paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);
        return rows;
    }, [paging.page, paging.pageSize, paging.enabled, props.rows, rows]);

    const keyFn = useKeyFn(props.id, pagedRows);
    const Context = TypedExpandedContext<T>();
    const app = useContext(APP_CONTEXT);
    const clickCallbackFactory = useCallback(
        (
                previousElement: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
                parent: TreeTableRowData<T> | null,
                maybeGroup: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null,
                groupConfig?: GroupingConfig<TreeTableRowData<T>>
            ) =>
            async () => {
                if (!props.createRow && !props.creatable) {
                    return;
                }

                const group = Groupings.isElementGroup(maybeGroup) ? maybeGroup : null;
                const getLastActualItem = (
                    item: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> | null
                ): TreeTableRowData<T> | null => {
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
                    await groupConfig.create?.(prevGroup, group!, app);
                } else await props.createRow?.(getLastActualItem(previousElement), parent, group, app);
            },
        [app, props.createRow, props.creatable, props.rows].filter((a) => !!a)
    );
    return (
        <Context.Provider value={{ openMap: props.openMap!, dispatch: props.dispatch, id: props.id }}>
            <div ref={tableRef}>
                <table className="datacore-table">
                    <thead>
                        <tr className="datacore-table-header-row">
                            <th className="datacore-table-header-cell" style="width: 1px"></th>
                            {columns.map((x) => (
                                <TreeTableHeaderCell<T>
                                    sort={props.sortOn?.find((s) => s.id === x.id)?.direction}
                                    column={x}
                                    sortable={x.sortable ?? true}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.map((row, i, a) => (
                            <TreeTableRowGroup<T>
                                element={row}
                                columns={columns}
                                level={0}
                                clickCallbackFactory={clickCallbackFactory}
                                previousElement={i == 0 ? null : a[i - 1]}
                                groupings={groupings}
                                key={keyFn(row)}
                            />
                        ))}
                        {!Groupings.isGrouping(rows) && (
                            <CreateButton
                                cols={columns.length}
                                clickCallback={clickCallbackFactory(
                                    rows.length ? rows[rows.length - 1] : null,
                                    null,
                                    rows.length ? rows[rows.length - 1] : null
                                )}
																isGroup={true}
                            />
                        )}
                    </tbody>
                </table>
                {paging.enabled && (
                    <ControlledPager page={paging.page} totalPages={paging.totalPages} setPage={paging.setPage} />
                )}
            </div>
        </Context.Provider>
    );
}

export function TreeTableView<T>(props: TreeTableProps<T>) {
    const [state, dispatch] = useTreeTableDispatch<T>({
        sortOn: props.sortOn ?? [],
        id: props.id ? props.id : (x) => (x as Indexable).$id,
    });

    const refState = useMemo(() => useRef(state), [state]);
    if (state.openMap !== undefined) refState.current = state;
    else refState.current.openMap = new Map<string, boolean>();
    useEffect(() => {
        dispatch({ type: "open-map-changed", newValue: refState.current.openMap ?? new Map<string, boolean>() });
    }, [dispatch]);
    delete props.sortOn;
    return <ControlledTreeTableView<T> dispatch={dispatch} {...state} {...props} />;
}
