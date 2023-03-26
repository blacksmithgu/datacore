import { Literal } from "expression/literal";

/** AND two or more datastore queries together. */
export interface DatastoreAnd {
    type: "and";
    elements: DatastoreQuery[];
}

/** OR two or more datastore queries together. */
export interface DatastoreOr {
    type: "or";
    elements: DatastoreQuery[];
}

/** NOT a datastore query, returning all pages not matching.. */
export interface DatastoreNot {
    type: "not";
    element: DatastoreQuery;
}

/** Primitive operation which compares a value against a field. */
export interface DatastoreCompare {
    type: "compare";

    /** The indexed field. */
    key: string;
    /** The comparison operator to apply over the index. */
    operator: ">" | "<" | ">=" | "<=" | "=" | "~";
    /** The comparison value. */
    value: Literal;
}

/** An index query over the data store. */
export type DatastoreQuery = DatastoreAnd | DatastoreOr;