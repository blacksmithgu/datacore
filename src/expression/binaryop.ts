/** Provides a global dispatch table for evaluating binary operators, including comparison. */
import { LiteralRepr, LiteralType, Literal, Literals, Link } from "expression/literal";
import { normalizeDuration } from "utils/normalizers";
import { Result } from "api/result";
import { BinaryOp, Expressions } from "expression/expression";
import type { Evaluator } from "expression/evaluator";
import { DateTime, Duration } from "luxon";
import { Settings } from "settings";
import { Fieldbearings } from "./field";

/** A literal type or a catch-all '*'. */
export type LiteralTypeOrAll = LiteralType | "*";

/** Maps a literal type or the catch-all '*'. */
export type LiteralReprAll<T extends LiteralTypeOrAll> = T extends LiteralType ? LiteralRepr<T> : Literal;

/** An implementation for a binary operator. */
export type BinaryOpImpl<A extends Literal, B extends Literal> = (first: A, second: B, ctx: Evaluator) => Literal;
/** Binary operator which can fail and produce an error. */
export type BinaryOpResultImpl<A extends Literal, B extends Literal> = (
    first: A,
    second: B,
    ctx: Evaluator
) => Result<Literal, string>;
/** An implementation of a comparator (returning a number) which then automatically defines all of the comparison operators. */
export type CompareImpl<T extends Literal> = (first: T, second: T, ctx: Evaluator) => number;

/** Provides implementations for binary operators on two types using a registry. */
export class BinaryOpHandler {
    private map: Map<string, BinaryOpResultImpl<Literal, Literal>>;
    private handleDefaultNulls: boolean;

    public static create() {
        return new BinaryOpHandler();
    }

    public constructor() {
        this.map = new Map();
        this.handleDefaultNulls = false;
    }

    public register<T extends LiteralTypeOrAll, U extends LiteralTypeOrAll>(
        left: T,
        op: BinaryOp,
        right: U,
        func: BinaryOpImpl<LiteralReprAll<T>, LiteralReprAll<U>>
    ): BinaryOpHandler {
        this.map.set(BinaryOpHandler.repr(op, left, right), (a, b, c) =>
            Result.success(func(a as LiteralReprAll<T>, b as LiteralReprAll<U>, c))
        );
        return this;
    }

    public registerResult<T extends LiteralTypeOrAll, U extends LiteralTypeOrAll>(
        left: T,
        op: BinaryOp,
        right: U,
        func: BinaryOpResultImpl<LiteralReprAll<T>, LiteralReprAll<U>>
    ): BinaryOpHandler {
        this.map.set(BinaryOpHandler.repr(op, left, right), func as BinaryOpResultImpl<Literal, Literal>);
        return this;
    }

    public registerComm<T extends LiteralTypeOrAll, U extends LiteralTypeOrAll>(
        left: T,
        op: BinaryOp,
        right: U,
        func: BinaryOpImpl<LiteralReprAll<T>, LiteralReprAll<U>>
    ): BinaryOpHandler {
        return this.register(left, op, right, func).register(right, op, left, (a, b, ctx) => func(b, a, ctx));
    }

    /** If enabled, all null (op) null operations produce null. */
    public withDefaultNullHandling(): BinaryOpHandler {
        this.handleDefaultNulls = true;
        return this;
    }

    /** Implement a comparison function. */
    public compare<T extends LiteralTypeOrAll>(type: T, compare: CompareImpl<LiteralReprAll<T>>): BinaryOpHandler {
        return this.register(type, "<", type, (a, b, ctx) => compare(a, b, ctx) < 0)
            .register(type, "<=", type, (a, b, ctx) => compare(a, b, ctx) <= 0)
            .register(type, ">", type, (a, b, ctx) => compare(a, b, ctx) > 0)
            .register(type, ">=", type, (a, b, ctx) => compare(a, b, ctx) >= 0)
            .register(type, "=", type, (a, b, ctx) => compare(a, b, ctx) == 0)
            .register(type, "!=", type, (a, b, ctx) => compare(a, b, ctx) != 0);
    }

    /** Attempt to evaluate the given binary operator on the two literal fields. */
    public evaluate(op: BinaryOp, left: Literal, right: Literal, ctx: Evaluator): Result<Literal, string> {
        let leftType = Literals.typeOf(left);
        let rightType = Literals.typeOf(right);
        if (!leftType) return Result.failure(`Unrecognized value '${left}'`);
        else if (!rightType) return Result.failure(`Unrecognized value '${right}'`);

        // Quick case: handle null (op) null by default if enabled.
        if (this.handleDefaultNulls && leftType === "null" && rightType === "null") return Result.success(null);

        let handler = this.map.get(BinaryOpHandler.repr(op, leftType, rightType));
        if (handler) return handler(left, right, ctx);

        // Right-'*' fallback:
        let handler2 = this.map.get(BinaryOpHandler.repr(op, leftType, "*"));
        if (handler2) return handler2(left, right, ctx);

        // Left-'*' fallback:
        let handler3 = this.map.get(BinaryOpHandler.repr(op, "*", rightType));
        if (handler3) return handler3(left, right, ctx);

        // Double '*' fallback.
        let handler4 = this.map.get(BinaryOpHandler.repr(op, "*", "*"));
        if (handler4) return handler4(left, right, ctx);

        return Result.failure(`No implementation found for '${leftType} ${op} ${rightType}'`);
    }

