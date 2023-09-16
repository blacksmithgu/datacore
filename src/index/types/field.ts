import { Literal, Literals } from "expression/literal";
import { Indexable } from "./indexable";

/** The source of a field, used when determining what files to overwrite and how. */
export type Provenance = { type: "frontmatter"; file: string; key: string } | { type: "intrinsic" };

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

/** Metadata for objects which are annotated with fields. */
export const FIELDBEARING_TYPE = "fields";
export interface Fieldbearing {
    /** Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations. */
    fields: Field[];

    /** Fetch a field with the given name if it is present on this object. */
    field(key: string): Field | undefined;
}

/** Constant for the intrinsic provenance.  */
export const INTRINSIC_PROVENANCE: Provenance = { type: "intrinsic" };

/**
 * Generic function which extract fields. If no argument is provided, it should return all fields; otherwise,
 * it should return the field matching the given key.
 *
 * Keys are case-insensitive to match Obsidian standard behavior.
 */
export type FieldExtractor<T> = (object: T, key?: string) => Field[];

/** Quick utilities for generating fields and doing searches over them. */
export namespace Extractors {
    /** Default intrinsic fields to be ignored when extracting fields. */
    export const DEFAULT_EXCLUDES = new Set(["fields", "$$normkeys"]);

    function isValidIntrinsic(object: Record<string, any>, key: string, exclude?: Set<string>): boolean {
        // Don't allow recursion on 'fields' or cached values, and skip any ignored.
        if (DEFAULT_EXCLUDES.has(key) || exclude?.has(key)) return false;

        // No functions, only use actual values.
        const value = (object as any)[key];
        if (Literals.isFunction(value)) return false;

        return true;
    }

    /** Find the value in options that equals the key (case-insensitive), if present. */
    function findCaseInsensitive(key: string, options: string[]): string | undefined {
        const lower = key.toLowerCase();
        for (const option of options) {
            if (option.toLowerCase() == lower) return option;
        }

        return undefined;
    }

    /** Generate a list of fields for the given object, returning them as a list. */
    export function intrinsics<T extends Record<string, any>>(except?: Set<string>): FieldExtractor<T> {
        return (object: T, key?: string) => {
            if (key == null) {
                const fields: Field[] = [];

                for (const key of Object.keys(object)) {
                    if (!isValidIntrinsic(object, key, except)) continue;

                    fields.push({
                        key,
                        value: (object as any)[key],
                        provenance: INTRINSIC_PROVENANCE,
                    });
                }

                return fields;
            } else {
                // If key is directly present in object, just return it.
                if (key in object && isValidIntrinsic(object, key, except)) {
                    return [
                        {
                            key,
                            value: (object as any)[key],
                            provenance: INTRINSIC_PROVENANCE,
                        },
                    ] as Field[];
                }

                return [];
            }
        };
    }

    /** Field extractor which extracts frontmatter fields. */
    export function frontmatter<T extends Indexable>(
        front: (object: T) => Record<string, Literal> | undefined,
        raw: (object: T) => Record<string, any> | undefined
    ): FieldExtractor<T> {
        return (object: T, key?: string) => {
            const frontmatter = front(object);
            const raws = raw?.(object) ?? {};

            if (!frontmatter) return [];

            if (key == null) {
                const fields: Field[] = [];

                for (const key of Object.keys(frontmatter)) {
                    const value = frontmatter[key];
                    const raw = raws[key];

                    fields.push({
                        key,
                        value,
                        raw,
                        provenance: { type: "frontmatter", file: object.$file!, key },
                    });
                }

                return fields;
            } else {
                // If the key is not in the frontmatter, try finding it via a case-insensitive search.
                if (!(key in frontmatter)) {
                    key = findCaseInsensitive(key, Object.keys(frontmatter));
                    if (key == undefined || !(key in frontmatter)) return [];
                }

                const value = frontmatter[key];
                const raw = raws[key];

                return [
                    {
                        key,
                        value,
                        raw,
                        provenance: { type: "frontmatter", file: object.$file!, key },
                    },
                ];
            }
        };
    }

    /** Merge multiple field extractors into one; if multiple extractors produce identical keys, keys from the earlier extractor will be preferred. */
    export function merge<T extends Fieldbearing>(...extractors: FieldExtractor<T>[]): FieldExtractor<T> {
        return (object: T, key?: string) => {
            if (key == null) {
                const used = new Set<string>();

                const fields: Field[] = [];
                for (const extractor of extractors) {
                    for (const field of extractor(object, undefined)) {
                        if (used.has(field.key.toLowerCase())) continue;

                        used.add(field.key.toLowerCase());
                        fields.push(field);
                    }
                }
                return fields;
            } else {
                for (const extractor of extractors) {
                    const field = extractor(object, key);
                    if (field && field.length > 0) return field;
                }

                return [];
            }
        };
    }
}
