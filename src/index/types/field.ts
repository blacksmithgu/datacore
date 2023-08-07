import { Literal } from "expression/literal";

/** The source of a field, used when determining what files to overwrite and how. */
export type Provenance =
    { type: "frontmatter", file: string; key: string; raw: string; }
    | { type: "intrinsic", };

/** General definition for a field. Provides the field key, value, as well as information on it's source and how it can be edited. */
export interface Field {
    /** The canonical key name for the field (i.e., as it actually shows up in the data structure). */
    key: string;
    /** The value of the field. */
    value: Literal;
    /** The raw value of the field before parsing, if relevant. */
    raw?: string;
    /** If present, describes where the field came from in precise detail, allowing the field to be edited. */
    provenance?: Provenance;
}