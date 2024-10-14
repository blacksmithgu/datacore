/**
 * @module expressions
 */
import { DateTime, Duration } from "luxon";
import { Link } from "expression/link";
import { renderMinimalDate, renderMinimalDuration } from "utils/normalizers";

// Re-exports of useful generic types.
export { Link };

/** Shorthand for a mapping from keys to values. */
export type DataObject = Record<string, any>;
/** The literal types supported by the query engine. */
export type LiteralType =
    | "boolean"
    | "number"
    | "string"
    | "date"
    | "duration"
    | "link"
    | "array"
    | "object"
    | "function"
    | "null";
/** The raw values that a literal can take on. */
export type Literal =
    | boolean
    | number
    | string
    | DateTime
    | Duration
    | Link
    | Array<Literal>
    | DataObject
    | Function
    | null;

/** Maps the string type to it's external, API-facing representation. */
export type LiteralRepr<T extends LiteralType> = T extends "boolean"
    ? boolean
    : T extends "number"
    ? number
    : T extends "string"
    ? string
    : T extends "duration"
    ? Duration
    : T extends "date"
    ? DateTime
    : T extends "null"
    ? null
    : T extends "link"
    ? Link
    : T extends "array"
    ? Array<Literal>
    : T extends "object"
    ? DataObject
    : T extends "function"
    ? Function
    : any;

/** A wrapped literal value which can be switched on. */
export type WrappedLiteral =
    | LiteralWrapper<"string">
    | LiteralWrapper<"number">
    | LiteralWrapper<"boolean">
    | LiteralWrapper<"date">
    | LiteralWrapper<"duration">
    | LiteralWrapper<"link">
    | LiteralWrapper<"array">
    | LiteralWrapper<"object">
    | LiteralWrapper<"function">
    | LiteralWrapper<"null">;

/** Combines a textual type and value; primarily useful for switching on.
 * @hidden
 */
export interface LiteralWrapper<T extends LiteralType> {
    type: T;
    value: LiteralRepr<T>;
}

/**
 * @hidden
 *  Utility library for handling literal values. */
export namespace Literals {
    /** Settings used when formatting literal values to text. */
    export interface ToStringSettings {
        /** What a null will render as. */
        nullRepresentation: string;

        /** Date format. */
        dateFormat: string;

        /** Date-time format. */
        dateTimeFormat: string;
    }

    /** Sane, English-based defaults for date formats. */
    export const DEFAULT_TO_STRING: ToStringSettings = {
        nullRepresentation: "-",

        dateFormat: "MMMM dd, yyyy",
        dateTimeFormat: "h:mm a - MMMM dd, yyyy",
    };

    /** Convert an arbitrary value into a reasonable, Markdown-friendly string if possible. */
    export function toString(
        field: any,
        setting: ToStringSettings = DEFAULT_TO_STRING,
        recursive: boolean = false
    ): string {
        let wrapped = wrapValue(field);
        if (!wrapped) return setting.nullRepresentation;

        switch (wrapped.type) {
            case "null":
                return setting.nullRepresentation;
            case "string":
                return wrapped.value;
            case "number":
            case "boolean":
                return "" + wrapped.value;
            case "link":
                return wrapped.value.markdown();
            case "function":
                return "<function>";
            case "array":
                let result = "";
                if (recursive) result += "[";
                result += wrapped.value.map((f) => toString(f, setting, true)).join(", ");
                if (recursive) result += "]";
                return result;
            case "object":
                return (
                    "{ " +
                    Object.entries(wrapped.value)
                        .map((e) => e[0] + ": " + toString(e[1], setting, true))
                        .join(", ") +
                    " }"
                );
            case "date":
                return renderMinimalDate(wrapped.value, setting.dateFormat, setting.dateTimeFormat);
            case "duration":
                return renderMinimalDuration(wrapped.value);
        }
    }

    /** Wrap a literal value so you can switch on it easily. */
    export function wrapValue(val: Literal): WrappedLiteral | undefined {
        if (isNull(val)) return { type: "null", value: val };
        else if (isNumber(val)) return { type: "number", value: val };
        else if (isString(val)) return { type: "string", value: val };
        else if (isBoolean(val)) return { type: "boolean", value: val };
        else if (isDuration(val)) return { type: "duration", value: val };
        else if (isDate(val)) return { type: "date", value: val };
        else if (isArray(val)) return { type: "array", value: val };
        else if (isLink(val)) return { type: "link", value: val };
        else if (isFunction(val)) return { type: "function", value: val };
        else if (isObject(val)) return { type: "object", value: val };
        else return undefined;
    }

