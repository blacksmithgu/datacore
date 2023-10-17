import { Expression } from "expression/expression";
import { Link, Literal } from "expression/literal";

/** Valid index-value comparisons. */
export type IndexComparison = "=" | "!=" | ">" | "<" | ">=" | "<=";

/** Return all results (true) or no results (false). */
export interface IndexConstant {
    type: "constant";
    constant: boolean;
}

/** Fetch the document with the given ID. */
export interface IndexId {
    type: "id";
    /** The ID of the object to retrieve. */
    value: string;
}

/** Fetch a document referenced by the given link. */
export interface IndexLink {
    type: "link";
    /** The link being referenced. */
    value: Link;
}

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

/** Fetch documents at the given path (potentially exactly). Also supports matching on specific files. */
export interface IndexPath {
    type: "path";
    /** The folder that things should be contained within, potentially exactly. */
    value: string;
    /**
     * Whether the folder should match exactly. If exact, only files DIRECTLY in the folder (and not in subfolders)
     * will be matched.
     */
    exact?: boolean;
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
 * Fetch documents whose field value is equal to one of the given values. This will only work for specially indexed fields
 * which can be compared against, such as task 'completed', and the 'date' field of date-labelled pages.
 */
export interface IndexValueEquals {
    type: "equal-value";
    /** The field whose value we are checking. */
    field: string;
    /** The set of acceptable values. */
    values: Literal[];
}

/**
 * Execute arbitrary expressions against the document, returning true if the expression evaluates to true.
 *
 * This is the most general form of query; it will implicitly require that all fields in the expression are
 * defined on the page.
 */
export interface IndexExpression {
    type: "expression";

    /** The expression to evaluate against each object. */
    expression: Expression;
}

/////////////////////////////
// Complex nested queries. //
/////////////////////////////

/**
 * Fetch documents which are the children of documents matching the given other filter.
 */
export interface IndexChildOf {
    type: "child-of";

    /** Filter which should produce the list of parent objects that the given document should be a child of. */
    parents: IndexQuery;

    /** If true, then include the parent objects itself as valid matches. */
    inclusive?: boolean;
}

/**
 * Fetch documents which are parents of documents matching the given filter.
 */
export interface IndexParentOf {
    type: "parent-of";

    /** Filter which should produce the list of child objects that the given document should be a parent of. */
    children: IndexQuery;

    /** If true, then include the child objects themselves as valid matches. */
    inclusive?: boolean;
}

/**
 * Start by finding all documents matching `source`, then follow file links in the desired directions (incoming, outgoing,
 * or both) for the given distance. The simple use of this operator is to just find inlinks/outlinks for a given file,
 * but it is more general and can look for local groups of files.
 */
export interface IndexLinked {
    type: "linked";
    /** The source pages to search for connections from. */
    source: IndexQuery;
    /** Whether to look for only outgoing pages, incoming pages, or both incoming and outgoing pages. */
    direction: "outgoing" | "incoming" | "both";
    /** How far to look (defaults to 1 if not set). */
    distance?: number;
    /** If true, then include the source objects themselves as valid matches. */
    inclusive?: boolean;
}

/** Primary index sources which just directly produce sets of matches. */
export type IndexPrimitive =
    | IndexId
    | IndexLink
    | IndexConstant
    | IndexTyped
    | IndexTagged
    | IndexPath
    | IndexField
    | IndexValueEquals;

/** Secondary index sources which take in another index source, modify it somehow, and return a new set of matches. */
export type IndexIntermediate = IndexChildOf | IndexParentOf | IndexLinked;

///////////////////////
// Index Combinators //
///////////////////////

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

/** Pure combinators for combining queries. */
export type IndexCombinator = IndexAnd | IndexOr | IndexNot;
/** Anything that produces sets of matching values. */
export type IndexSource = IndexIntermediate | IndexPrimitive;
/** A full query AST. */
export type IndexQuery = IndexCombinator | IndexExpression | IndexSource;

/** Constant index query which matches all. */
export const INDEX_ALL: IndexQuery = { type: "constant", constant: true };
/** Constant index query which matches nothing. */
export const INDEX_NONE: IndexQuery = { type: "constant", constant: false };
