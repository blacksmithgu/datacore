// Primitive, fast operations.

import { Link } from "expression/link";
import { Literal } from "expression/literal";

/** Valid index-value comparisons. */
export type IndexComparison = "=" | "!=" | ">" | "<" | ">=" | "<=";

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

/**
 * Fetch documents which have the given field defined (even if it's value is null).
 */
export interface IndexField {
    type: "field";
    /** The name of the field that must exist. This is case sensitive. */
    value: string;
}

/**
 * Fetch documents whose field value is equal to the given value. This will only work for specially indexed fields
 * which can be compared against, such as task 'completed', and the 'date' field of date-labelled pages.
 */
export interface IndexValueEquals {
    type: "equal-value";
    /** The field whose value we are checking. */
    field: String;
    /** The value that we expect it to be equal to. */
    value: Literal;
}

/**
 * Fetch documents whose field value is in the given bounds. This will only work for specially indexed fields which can
 * be compared against, such as task 'completed' or task 'status', and the 'date' field of date-labelled pages.
 */
export interface IndexValueBounded {
    type: "bounded-value";
    /** The field whose value we are checking. */
    field: string;
    /** The (lower bound, is-inclusive). */
    lower?: [Literal, boolean];
    /** The (upper bound, is-inclusive). */
    upper?: [Literal, boolean];
}

export type IndexPrimitive =
    | IndexTyped
    | IndexTagged
    | IndexFolder
    | IndexConnected
    | IndexField
    | IndexValueEquals
    | IndexValueBounded;

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
