/**
 * @module views
 */
import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";

import { Fragment, VNode, isValidElement } from "preact";
import { useCallback, useContext, useMemo, useRef } from "preact/hooks";
import { ControlledPager, useDatacorePaging } from "./paging";
import { useAsElement } from "ui/hooks";
import { CSSProperties, ReactNode } from "preact/compat";
import { MarkdownListItem } from "index/types/markdown";
import { BaseFieldProps } from "ui/fields/common-props";
import { ControlledEditable, EditableElement } from "ui/fields/editable";
import { App } from "obsidian";

/** The render type of the list view. */
export type ListViewType = "ordered" | "unordered" | "block";

/**
 * State for a {@link ListView}
 * @typeParam T - the type of the items contained in the list
 * @group States
 */
export interface ListViewProps<T> {
    /**
     * Whether the list should be ordered, unordered, or block.
     *
     * Block lists do not use an actual list element and instead just render a series of contiguous
     * div elements with no other annotations.
     */
    type?: "ordered" | "unordered" | "block";

    /** The full collection of elements in the list. */
    rows: Grouping<T>;

    /** Allows for grouping header lines to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | VNode);

    /**
     * Custom render function to use for rendering each leaf element. Can produce either JSX or a plain value which will be
     * rendered as a literal.
     */
    renderer?: (row: T) => React.ReactNode | Literal;

    /** Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size. */
    paging?: boolean | number;

    /**
     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.
     * If a number, will scroll only if the number is greater than the current page size.
     **/
    scrollOnPaging?: boolean | number;

    /** Maximum level of children that will be rendered; a level of 0 means no children expansion will occur. */
    maxChildDepth?: number;

    /**
     * Property name, list of property names, or function to be applied to obtain children for a given entry.
     * Defaults to the `$children` and `children` props.
     *
     * If null, child extraction is disabled and no children will be fetched. If undefined, uses the default.
     */
    childSource?: null | string | string[] | ((row: T) => T[]);
    /** fields to display under each item in this task list */
    displayedFields?: (BaseFieldProps<Literal> & { key: string })[];

    /** whether or not list items can be edited */
    editable?: boolean;
    /** rendered when editing the column */
    editor?: EditableElement<T>;
    /** props to pass to the editor component (if any) */
    editorProps: unknown;
    /** called when the item's value has been updated */
    onUpdate?: (value: T) => unknown;

    /** Sets the default text when creating a new item */
    defaultCreationText?: string;
    /** whether to show the button for creating a new item */
    showCreateButton?: boolean;
    /** How creating a new element in this list should be handled. */
    create?: (prevElement: T | null, parentElement: T | null, app: App) => Promise<unknown>;
}

/**
 * Metadata for configuring how groupings in the data should be handled.
 * @group Props
 */
export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be rendered. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | VNode;
    /** called to create a new item in this group */
    create?: (prevGroup: GroupElement<T> | null, currentGroup: GroupElement<T>, app: App) => Promise<unknown>;
}

/**
 * A simple and responsive list view.
 * @group Components
 */
