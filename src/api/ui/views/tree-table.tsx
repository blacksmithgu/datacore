import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";
import { GroupingConfig, useAsElement, VanillaColumn, VanillaTableProps } from "./table";
import { useInterning, useStableCallback } from "ui/hooks";
import { Dispatch, Reducer, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "preact/hooks";
import { ControlledPager, useDatacorePaging } from "./paging";
import { DEFAULT_TABLE_COMPARATOR, SortButton, SortDirection, SortOn } from "./table";
import { Context, createContext, Fragment, VNode } from "preact";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { Editable, useEditableDispatch } from "ui/fields/editable";
import { combineClasses } from "../basics";
import { Indexable } from "index/types/indexable";

export interface TreeTableRowData<T> {
    value: T;
    children: TreeTableRowData<T>[];
}

export namespace TreeUtils {
    export function isTreeTableRowData<T>(data: any): data is TreeTableRowData<T> {
        return (
            "children" in data &&
            "value" in data &&
            !Array.isArray(data) &&
            Object.keys(data).length == 2 &&
            Array.isArray(data.children)
        );
    }
    export function countInTreeRow<T>(node: TreeTableRowData<T>, top: boolean = true): number {
        let result = 0;
        if (!top) result++;
        for (let n of node.children) result += countInTreeRow(n, false);
        return result;
    }
    export function ofArray<T>(source: T[], childFn: (el: T) => T[]): TreeTableRowData<T>[] {
        const mapper = (el: T): TreeTableRowData<T> => {
            return {
                value: el,
                children: childFn(el).map(mapper),
            } as TreeTableRowData<T>;
        };
        return source.map(mapper);
    }
    export function ofNode<T>(source: T, childFn: (el: T) => T[]): TreeTableRowData<T> {
        return {
            value: source,
            children: ofArray(childFn(source), childFn),
        };
    }

    export function ofGrouping<T>(elements: Grouping<T>, childFn: (el: T) => T[]): Grouping<TreeTableRowData<T>> {
        const mapper = (l: T | GroupElement<T>): GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> => {
            if (Groupings.isElementGroup(l))
                return { key: l.key, rows: l.rows.map(mapper) } as GroupElement<TreeTableRowData<T>>;
            return {
                value: l,
                children: childFn(l).map(mapper),
            } as TreeTableRowData<T>;
        };
        return elements.map(mapper) as Grouping<TreeTableRowData<T>>;
    }

    export function count<T>(elements: Grouping<TreeTableRowData<T>> | GroupElement<TreeTableRowData<T>>): number {
        if (Groupings.isElementGroup(elements)) {
            return count(elements.rows);
        } else if (Groupings.isGrouping(elements)) {
            let result = 0;
            for (let group of elements) result += count(group.rows);
            return result;
        } else {
            return elements.reduce((pv, cv) => pv + countInTreeRow(cv), 0);
        }
    }

    function sliceInTreeRow<T>(elements: TreeTableRowData<T>[], start: number, end: number): TreeTableRowData<T>[] {
        if (end <= start) return [];

        let index = 0,
            seen = 0;
        while (index < elements.length && seen + countInTreeRow(elements[index]) <= start) {
            seen += countInTreeRow(elements[index]);
            index++;
        }

        if (index >= elements.length) return [];

        const result: TreeTableRowData<T>[] = [];
        while (index < elements.length && seen < end) {
            const group = elements[index];
            const groupSize = countInTreeRow(group);
            const groupStart = Math.max(seen, start);
            const groupEnd = Math.min(groupSize + seen, end);

            result.push({
                value: group.value,
                children: sliceInTreeRow(group.children, groupStart - seen, groupEnd - seen),
            });

            seen += groupSize;
            index++;
        }

        return result;
    }

    export function slice<T>(
        elements: Grouping<TreeTableRowData<T>>,
        start: number,
        end: number
    ): Grouping<TreeTableRowData<T>> {
        let initial = [...Groupings.slice(elements, start, end)] as Grouping<TreeTableRowData<T>>;
        let index = 0,
            seen = 0;

        for (let element of initial) {
            if (Groupings.isElementGroup(element)) {
                let groupSize = Groupings.count(elements);
                let groupStart = Math.min(seen, start);
                let groupEnd = Math.min(groupSize, end);
                (initial[index] as GroupElement<TreeTableRowData<T>>).rows = Groupings.slice(
                    element.rows,
                    groupStart,
                    groupEnd
                );
                seen += groupSize;
            } else {
                seen += countInTreeRow(element);
            }
            index++;
        }
        return initial;
    }
    /** recursively sort a tree */
    export function sort<T, V = Literal>(
        rows: (TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>)[],
        comparators: {
            fn: (a: V, b: V, ao: T, ab: T) => number;
            direction: SortDirection;
            actualValue: (obj: T) => V;
        }[]
    ): (TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>)[] {
        const realComparator = (
            a: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>,
            b: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>
        ): number => {
            for (let comp of comparators) {
                const direction = comp.direction.toLocaleLowerCase() === "ascending" ? 1 : -1;
                let result = 0;
                if (Groupings.isElementGroup(a) && Groupings.isElementGroup(b)) {
                    result = 0;
                } else if (!Groupings.isElementGroup(a) && !Groupings.isElementGroup(b)) {
                    result =
                        direction * comp.fn(comp.actualValue(a.value), comp.actualValue(b.value), a.value, b.value);
                }
                if (result != 0) return result;
            }
            return 0;
        };
        const map = (
            t: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>
        ): TreeTableRowData<T> | GroupElement<TreeTableRowData<T>> => {
            let r;
            if (Groupings.isElementGroup(t))
                r = { ...t, rows: sort(t.rows, comparators).map(map) } as GroupElement<TreeTableRowData<T>>;
            else r = { ...t, children: sort(t.children, comparators).map(map) } as TreeTableRowData<T>;
            return r;
        };
        return rows.map(map).sort(realComparator);
    }
}

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

export interface TreeTableColumn<T, V = Literal> extends VanillaColumn<T, V> {
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
    groupings?: VanillaTableProps<TreeTableRowData<T>>["groupings"];
    sortOn?: SortOn[];
    childSelector: (raw: T) => T[];
    id?: (obj: T) => string;
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
        <th width={realWidth} className="datacore-table-header-cell">
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
}: {
    level: number;
    columns: TreeTableColumn<T>[];
    element: GroupElement<TreeTableRowData<T>> | TreeTableRowData<T>;
    groupings?: GroupingConfig<TreeTableRowData<T>>[];
}) {
    const { id } = useContext(TypedExpandedContext<T>());
    const keyFn = useKeyFn(id);
    const groupIndex = groupings ? Math.min(groupings.length - 1, level) : 0;
    if (Groupings.isElementGroup(element)) {
        const groupingConfig = groupings ? groupings[groupIndex] : undefined;
        return (
            <Fragment key={keyFn(element)}>
                <TreeTableGroupHeader level={level} value={element} width={columns.length} config={groupingConfig} />
                {element.rows.map((row) => (
                    <TreeTableRowGroup<T> level={level + 1} columns={columns} element={row} groupings={groupings} />
                ))}
            </Fragment>
        );
    } else {
        return <TreeTableRow row={element} columns={columns} level={level - groupIndex + 1} key={keyFn(element)} />;
    }
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
}: {
    level: number;
    row: TreeTableRowData<T>;
    columns: TreeTableColumn<T>[];
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
                ? row.children.map((child) => (
                      <TreeTableRow row={child} columns={columns} level={level + 1} key={id(child.value)} />
                  ))
                : null}
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
    const value = useMemo(() => column.value(row.value), [row.value, column.value, column.value(row.value)]);
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
    useEffect(() => {
        dispatch({ type: "content-changed", newValue: value });
    }, [value, updater]);
    let renderedColumn = column.render ? column.render(editableState.content, row.value) : value;
    const renderable = useMemo(() => {
        if (renderedColumn && typeof renderedColumn == "object" && "props" in renderedColumn)
            return Object.assign(renderedColumn, { props: Object.assign(renderedColumn.props, { dispatch }) });
        else return renderedColumn;
    }, [column.render, value, editableState.content, renderedColumn, row.value, updater]);

    const rendered = useAsElement(renderable);

    const Editor = useMemo(() => {
        let e;
        if (column.editable && column.editor) e = column.editor(editableState.content, row.value);
        else e = null;
        if (e) return Object.assign(e, { props: Object.assign(e.props, { dispatch }) });
        return e;
    }, [column.editor, column.editable, editableState.content, row.value]);

    return (
        <td
            style={{ paddingLeft: isFirst ? `${(level - 1) * 1.2}em` : undefined }}
            onDblClick={() => dispatch({ type: "editing-toggled", newValue: !editableState.isEditing })}
            className="datacore-table-cell"
        >
            {column.editable ? (
                <Editable<typeof value>
                    defaultRender={rendered}
                    editor={Editor}
                    dispatch={dispatch}
                    state={editableState}
                />
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
    return (
        <Context.Provider value={{ openMap: props.openMap!, dispatch: props.dispatch, id: props.id }}>
            <div ref={tableRef}>
                <table className="datacore-table">
                    <thead>
                        <tr className="datacore-table-header-row">
                            <th className="datacore-table-header-cell" width="1px"></th>
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
                        {pagedRows.map((row) => (
                            <TreeTableRowGroup<T>
                                element={row}
                                columns={columns}
                                level={0}
                                groupings={groupings}
                                key={keyFn(row)}
                            />
                        ))}
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