    /** Recursively map complex objects at the leaves. */
    export function mapLeaves(val: Literal, func: (t: Literal) => Literal): Literal {
        if (isObject(val)) {
            let result: DataObject = {};
            for (let [key, value] of Object.entries(val)) result[key] = mapLeaves(value, func);
            return result;
        } else if (isArray(val)) {
            let result: Literal[] = [];
            for (let value of val) result.push(mapLeaves(value, func));
            return result;
        } else {
            return func(val);
        }
    }

    /** Check if two arbitrary literals are equal. */
    export function equals(first: Literal | undefined, second: Literal | undefined) {
        return compare(first, second) == 0;
    }

    /** Compare two arbitrary JavaScript values. Produces a total ordering over ANY possible datacore value. */
    export function compare(
        val1: Literal | undefined,
        val2: Literal | undefined,
        linkNormalizer?: (link: string) => string
    ): number {
        // Reference equality - short circuit.
        if (val1 === val2) return 0;

        // Handle undefined/nulls first.
        if (val1 === undefined) val1 = null;
        if (val2 === undefined) val2 = null;
        if (val1 === null && val2 === null) return 0;
        else if (val1 === null) return -1;
        else if (val2 === null) return 1;

        // A non-null value now which we can wrap & compare on.
        let wrap1 = wrapValue(val1);
        let wrap2 = wrapValue(val2);

        if (wrap1 === undefined && wrap2 === undefined) return 0;
        else if (wrap1 === undefined) return -1;
        else if (wrap2 === undefined) return 1;

        // Short-circuit on different types or on reference equality.
        if (wrap1.type != wrap2.type) return wrap1.type.localeCompare(wrap2.type);
        if (wrap1.value === wrap2.value) return 0;

        switch (wrap1.type) {
            case "string":
                return wrap1.value.localeCompare(wrap2.value as string);
            case "number":
                if (wrap1.value < (wrap2.value as number)) return -1;
                else if (wrap1.value == (wrap2.value as number)) return 0;
                return 1;
            case "null":
                return 0;
            case "boolean":
                if (wrap1.value == wrap2.value) return 0;
                else return wrap1.value ? 1 : -1;
            case "link":
                let link1 = wrap1.value;
                let link2 = wrap2.value as Link;
                let normalize = linkNormalizer ?? ((x: string) => x);

                // We can't compare by file name or display, since that would break link equality. Compare by path.
                let pathCompare = normalize(link1.path).localeCompare(normalize(link2.path));
                if (pathCompare != 0) return pathCompare;

                // Then compare by type.
                let typeCompare = link1.type.localeCompare(link2.type);
                if (typeCompare != 0) return typeCompare;

                // Then compare by subpath existence.
                if (link1.subpath && !link2.subpath) return 1;
                if (!link1.subpath && link2.subpath) return -1;
                if (!link1.subpath && !link2.subpath) return 0;

                // Since both have a subpath, compare by subpath.
                return (link1.subpath ?? "").localeCompare(link2.subpath ?? "");
            case "date":
                return wrap1.value < (wrap2.value as DateTime)
                    ? -1
                    : wrap1.value.equals(wrap2.value as DateTime)
                    ? 0
                    : 1;
            case "duration":
                return wrap1.value < (wrap2.value as Duration)
                    ? -1
                    : wrap1.value.equals(wrap2.value as Duration)
                    ? 0
                    : 1;
            case "array":
                let f1 = wrap1.value;
                let f2 = wrap2.value as any[];
                for (let index = 0; index < Math.min(f1.length, f2.length); index++) {
                    let comp = compare(f1[index], f2[index]);
                    if (comp != 0) return comp;
                }
                return f1.length - f2.length;
            case "object":
                let o1 = wrap1.value;
                let o2 = wrap2.value as Record<string, any>;
                let k1 = Array.from(Object.keys(o1));
                let k2 = Array.from(Object.keys(o2));
                k1.sort();
                k2.sort();

                let keyCompare = compare(k1, k2);
                if (keyCompare != 0) return keyCompare;

                for (let key of k1) {
                    let comp = compare(o1[key], o2[key]);
                    if (comp != 0) return comp;
                }

                return 0;
            case "function":
                return 0;
        }
    }

    /** Find the corresponding datacore type for an arbitrary value. */
    export function typeOf(val: any): LiteralType | undefined {
        return wrapValue(val)?.type;
    }

    /** Determine if the given value is "truthy" (i.e., is non-null and has data in it). */
    export function isTruthy(field: Literal): boolean {
        let wrapped = wrapValue(field);
        if (!wrapped) return false;

        switch (wrapped.type) {
            case "number":
                return wrapped.value != 0;
            case "string":
                return wrapped.value.length > 0;
            case "boolean":
                return wrapped.value;
            case "link":
                return !!wrapped.value.path;
            case "date":
                return wrapped.value.toMillis() != 0;
            case "duration":
                return wrapped.value.as("seconds") != 0;
            case "object":
                return Object.keys(wrapped.value).length > 0;
            case "array":
                return wrapped.value.length > 0;
            case "null":
                return false;
            case "function":
                return true;
        }
    }

