/**
 * @module views
 */
import { GroupElement, Grouping, Groupings, Literal, Literals } from "expression/literal";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";

import { Fragment, VNode, isValidElement } from "preact";
import { useContext, useMemo, useRef } from "preact/hooks";
import { ControlledPager, useDatacorePaging } from "./paging";
import { useAsElement } from "ui/hooks";
import { ReactNode } from "preact/compat";

/** The render type of the list view. */
export type ListViewType = "ordered" | "unordered" | "block";

/**
 * State for a {@link ListView}
 * @typeParam T - the type of the items contained in the list
 * @group States
 */
export interface ListState<T> {
    /**
     * Whether the list should be ordered (ol), unordered (ul), or block.
     *
     * Block lists do not use an actual list element and instead just render a series of contiguous
     * div elements with no other annotations.
     */
    type?: ListViewType;

    /** The full collection of elements in the list. */
    rows: Grouping<T>;

    /** Allows for grouping header lines to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | VNode);

    /** Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size. */
    paging?: boolean | number;

    /**
     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.
     * If a number, will scroll only if the number is greater than the current page size.
     **/
    scrollOnPaging?: boolean | number;

    /**
     * Custom render function to use for rendering each leaf element. Can produce either JSX or a plain value which will be
     * rendered as a literal.
     */
    renderer?: (row: T) => React.ReactNode | Literal;
}

/**
 * Metadata for configuring how groupings in the data should be handled.
 * @group Props
 */
export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be handled. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | VNode;
}

/**
 * A simple and responsive list view.
 * @group Components
 */
export function ListView<T>(props: ListState<T>) {
    const type = props.type ?? "unordered";
    const renderer = props.renderer ?? ((x: T) => x as Literal);

    const containerRef = useRef<HTMLElement>(null);
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

    return (
        <div className="datacore-list">
            <ListGroup level={0} type={type} element={pagedRows} renderer={renderer} groupings={groupings} />
            {paging.enabled && (
                <ControlledPager page={paging.page} totalPages={paging.totalPages} setPage={paging.setPage} />
            )}
        </div>
    );
}

/**
 * A group of list items with a title.
 * @hidden
 */
export function ListGroup<T>({
    level,
    type,
    element,
    renderer,
    groupings,
}: {
    level: number;
    type: ListViewType;
    element: Grouping<T>;
    renderer: (element: T) => ReactNode | Literal;
    groupings?: GroupingConfig<T>[];
}) {
    const clusters = useMemo(() => Groupings.cluster(element), [element]);
    const groupingConfig = groupings?.[Math.min(groupings.length - 1, level)];

    return (
        <Fragment>
            {clusters.map((cluster) => {
                if (cluster.type === "grouping") {
                    return (
                        <Fragment>
                            <ListGroupHeader level={level} value={cluster.element} config={groupingConfig} />
                            <ListGroup
                                level={level + 1}
                                type={type}
                                element={cluster.element.rows}
                                renderer={renderer}
                                groupings={groupings}
                            />
                        </Fragment>
                    );
                } else {
                    // This is a leaf cluster. Render it directly.
                    if (type === "ordered") {
                        return (
                            <ol className={"datacore-list datacore-list-ordered"}>
                                {cluster.elements.map((element, index) => (
                                    <li key={index} className="datacore-list-item">
                                        {ensureListElement(renderer(element))}
                                    </li>
                                ))}
                            </ol>
                        );
                    } else if (type === "unordered") {
                        return (
                            <ul className="datacore-list datacore-list-unordered">
                                {cluster.elements.map((element, index) => (
                                    <li key={index} className="datacore-list-item">
                                        {ensureListElement(renderer(element))}
                                    </li>
                                ))}
                            </ul>
                        );
                    } else {
                        // Block is default.
                        return (
                            <div className="datacore-list datacore-list-none">
                                {cluster.elements.map((item, index) => (
                                    <div className="datacore-unwrapped-list-item" key={index}>
                                        {ensureListElement(renderer(item))}
                                    </div>
                                ))}
                            </div>
                        );
                    }
                }
            })}
        </Fragment>
    );
}

/**
 * A header of a grouped set of list items.
 * @hidden
 */
export function ListGroupHeader<T>({
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

/** Ensures the given element is a renderable react node.  */
function ensureListElement<T>(element: T): VNode {
    if (isValidElement(element)) {
        return element;
    } else {
        return <DefaultListElement element={element} />;
    }
}

/** Default list element which just tries to render the value as a literal.  */
function DefaultListElement<T>({ element }: { element: T }) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return <Lit inline={true} value={element as Literal} sourcePath={sourcePath} />;
}
