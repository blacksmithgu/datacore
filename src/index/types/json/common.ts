import { Link, JsonLink } from "expression/link";
import { Literal, Literals } from "expression/literal";
import { mapObjectValues } from "utils/data";
import { DateTime, Duration } from "luxon";

/** JSON-serialized equivalents for literals. */
export type JsonLiteral =
    | boolean
    | number
    | string
    | { $_type: "date"; value: string }
    | { $_type: "duration"; value: string }
    | { $_type: "link"; value: JsonLink }
    | Array<JsonLiteral>
    | Record<string, unknown>
    | null;

export namespace JsonConversion {
    export const NOOP_NORMALIZER: (input: Literal) => Literal = (input) => input;

    /** Convert a literal value to a safe, persistent JSON equivalent. */
    export function json(literal: Literal): JsonLiteral {
        const wrapped = Literals.wrapValue(literal);
        if (!wrapped) return null;

        switch (wrapped?.type) {
            case "array":
                return wrapped.value.map(JsonConversion.json);
            case "object":
                return mapObjectValues(wrapped.value as Record<string, Literal>, JsonConversion.json);
            case "date":
                return { $_type: "date", value: wrapped.value.toISO({ extendedZone: true, includeOffset: true }) };
            case "link":
                return { $_type: "link", value: wrapped.value.toObject() };
            case "duration":
                return { $_type: "duration", value: wrapped.value.toISO() };
            case "boolean":
            case "number":
            case "string":
                return wrapped.value;
            case "function":
            case "null":
                return null;
        }
    }

    /**
     * Convert a JSON literal to it's corresponding hydrated value, optionally applying
     * a normalization step to the resulting value and any literals contained within it
     * (such as if the literal is a list or object).
     */
    export function value(json: JsonLiteral, normalizer: (input: Literal) => Literal = NOOP_NORMALIZER): Literal {
        if (json === null || json === undefined) return null;

        if (Array.isArray(json)) {
            return normalizer(json.map((input) => JsonConversion.value(input, normalizer)));
        } else if (typeof json === "object") {
            if (!("$_type" in json))
                return mapObjectValues(json, (v: unknown) => JsonConversion.value(v as JsonLiteral, normalizer));

            switch (json["$_type"]) {
                case "date":
                    return normalizer(DateTime.fromISO(json.value as string, { setZone: true }));
                case "duration":
                    return normalizer(Duration.fromISO(json.value as string));
                case "link":
                    return normalizer(Link.fromObject(json.value as JsonLink));
                default:
                    throw new Error(`Unrecognized serialized type '${json["$_type"]}'!`);
            }
        }

        // Primitive type, return as is.
        return normalizer(json as Literal);
    }
}
