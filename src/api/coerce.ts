/** @ignore */
//! Utilities for forcing types to be of a specific type or returning 'undefined' if not, allowing for much more concise typing.

import { Link, Literal, Literals } from "expression/literal";
import { PRIMITIVES } from "expression/parser";
import { DateTime, Duration } from "luxon";
import { renderMinimalDate } from "utils/normalizers";

export namespace Coerce {
    /** Coerces common types to string or otherwise undefined. */
    export function string(value: Literal): string | undefined {
        const wrapped = Literals.wrapValue(value);
        if (!wrapped) return undefined;

        switch (wrapped.type) {
            case "string":
                return wrapped.value;
            case "number":
                return "" + wrapped.value;
            case "date":
                return renderMinimalDate(wrapped.value, "yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss");
            case "link":
                return wrapped.value.markdown();
            case "boolean":
                return "" + wrapped.value;
            default:
                return undefined;
        }
    }

    /** Coerces booleans and string-booleans. */
    export function boolean(value: Literal): boolean | undefined {
        if (typeof value === "boolean") return value;
        else if (typeof value === "string" && value.toLowerCase() === "true") return true;
        else if (typeof value === "string" && value.toLowerCase() === "false") return false;
        else return undefined;
    }

    /** Coerces numbers and strings to numbers. */
    export function number(value: Literal): number | undefined {
        if (typeof value === "number") return value;
        else if (typeof value === "string") {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) return parsed;
            else return undefined;
        } else return undefined;
    }

    /** Coerces dates and strings into dates. */
    export function date(value: Literal): DateTime | undefined {
        if (value instanceof DateTime) return value;
        else if (typeof value === "string") {
            const parsed = PRIMITIVES.datePlus.parse(value);
            if (parsed.status) return parsed.value;
            else return undefined;
        } else return undefined;
    }

    /** Coerces durations and strings into durations. */
    export function duration(value: Literal): Duration | undefined {
        if (value instanceof Duration) return value;
        else if (typeof value === "string") {
            const parsed = PRIMITIVES.duration.parse(value);
            if (parsed.status) return parsed.value;
            else return undefined;
        } else return undefined;
    }

    /** Coerces links and strings into links. */
    export function link(value: Literal): Link | undefined {
        if (value instanceof Link) return value;
        else if (typeof value === "string") {
            const parsed = PRIMITIVES.embedLink.parse(value);
            if (parsed.status) return parsed.value;
            else return undefined;
        } else return undefined;
    }

    /** Coerces anything into an array, by converting non-arrays into unit length arrays. */
    export function array(value: Literal): Literal[] | undefined {
        if (Array.isArray(value)) return value;
        else return [value];
    }
}