    /** Create a string representation of the given triplet for unique lookup in the map. */
    public static repr(op: BinaryOp, left: LiteralTypeOrAll, right: LiteralTypeOrAll) {
        return `${left},${op},${right}`;
    }
}

/** Configure and create a binary OP handler with the given parameters. */
export function createBinaryOps(linkNormalizer: (x: string) => string): BinaryOpHandler {
    return (
        BinaryOpHandler.create()
            .compare("*", (a, b) => Literals.compare(a, b, linkNormalizer))
            // Global boolean operations.
            .register("*", "&", "*", (a, b) => Literals.isTruthy(a) && Literals.isTruthy(b))
            .register("*", "|", "*", (a, b) => Literals.isTruthy(a) || Literals.isTruthy(b))
            // Number implementations.
            .register("number", "+", "number", (a, b) => a + b)
            .register("number", "-", "number", (a, b) => a - b)
            .register("number", "*", "number", (a, b) => a * b)
            .register("number", "/", "number", (a, b) => a / b)
            .register("number", "%", "number", (a, b) => a % b)
            // String implementations.
            .register("string", "+", "*", (a, b, ctx) => a + Literals.toString(b, stringSettings(ctx.settings)))
            .register("*", "+", "string", (a, b, ctx) => Literals.toString(a, stringSettings(ctx.settings)) + b)
            .registerComm("string", "*", "number", (a, b) => (b < 0 ? "" : a.repeat(b)))
            // Date Operations.
            .register("date", "-", "date", (a, b) => {
                return normalizeDuration(
                    a.diff(b, ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"])
                );
            })
            .register("date", "-", "duration", (a, b) => a.minus(b))
            .registerComm("date", "+", "duration", (a, b) => a.plus(b))
            // Duration Operations.
            .register("duration", "+", "duration", (a, b) => normalizeDuration(a.plus(b)))
            .register("duration", "-", "duration", (a, b) => normalizeDuration(a.minus(b)))
            .register("duration", "/", "number", (a, b) => normalizeDuration(a.mapUnits((x) => x / b)))
            .registerComm("duration", "*", "number", (a, b) => normalizeDuration(a.mapUnits((x) => x * b)))
            // Array operations.
            .register("array", "+", "array", (a, b) => ([] as Literal[]).concat(a).concat(b))
            // Object operations.
            .register("object", "+", "object", (a, b) => Object.assign({}, a, b))
            // Index operations.
            .register("array", "index", "number", (arr, idx) => {
                if (idx < 0 || idx >= arr.length) return null;
                return arr[idx];
            })
            .registerResult("array", "index", "string", (arr, key, context) => {
                if (arr.length == 0) return Result.success([]);

                const result = [];
                for (const element of arr) {
                    const resolved = context.evaluate(
                        Expressions.index(Expressions.literal(element), Expressions.literal(key))
                    );
                    if (!resolved.successful) return Result.failure(resolved.error);

                    result.push(resolved.value);
                }

                return Result.success(result);
            })
            .register("object", "index", "string", (obj, key) => Fieldbearings.get(obj, key) ?? null)
            .registerResult("link", "index", "string", indexLink)
            .registerResult("link", "index", "number", indexLink)
            .register("object", "index", "number", (obj, key) => obj[key] ?? null)
            .register("string", "index", "number", (str, idx) => (idx < 0 || idx >= str.length ? null : str[idx]))
            .register("date", "index", "string", indexDate)
            .register("duration", "index", "string", indexDuration)
            .withDefaultNullHandling()
    );
}

/** Convert high level settings to settings used for string rendering. */
export function stringSettings(settings: Settings): Literals.ToStringSettings {
    return {
        dateFormat: settings.defaultDateFormat,
        dateTimeFormat: settings.defaultDateTimeFormat,
        nullRepresentation: settings.renderNullAs,
    };
}

/** Allows you to index into links to get metadata. */
export function indexLink(link: Link, key: string | number, context: Evaluator): Result<Literal, string> {
    const object = context.linkHandler.resolve(link);
    if (!object) return Result.success(null);

    return context.evaluate(Expressions.index(Expressions.literal(object), Expressions.literal(key)));
}

/** Index into a date, producing various useful fields. */
export function indexDate(date: DateTime, key: string) {
    switch (key) {
        case "year":
            return date.year;
        case "month":
            return date.month;
        case "day":
            return date.day;
        case "hour":
            return date.hour;
        case "minute":
            return date.minute;
        case "second":
            return date.second;
        case "millisecond":
            return date.millisecond;
        case "week":
            return date.weekNumber;
        default:
            return null;
    }
}

/** Index into a duration, producing various useful fields. */
export function indexDuration(dur: Duration, key: string) {
    switch (key) {
        case "years":
            return dur.years;
        case "months":
            return dur.months;
        case "days":
            return dur.days;
        case "hours":
            return dur.hours;
        case "minutes":
            return dur.minutes;
        case "seconds":
            return dur.seconds;
        case "milliseconds":
            return dur.milliseconds;
        default:
            return null;
    }
}
