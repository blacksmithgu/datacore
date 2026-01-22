/**
 * @module api
 */
import { DataObject, Literal, Literals } from "expression/literal";
import { Indexable } from "../index/types/indexable";
import { InlineField } from "index/import/inline-field";
import { FrontmatterEntry } from "index/types/markdown";

/** The source of a field, used when determining what files to overwrite and how. */
export type Provenance =
    | { type: "frontmatter"; file: string; key: string; revision: number }
    | { type: "inline-field"; file: string; line: number; key: string; revision: number }
    | { type: "intrinsic"; file: string; revision: number };

/**
 * General definition for a field. Provides the field key, value, as well as information on it's source and how it can be edited.
 * @group Common Types
 * */
export interface Field {
    /** The canonical key name for the field (i.e., as it actually shows up in the data structure). */
    key: string;
    /** The value of the field. */
    value: Literal;
    /** The raw value of the field before parsing, if relevant. */
    raw?: string;
    /** If present, describes where the field came from in precise detail, allowing the field to be edited. */
    provenance: Provenance;
}

/** Metadata for objects which are annotated with fields. */
export const FIELDBEARING_TYPE = "fields";
export interface Fieldbearing {
    /** Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations. */
    fields: Field[];

    /** Fetch a field with the given name if it is present on this object. */
    field(key: string): Field | undefined;
}

export namespace Fieldbearings {
    export function isFieldbearing(object: unknown): object is Fieldbearing {
        return (
            object != null && typeof object === "object" && "field" in object && typeof object["field"] == "function"
        );
    }

    /** Get a key from a generic map or fieldbearing object. */
    export function get(object: Fieldbearing | DataObject, key: string): Literal | undefined {
        if (isFieldbearing(object)) return object.field(key)?.value;
        else return object[key];
    }
}

/**
 * Generic function which extract fields. If no argument is provided, it should return all fields; otherwise,
 * it should return the field matching the given key.
 *
 * Keys are case-insensitive to match Obsidian standard behavior.
 */
export type FieldExtractor<T> = (object: T, key?: string) => Field[];

/** Quick utilities for generating fields and doing searches over them.
 * @hidden
 */
export namespace Extractors {
    /** Check if the given property in the object is not excluded and is a plain property (not a function or other special object). */
    function isValidIntrinsic(object: Record<string, unknown>, key: string, exclude?: Set<string>): boolean {
        // Don't allow recursion on 'fields' or cached values, and skip any ignored and non-intrinsics.
        if (exclude?.has(key) || !key.startsWith("$")) return false;

        // No functions, only use actual values.
        const value = (object as Record<string, unknown>)[key];
        if (Literals.isFunction(value)) return false;

        return true;
    }

    /** Get all keys of the object, including derived fields from prototypes. */
    function* prototypeKeys(object: object): Generator<string> {
        for (const key of Object.keys(object)) yield key;

        let proto = Object.getPrototypeOf(object);
        while (proto) {
            for (const key of Object.getOwnPropertyNames(proto)) yield key;

            proto = Object.getPrototypeOf(proto);
        }
    }

    /** Generate a list of fields for the given object, returning them as a list. */
    export function intrinsics<T extends Indexable>(except?: Set<string>): FieldExtractor<T> {
        return (maybeObject: T, key?: string) => {
            const object = maybeObject as Record<string, unknown> & Indexable;
            if (key == null) {
                const fields: Field[] = [];

                for (const key of prototypeKeys(object)) {
                    if (!isValidIntrinsic(object, key, except)) continue;

                    fields.push({
                        key,
                        value: (object as Record<string, Literal>)[key],
                        provenance: { type: "intrinsic", file: object.$file!, revision: object.$revision ?? 0 },
                    });
                }

                return fields;
            } else {
                // If key is directly present in object, just return it.
                if (key in object && isValidIntrinsic(object, key, except)) {
                    const entry: Field = {
                        key,
                        value: (object as Record<string, Literal>)[key],
                        provenance: { type: "intrinsic", file: object.$file!, revision: object.$revision ?? 0 },
                    };

                    return [entry];
                }

                return [];
            }
        };
    }

    /** Field extractor which extracts frontmatter fields. */
    export function frontmatter<T extends Indexable>(
        front: (object: T) => Record<string, FrontmatterEntry> | undefined
    ): FieldExtractor<T> {
        return (object: T, key?: string) => {
            const frontmatter = front(object);
            if (!frontmatter) return [];

            if (key == null) {
                const fields: Field[] = [];

                for (const key of Object.keys(frontmatter)) {
                    const entry = frontmatter[key];

                    fields.push({
                        key: entry.key.toLowerCase(),
                        value: entry.value,
                        raw: entry.raw,
                        provenance: {
                            type: "frontmatter",
                            file: object.$file!,
                            key: entry.key,
                            revision: object.$revision ?? 0,
                        },
                    });
                }

                return fields;
            } else {
                key = key.toLowerCase();
                if (!(key in frontmatter)) return [];

                const entry = frontmatter[key];

                return [
                    {
                        key: key,
                        value: entry.value,
                        raw: entry.raw,
                        provenance: { type: "frontmatter", file: object.$file!, key, revision: object.$revision ?? 0 },
                    },
                ];
            }
        };
    }

    /** Field extractor which shows all inline fields. */
    export function inlineFields<T extends Indexable>(
        inlineMap: (object: T) => Record<string, InlineField> | undefined
    ): FieldExtractor<T> {
        return (object: T, key?: string) => {
            const map = inlineMap(object);
            if (!map) return [];

            if (key == null) {
                const fields = [];

                for (const field of Object.values(map)) {
                    const provenance: Provenance = {
                        type: "inline-field",
                        file: object.$file!,
                        line: field.position.line,
                        key: field.key,
                        revision: object.$revision ?? 0,
                    };

                    fields.push({
                        key: field.key.toLowerCase(),
                        value: field.value,
                        raw: field.raw,
                        provenance,
                    });
                }

                return fields;
            } else {
                key = key.toLowerCase();
                if (!(key in map)) return [];

                const field = map[key];
                const provenance: Provenance = {
                    type: "inline-field",
                    file: object.$file!,
                    line: field.position.line,
                    key: field.key,
                    revision: object.$revision ?? 0,
                };
                return [
                    {
                        key: key,
                        value: field.value,
                        raw: field.raw,
                        provenance,
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
