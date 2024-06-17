import { useMemo } from "preact/hooks";
import { Fragment } from "preact";
import React from "preact/compat";

/** 0-indexed page control. `page` should be the current 0-indexed page, while `totalPages` is the total number of pages. */
function RawPagingControl({
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

    const realPage = Math.max(0, Math.min(page, totalPages));
    const visiblePages = useMemo(() => splitPages(realPage, totalPages), [realPage, totalPages]);

    return (
        <div className="dc-paging-control">
            {visiblePages.map((pages, i) => (
                <Fragment>
                    {i > 0 && <button className="dc-paging-control-separator">...</button>}
                    {pages.map((p) => (
                        <button
                            className={`dc-paging-control-page ${
                                p === realPage ? " dc-paging-control-page-active" : ""
                            }`}
                            onClick={() => setPage(p)}
                        >
                            {p + 1}
                        </button>
                    ))}
                </Fragment>
            ))}
        </div>
    );
}

/** 0-indexed page control. `page` should be the current 0-indexed paeg, while `maxPage` is the maximum page (inclusive). */
export const PagingControl = React.memo(RawPagingControl);

/** Utility function for finding the specific page numbers to render. Always aims to render 9 or 10 page numbers with a separator. */
function splitPages(page: number, totalPages: number): number[][] {
    // If less than 11 pages, show all of them.
    if (totalPages < 11) return [Array.from({ length: totalPages }, (_, i) => i)];

    // We have at least 11 pages (0 .. 10 inclusive). Our goal is to have 9 total visible elements, so split based on that.
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
