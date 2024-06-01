import { Link, Literals } from "expression/literal";
import { DateTime, Duration } from "luxon";

/**
 * Simplifies passing complex values across the JS web worker barrier and to/from files.
 * The main goal is to allow for Datacore types to hold common collection primitives -
 * sets, maps, links, and so on - without needing to write too much explicit serialization code.
 */
export namespace Transferable {
    /** Convert a literal value to a serializer-friendly transferable value. */
    export function transferable(value: any): any {
        // Handle simple universal types first.
        if (value instanceof Map) {
            let copied = new Map();
            for (let [key, val] of value.entries()) copied.set(transferable(key), transferable(val));
            return copied;
        } else if (value instanceof Set) {
            let copied = new Set();
            for (let val of value) copied.add(transferable(val));
            return copied;
        }

        let wrapped = Literals.wrapValue(value);
        if (wrapped === undefined) throw Error("Unrecognized transferable value: " + value);

        switch (wrapped.type) {
            case "null":
            case "number":
            case "string":
            case "boolean":
                return wrapped.value;
            case "date":
                return {
                    "$transfer-type": "date",
                    value: wrapped.value.toISO({ includeOffset: true, extendedZone: true }),
                };
            case "duration":
                return {
                    "$transfer-type": "duration",
                    value: wrapped.value.toObject()
                };
            case "array":
                return wrapped.value.map((v) => transferable(v));
            case "link":
                return {
                    "$transfer-type": "link",
                    value: wrapped.value.toObject()
                };
            case "object":
                let result: Record<string, any> = {};

                // Only copy owned properties, and not derived/readonly properties like getters/computed fields.
                for (let key of Object.getOwnPropertyNames(wrapped.value))
                    result[key] = transferable(wrapped.value[key]);
                return result;
        }
    }

    /** Convert a transferable value back to a literal value we can work with. */
    export function value(transferable: any): any {
        if (transferable === null) {
            return null;
        } else if (transferable === undefined) {
            return undefined;
        } else if (transferable instanceof Map) {
            let real = new Map();
            for (let [key, val] of transferable.entries()) real.set(value(key), value(val));
            return real;
        } else if (transferable instanceof Set) {
            let real = new Set();
            for (let val of transferable) real.add(value(val));
            return real;
        } else if (Array.isArray(transferable)) {
            return transferable.map((v) => value(v));
        } else if (typeof transferable === "object") {
            if ("$transfer-type" in transferable) {
                switch (transferable["$transfer-type"]) {
                    case "date":
                        return DateTime.fromISO(transferable.value);
                    case "duration":
                        return Duration.fromObject(transferable.value);
                    case "link":
                        return Link.fromObject(transferable.value);
                    default:
                        throw Error(`Unrecognized transfer type '${transferable["$transfer-type"]}'`);
                }
            }

            let result: Record<string, any> = {};
            for (let [key, val] of Object.entries(transferable)) result[key] = value(val);
            return result;
        }

        return transferable;
    }
}
