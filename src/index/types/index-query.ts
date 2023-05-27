import { Literal } from "expression/literal";

/** AND two or more datastore queries together. */
export interface IndexAnd {
    type: "and";
    elements: DatastoreQuery[];
}

/** OR two or more datastore queries together. */
export interface IndexOr {
    type: "or";
    elements: DatastoreQuery[];
}

/** NOT a datastore query, returning all pages not matching.. */
export interface IndexNot {
    type: "not";
    element: DatastoreQuery;
}

/** Primitive operation which compares a value against a field. */
export interface IndexCompare {
    type: "compare";

    /** The indexed field. */
    key: string;
    /** The comparison operator to apply over the index. */
    operator: ">" | "<" | ">=" | "<=" | "=" | "~";
    /** The comparison value. */
    value: Literal;
}

/** An index query over the data store. */
export type DatastoreQuery = IndexAnd | IndexOr | IndexNot | IndexCompare;

export interface DatastoreSort {
    direction: "ascending" | "descending";
    /** The indexed field to sort on. */
    key: string;
}