export function ListView<T>(props: ListViewProps<T>) {
    const app = useContext(APP_CONTEXT);
    const type = props.type ?? "unordered";
    const renderer = props.renderer ?? ((x: T) => x as Literal);

    const containerRef = useRef<HTMLDivElement>(null);
    const totalElements = useMemo(() => Groupings.count(props.rows), [props.rows]);
    const paging = useDatacorePaging({
        initialPage: 0,
        paging: props.paging,
        scrollOnPageChange: props.scrollOnPaging,
        elements: totalElements,
        container: containerRef,
    });

    const pagedRows = useMemo(() => {
        if (paging.enabled)
            return Groupings.slice(props.rows, paging.page * paging.pageSize, (paging.page + 1) * paging.pageSize);
        else return props.rows;
    }, [paging.page, paging.pageSize, paging.enabled, props.rows]);

    const groupings = useMemo(() => {
        if (!props.groupings) return undefined;
        if (Array.isArray(props.groupings)) return props.groupings;

        if (Literals.isFunction(props.groupings)) return [{ render: props.groupings }];
        else return [props.groupings];
    }, [props.groupings]);

    // Maximum amount of recursion we'll allow when expanding children.
    const maxChildDepth = useMemo(() => props.maxChildDepth ?? 12, [props.maxChildDepth]);
    const childFunc = useMemo(() => ensureChildrenFunc(props.childSource), [props.childSource]);
    const clickCallbackFactory = useCallback(
        (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => async () => {
            if (!props.create && !props.showCreateButton) return;
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
            await props.create?.(getLastActualItem(previousElement), maybeParent, app);
        },
        [app, props.create, props.showCreateButton]
    );
    return (
        <div ref={containerRef} className="datacore-list">
            <ListGroup
                level={0}
                type={type}
                rows={pagedRows}
                renderer={renderer}
                groupings={groupings}
                maxChildDepth={maxChildDepth}
                childFunc={childFunc}
                showCreateButton={props.showCreateButton ?? false}
                clickFactory={clickCallbackFactory}
            />
            {paging.enabled && (
                <ControlledPager page={paging.page} totalPages={paging.totalPages} setPage={paging.setPage} />
            )}
        </div>
    );
}

/** A group of list items with a title. */
function ListGroup<T>({
    level,
    type,
    rows,
    renderer,
    groupings,
    maxChildDepth,
    childFunc,
    showCreateButton,
    clickFactory,
}: {
    level: number;
    type: ListViewType;
    rows: Grouping<T>;
    renderer: (element: T) => ReactNode | Literal;
    groupings?: GroupingConfig<T>[];
    maxChildDepth: number;
    childFunc: (element: T) => T[];
    showCreateButton: boolean;
    clickFactory: (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => () => Promise<unknown>;
}) {
    const groupingConfig = groupings?.[Math.min(groupings.length - 1, level)];
    const app = useContext(APP_CONTEXT);
    if (Groupings.isGrouping(rows)) {
        return (
            <Fragment>
                {rows.map((group, i) => (
                    <Fragment>
                        <ListGroupHeader level={level} value={group} config={groupingConfig} />
                        <ListGroup
                            level={level + 1}
                            type={type}
                            rows={group.rows}
                            renderer={renderer}
                            groupings={groupings}
                            maxChildDepth={maxChildDepth}
                            childFunc={childFunc}
                            showCreateButton={showCreateButton}
                            clickFactory={clickFactory}
                        />

                        {showCreateButton ? (
                            <CreateButton
                                clickCallback={() =>
                                    groupingConfig?.create?.(i == 0 ? null : rows[i - 1], group, app) ??
                                    Promise.resolve()
                                }
                            />
                        ) : null}
                    </Fragment>
                ))}
            </Fragment>
        );
    } else {
        // This is a leaf cluster. Render it directly.
        if (type === "ordered" || type === "unordered") {
            return (
                <HtmlList<T>
                    type={type}
                    rows={rows}
                    renderer={renderer}
                    maxDepth={maxChildDepth}
                    depth={0}
                    childFunc={childFunc}
										parent={null}
										showCreateButton={showCreateButton}
                    clickFactory={clickFactory}
                />
            );
        } else {
            // Block is default.
            return (
                <BlockList<T>
                    rows={rows}
                    renderer={renderer}
                    maxChildDepth={maxChildDepth}
                    childFunc={childFunc}
                    clickFactory={clickFactory}
										showCreateButton={showCreateButton}
										parent={null}
                />
            );
        }
    }
}

/** A header of a grouped set of list items. */
function ListGroupHeader<T>({
    level,
    value,
    config,
}: {
    level: number;
    value: GroupElement<T>;
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

    return <span className="datacore-list-group-header">{renderable}</span>;
}

/** A simple <ol>/<ul> ordered list that expands heirarchically using 'childFunc'. */
function HtmlList<T>({
    type,
    rows,
    renderer,
    maxDepth,
    depth,
    childFunc,
    clickFactory,
    parent = null,
		showCreateButton = false
}: {
    type: "ordered" | "unordered";
    rows: T[];
    renderer: (row: T) => React.ReactNode | Literal;
    maxDepth: number;
    depth: number;
    childFunc: (element: T) => T[];
    clickFactory: (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => () => Promise<unknown>;
    parent: T | null;
		showCreateButton: boolean;
}) {
    if (type === "ordered") {
        return (
            <ol className={"datacore-list datacore-list-ordered"}>
                {rows.map((element, index) => (
                    <HtmlListItem<T>
                        type={type}
                        element={element}
                        key={index}
                        renderer={renderer}
                        maxDepth={maxDepth}
                        depth={depth}
                        childFunc={childFunc}
                        clickFactory={clickFactory}
                    />
                ))}

                {showCreateButton ? <CreateButton clickCallback={clickFactory(rows.length ? rows[rows.length - 1] : null, parent)} />  : null}
            </ol>
        );
    } else {
        return (
            <ul className={"datacore-list datacore-list-unordered"}>
                {rows.map((element, index) => (
                    <HtmlListItem<T>
                        type={type}
                        element={element}
                        key={index}
                        renderer={renderer}
                        maxDepth={maxDepth}
                        depth={depth}
                        childFunc={childFunc}
                        clickFactory={clickFactory}
                    />
                ))}
                {showCreateButton ? <CreateButton clickCallback={clickFactory(rows.length ? rows[rows.length - 1] : null, parent)} />  : null}
            </ul>
        );
    }
}

/** A single <li> item (potentially with children) in an HTML list. */
function HtmlListItem<T>({
    type,
    element,
    renderer,
    maxDepth,
    depth,
    childFunc,
    clickFactory,
		showCreateButton = false
}: {
    type: "ordered" | "unordered";
    element: T;
    renderer: (row: T) => React.ReactNode | Literal;
    maxDepth: number;
    depth: number;
    childFunc: (element: T) => T[];
    clickFactory: (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => () => Promise<unknown>;
		showCreateButton?: boolean;
}) {
    const children = useMemo(() => {
        if (depth >= maxDepth) return [];
        else return childFunc(element);
    }, [element, childFunc, depth, maxDepth]);

    return (
        <li className={"datacore-list-item"}>
            {ensureListElement(renderer(element))}
            {children && (
                <HtmlList<T>
                    type={type}
                    rows={children}
                    maxDepth={maxDepth}
                    depth={depth + 1}
                    renderer={renderer}
                    childFunc={childFunc}
                    clickFactory={clickFactory}
										parent={element}
										showCreateButton={showCreateButton}
                />
            )}
        </li>
    );
}

/** A a div-based list that expands heirarchically using 'childFunc'. */
function BlockList<T>({
    rows,
    renderer,
    maxChildDepth,
    childFunc,
    clickFactory,
		parent,
		showCreateButton
}: {
    rows: T[];
    renderer: (row: T) => React.ReactNode | Literal;
    maxChildDepth: number;
    childFunc: (element: T) => T[];
    clickFactory: (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => () => Promise<unknown>;
		parent: T | null;
		showCreateButton: boolean;
}) {
    return (
        <div className="datacore-list datacore-list-block">
            {rows.map((element, index) => (
                <BlockListItem<T>
                    element={element}
                    key={index}
                    renderer={renderer}
                    maxDepth={maxChildDepth}
                    depth={0}
                    childFunc={childFunc}
                    clickFactory={clickFactory}
                />
            ))}
            {showCreateButton ? <CreateButton clickCallback={clickFactory(rows.length ? rows[rows.length - 1] : null, parent)} />  : null}
        </div>
    );
}

/** A single <div> item (potentially with children) in a manually constructed block list. */
function BlockListItem<T>({
    element,
    renderer,
    maxDepth,
    depth,
    childFunc,
    clickFactory,
}: {
    element: T;
    renderer: (row: T) => React.ReactNode | Literal;
    maxDepth: number;
    depth: number;
    childFunc: (element: T) => T[];
    clickFactory: (previousElement: GroupElement<T> | T | null, maybeParent: T | null) => () => Promise<unknown>;
}) {
    const children = useMemo(() => {
        if (depth >= maxDepth) return [];
        else return childFunc(element);
    }, [element, childFunc, depth, maxDepth]);

    // Add left padding to simulate list indentation.
    const style: CSSProperties = useMemo(() => {
        return {
            paddingLeft: depth * 4,
        };
    }, [depth]);

    return (
        <div className={"datacore-block-list-item"} style={style}>
            {ensureListElement(renderer(element))}
            {children?.map((child, index) => (
                <BlockListItem<T>
                    element={child}
                    key={index}
                    maxDepth={maxDepth}
                    depth={depth + 1}
                    renderer={renderer}
                    childFunc={childFunc}
                    clickFactory={clickFactory}
                />
            ))}
        </div>
    );
}

/** Ensures the given element is a renderable react node.  */
function ensureListElement<T>(element: T): VNode {
    if (isValidElement(element)) {
        return element;
    } else {
        return <DefaultListElement element={element} />;
    }
}

/** Default list element which just tries to render the value as a literal. */
function DefaultListElement<T>({ element }: { element: T }) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    // TODO: Add a generic base class or interface so people can make custom list items.
    // TODO: Add task items as a special subcase in the list view.
    if (element instanceof MarkdownListItem) {
        return <Lit inline={true} value={element.$text} sourcePath={element.$file} />;
    }

    return <Lit inline={true} value={element as Literal} sourcePath={sourcePath} />;
}

/**
 * Coerces the various formats that the child prop can be defined into a stable function.
 */
function ensureChildrenFunc<T>(childProp: undefined | null | string | string[] | ((row: T) => T[])): (row: T) => T[] {
    if (childProp === undefined) {
        // Use the default prop function.
        return defaultChildren;
    } else if (childProp === null) {
        // No-op function.
        return (element: T) => [];
    } else if (Literals.isString(childProp)) {
        return (element: T) => fetchProps(element, [childProp]);
    } else if (Literals.isArray(childProp)) {
        return (element: T) => fetchProps(element, childProp);
    } else {
        return childProp;
    }
}

/**
 * Default function for fetching the children of an element; assumes the relevant fields
 * are `$children` and `children`.
 */
function defaultChildren<T>(element: T): T[] {
    return fetchProps(element, ["$children", "children"]);
}

/** Given an element and a list of props, extract the elements of those props. */
function fetchProps<T>(element: T, props: string[]): T[] {
    const result: T[] = [];
    for (const prop of props) {
        const items = (element as Record<string, T>)[prop];

        if (!items) continue;
        if (Literals.isArray(items)) result.push(...(items as T[]));
        else result.push(items);
    }

    return result;
}
/**
 * Button that creates a new element when clicked.
 * @hidden
 */
function CreateButton({ clickCallback }: { clickCallback: () => Promise<unknown> }) {
    return (
        <li className="add-button-row">
            <button className="dashed-default" style="padding: 0.75em; width: 100%" onClick={clickCallback}>
                Add item
            </button>
        </li>
    );
}
export function EditableListElement<T>({
    element: item,
    editor,
    onUpdate,
    file,
    editorProps,
}: {
    editor: (value: T) => EditableElement<T>;
    element: T;
    file: string;
    onUpdate: (value: T) => unknown;
    editorProps: unknown;
}) {
    return (
        <ControlledEditable<T>
            props={editorProps}
            sourcePath={file}
            content={item}
            editor={editor(item)}
            onUpdate={onUpdate}
            defaultRender={<DefaultListElement element={item} />}
        />
    );
}
