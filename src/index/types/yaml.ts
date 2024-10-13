/**
 * @module indexables
 */
/** Utilities for converting literal types to and from their YAML frontmatter representation. */

import { Literal, Literals } from "expression/literal";
import { PRIMITIVES } from "expression/parser";
import { DateTime } from "luxon";
import { mapObjectValues } from "utils/data";

/** YAML-friendly representation for a literal. */
export type YamlLiteral = string | number | boolean | null | Record<string, any> | Array<YamlLiteral>;
/**
 * @internal
 */
export namespace YamlConversion {
    /** Convert a literal into a yaml friendly representation. */
    export function yaml(value: Literal): YamlLiteral {
        const wrapped = Literals.wrapValue(literal);
        if (!wrapped) return null;

        switch (wrapped.type) {
            case "string":
            case "boolean":
            case "null":
            case "number":
                return wrapped.value;
            case "array":
                return wrapped.value.map(yaml);
            case "date":
                return wrapped.value.toISO();
            case "duration":
                return wrapped.value.toHuman();
            case "function":
                return null;
            case "link":
                return wrapped.value.markdown();
            case "object":
                return mapObjectValues(wrapped.value, yaml);
        }
    }

    /** Recursively convert a YAML literal into a regular literal value. */
    export function literal(value: YamlLiteral): Literal {
        if (value == null) {
            return null;
        } else if (typeof value === "object") {
            if (Array.isArray(value)) {
                let result = [];
                for (let child of value as Array<any>) {
                    result.push(literal(child));
                }

                return result;
            } else if (value instanceof Date) {
                let dateParse = DateTime.fromJSDate(value);
                return dateParse;
            } else {
                let object = value as Record<string, any>;
                let result: Record<string, Literal> = {};
                for (let key in object) {
                    result[key] = literal(object[key]);
                }

                return result;
            }
        } else if (typeof value === "number") {
            return value;
        } else if (typeof value === "boolean") {
            return value;
        } else if (typeof value === "string") {
            let dateParse = PRIMITIVES.date.parse(value);
            if (dateParse.status) return dateParse.value;

            let durationParse = PRIMITIVES.duration.parse(value);
            if (durationParse.status) return durationParse.value;

            let linkParse = PRIMITIVES.link.parse(value);
            if (linkParse.status) return linkParse.value;

            return value;
        }

        // Backup if we don't understand the type.
        return null;
    }
}