    /** Deep copy a field. */
    export function deepCopy<T extends Literal>(field: T): T {
        if (field === null || field === undefined) return field;

        if (Literals.isArray(field)) {
            return ([] as Literal[]).concat(field.map((v) => deepCopy(v))) as T;
        } else if (Literals.isObject(field)) {
            let result: Record<string, Literal> = {};
            for (let [key, value] of Object.entries(field)) result[key] = deepCopy(value);
            return result as T;
        } else {
            return field;
        }
    }

    /** Determine if the value is a string. */
    export function isString(val: any): val is string {
        return typeof val == "string";
    }

    /** Determine if the value is a number. */
    export function isNumber(val: any): val is number {
        return typeof val == "number";
    }

    /** Determine if the value is a date. */
    export function isDate(val: any): val is DateTime {
        return val instanceof DateTime;
    }

    /** Determine if the value is a duration. */
    export function isDuration(val: any): val is Duration {
        return val instanceof Duration;
    }

    /** Determine if the value is null or undefined. */
    export function isNull(val: any): val is null | undefined {
        return val === null || val === undefined;
    }

    /** Determine if the value is an array. */
    export function isArray(val: any): val is any[] {
        return Array.isArray(val);
    }

    /** Determine if the value is a boolean. */
    export function isBoolean(val: any): val is boolean {
        return typeof val === "boolean";
    }

    /** Determine if the value is a link. */
    export function isLink(val: any): val is Link {
        return val instanceof Link;
    }

    /** Checks if the given value is an object (and not any other datacore-recognized object-like type). */
    export function isObject(val: any): val is Record<string, any> {
        return (
            val !== undefined &&
            typeof val == "object" &&
            !isArray(val) &&
            !isDuration(val) &&
            !isDate(val) &&
            !isLink(val) &&
            !isNull(val)
        );
    }

    /** Determines if the given value is a javascript function. */
    export function isFunction(val: any): val is Function {
        return typeof val == "function";
    }
}

/** A grouping on a type which supports recursively-nested groups.
 * @group Common Types
 */
export type GroupElement<T> = { key: Literal; rows: Grouping<T> };
/**
 * A grouping, which can be either:
 * - an array of elements of type `T`, or
 * - an array of {@link Groupelement}s
 *
 * @group Common Types
 */
export type Grouping<T> = T[] | GroupElement<T>[];
/**
 * @hidden
 */
export namespace Groupings {
    /** Determines if the given group entry is a standalone value, or a grouping of sub-entries. */
    export function isElementGroup<T>(entry: any): entry is GroupElement<T> {
        return Literals.isObject(entry) && Object.keys(entry).length == 2 && "key" in entry && "rows" in entry;
    }

    /** Determines if the given array is a grouping array. */
    export function isGrouping<T>(entry: Grouping<T>): entry is GroupElement<T>[] {
        for (let element of entry) if (!isElementGroup(element)) return false;

        return true;
    }

    /** Determines if the given array is a leaf and has no subgroupings. */
    export function isLeaf<T>(entry: Grouping<T>): entry is T[] {
        for (let element of entry) if (isElementGroup(element)) return false;

        return true;
    }

    /** Count the total number of elements in a recursive grouping. */
    export function count<T>(elements: Grouping<T> | GroupElement<T>): number {
        if (isElementGroup(elements)) {
            return count(elements.rows);
        } else if (isGrouping(elements)) {
            let result = 0;
            for (let subgroup of elements) result += count(subgroup.rows);
            return result;
        } else {
            return elements.length;
        }
    }

    /** Recursively slice a grouping, preserving the group structure that contains elements [start...end). */
    export function slice<T>(elements: Grouping<T>, start: number, end: number): Grouping<T> {
        if (end <= start) return [];
        if (isLeaf(elements)) return elements.slice(start, end);

        // Find the first group that contains index `start`.
        let index = 0,
            seen = 0;
        while (index < elements.length && seen + count(elements[index]) <= start) {
            seen += count(elements[index]);
            index++;
        }

        // start was greater than the entire length of the groupings.
        if (index >= elements.length) return [];

        const result: { key: Literal; rows: Grouping<T> }[] = [];
        while (index < elements.length && seen < end) {
            const group = elements[index];
            const groupSize = count(group);
            const groupStart = Math.max(seen, start);
            const groupEnd = Math.min(groupSize + seen, end);

            result.push({
                key: group.key,
                rows: slice(group.rows, groupStart - seen, groupEnd - seen),
            });

            seen += groupSize;
            index++;
        }

        return result;
    }
}
