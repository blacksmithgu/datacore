// Primitive, fast operations.

import { Link } from "expression/link";

/** Fetch documents with the given type. */
export interface IndexTyped {
    type: "typed";
    /** The type, such as 'markdown' or 'section'. */
    value: string;
}

/** Fetch documents with the given tag (potentially exactly). */
export interface IndexTagged {
    type: "tagged";
    /** The tag. Should be prefixed with a '#'. */
    value: string;
    /** Whether the tag should match exactly. If exact, searching for #foo will NOT produce a page with #foo/bar. */
    exact?: boolean;
}

/** Fetch documents in the given folder (potentially exactly). */
export interface IndexFolder {
    type: "folder";
    /** The folder that things should be contained within, potentially exactly. */
    value: string;
    /**
     * Whether the folder should match exactly. If exact, only files DIRECTLY in the folder (and not in subfolders)
     * will be matched.
     */
    exact?: boolean;
}

/**
 * Fetch documents that are connected to the given document. This generally only operates on linkable objects, which
 * are usually files and potentially sections.
 */
export interface IndexConnected {
    type: "connected";
    /** The source page to search around. */
    source: Link;
    /** Whether to look for only outgoing pages, incoming pages, or both incoming and outgoing pages. */
    direction: "outgoing" | "incoming" | "both";
    /** How far to look (defaults to 1 if not set). */
    distance?: number;
}

export type IndexPrimitive = IndexTyped | IndexTagged | IndexFolder | IndexConnected;

// Logical combinators.

/** Return all results (true) or no results (false). */
export interface IndexConstant {
    type: "constant";
    constant: boolean;
}

/** AND two or more datastore queries together. */
export interface IndexAnd {
    type: "and";
    elements: IndexQuery[];
}

/** OR two or more datastore queries together. */
export interface IndexOr {
    type: "or";
    elements: IndexQuery[];
}

/** NOT a datastore query, returning all pages not matching. */
export interface IndexNot {
    type: "not";
    element: IndexQuery;
}

export type IndexQuery = IndexConstant | IndexAnd | IndexOr | IndexNot | IndexPrimitive;
