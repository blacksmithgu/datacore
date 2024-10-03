import { useCallback, useContext, useMemo, useState } from "preact/hooks";
import { Fragment, RefObject } from "preact";
import React from "preact/compat";
import { SETTINGS_CONTEXT } from "ui/markdown";

import "./paging.css";

/** 0-indexed page control. `page` should be the current 0-indexed page, while `totalPages` is the total number of pages. */
function RawControlledPager({
    page,
    setPage,
    totalPages,
}: {
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
}) {
    // Clamp page to be within the actual bounds of pages.
    totalPages = Math.max(1, totalPages);

    const realPage = clamp(page, 0, totalPages - 1);
    const visiblePages = useMemo(() => splitPages(realPage, totalPages), [realPage, totalPages]);

    return (
        <div className="dc-paging-control">
            {page != 0 && (
                <button className="dc-paging-control-page" onClick={() => setPage(page - 1)}>
                    &lt;
                </button>
            )}
            {visiblePages.map((pages, i) => (
                <Fragment>
                    {i > 0 && <span className="dc-paging-control-separator">...</span>}
                    {pages.map((p) => (
                        <button
                            className={`dc-paging-control-page ${
                                p === realPage ? " dc-paging-control-page-active" : ""
                            }`}
                            onClick={(event: any) => setPage(p)}
                        >
                            {p + 1}
                        </button>
                    ))}
                </Fragment>
            ))}
            {page != totalPages - 1 && (
                <button className="dc-paging-control-page" onClick={() => setPage(page + 1)}>
                    &gt;
                </button>
            )}
        </div>
    );
}

/** 0-indexed page control. `page` should be the current 0-indexed paeg, while `maxPage` is the maximum page (inclusive). */
export const ControlledPager = React.memo(RawControlledPager);

/** Hook which provides automatic page reflow and page state management. */
export function usePaging({
    initialPage = 0,
    pageSize,
    elements,
}: {
    initialPage: number;
    pageSize: number;
    elements: number;
}): [number, number, (page: number) => void] {
    // We track the start index of the page so that when page size changes we can just automatically recompute the page we are on without any state.
    const totalPages = Math.max(1, Math.ceil(elements / pageSize));
    const [pageStart, setPageStart] = useState(() => clamp(initialPage, 0, totalPages - 1));

    const setBoundedPage = useCallback(
        (page: number) => setPageStart(clamp(page, 0, totalPages - 1) * pageSize),
        [pageSize, totalPages]
    );

    const page = clamp(Math.floor(pageStart / pageSize), 0, totalPages - 1);
    return [page, totalPages, setBoundedPage];
}

/** Provides useful metadata about paging. */
export interface Paging {
    /** Whether paging is enabled. */
    enabled: boolean;
    /** Whether the view should scroll when the page changes. */
    scroll: boolean;
    /** The current page. */
    page: number;
    /** The size of each page. */
    pageSize: number;
    /** The total number of pages for this data. */
    totalPages: number;
    /** Update the current page. */
    setPage: (page: number) => void;
}

/**
 * Central paging hook which extracts page metadata out of Datacore settings, handles page overflow, current page state, and updating the page
 * if the elements change. If a container is specified, also supports scrolling the container view on page changes.
 */
export function useDatacorePaging({
    initialPage = 0,
    paging,
    scrollOnPageChange,
    elements,
    container,
}: {
    initialPage: number;
    paging: number | boolean | undefined;
    scrollOnPageChange?: boolean | number;
    elements: number;
    container?: RefObject<HTMLElement>;
}): Paging {
    const settings = useContext(SETTINGS_CONTEXT);

    const pageSize = typeof paging === "number" ? paging : settings.defaultPageSize;
    const pagingEnabled = typeof paging === "number" || paging === true;
    const shouldScroll =
        (typeof scrollOnPageChange === "number" && scrollOnPageChange >= pageSize) ||
        !!(scrollOnPageChange ?? settings.scrollOnPageChange);

    const [page, totalPages, rawSetPage] = usePaging({ initialPage, pageSize, elements });

    // Handle auto-scroll if a container is provided.
    const setPage = useCallback(
        (newPage: number) => {
            if (page != newPage && container && shouldScroll) {
                container.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                });
            }

            rawSetPage(newPage);
        },
        [page, container, shouldScroll, rawSetPage]
    );

    return { enabled: pagingEnabled, scroll: shouldScroll, page, pageSize, totalPages, setPage };
}

function clamp(input: number, min: number, max: number): number {
    if (input < min) return min;
    if (input > max) return max;
    return input;
}

/** Utility function for finding the specific page numbers to render. Always aims to render 9 or 10 page numbers with a separator. */
function splitPages(page: number, totalPages: number): number[][] {
    // If less than 12 pages, show all of them.
    if (totalPages < 12) return [Array.from({ length: totalPages }, (_, i) => i)];

    // We have at least 12 pages (0 .. 10 inclusive). Our goal is to have 9 total visible elements, so split based on that.
    // 5 surrounding {page}, 0, 1, maxPage - 1, maxPage.
    if (page < 5)
        return [
            [0, 1, 2, 3, 4, 5, 6, 7],
            [totalPages - 1, totalPages],
        ];
    else if (page > totalPages - 5)
        return [
            [0, 1],
            [
                totalPages - 7,
                totalPages - 6,
                totalPages - 5,
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ],
        ];
    else
        return [
            [0, 1],
            [page - 2, page - 1, page, page + 1, page + 2],
            [totalPages - 1, totalPages],
        ];
}
