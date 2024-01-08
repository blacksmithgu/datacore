import { useMemo } from "preact/hooks";
import { Fragment, h } from "preact";
import React from "preact/compat";

/** 0-indexed page control. `page` should be the current 0-indexed page, while `maxPage` is the maximum page (inclusive). */
function RawPagingControl({ page, setPage, maxPage }: { page: number, setPage: (page: number) => void, maxPage: number }) {
    // Clamp page to be within the actual bounds of pages.
    const realPage = Math.max(0, Math.min(page, maxPage));
    const visiblePages = useMemo(() => splitPages(realPage, maxPage), [realPage, maxPage]);

    return (
        <div className="datacore paging-control">
            {visiblePages.map((pages, i) => (
                <Fragment>
                    {i > 0 && <button className="datacore paging-control-separator">...</button>}
                    {pages.map(p => (
                        <button className={`datacore paging-control-page ${p === realPage ? " paging-control-page-active" : ""}`} onClick={() => setPage(p)}>{p + 1}</button>
                    ))}
                </Fragment>
            ))}
        </div>
    );
}

/** 0-indexed page control. `page` should be the current 0-indexed paeg, while `maxPage` is the maximum page (inclusive). */
export const PagingControl = React.memo(RawPagingControl);

/** Utility function for finding the specific page numbers to render. Always aims to render 9 or 10 page numbers with a separator. */
function splitPages(page: number, maxPage: number): number[][] {
    // If less than 11 pages, show all of them.
    if (maxPage < 11) return [Array.from({ length: maxPage }, (_, i) => i)];

    // We have at least 11 pages (0 .. 10 inclusive). Our goal is to have 9 total visible elements, so split based on that.
    // 5 surrounding {page}, 0, 1, maxPage - 1, maxPage.
    if (page < 5) return [[0, 1, 2, 3, 4, 5, 6, 7], [maxPage - 1, maxPage]];
    else if (page > maxPage - 5) return [[0, 1], [maxPage - 7, maxPage - 6, maxPage - 5, maxPage - 4, maxPage - 3, maxPage - 2, maxPage - 1, maxPage]];
    else return [[0, 1], [page - 2, page - 1, page, page + 1, page + 2], [maxPage - 1, maxPage]];
}