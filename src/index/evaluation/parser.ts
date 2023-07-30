import { Link } from "expression/link";
import { DateTime, Duration } from "luxon";
import * as P from "parsimmon";
import { BinaryOp } from "./expression";
import emojiRegex from "emoji-regex";
import {
    IndexChildOf,
    IndexPath,
    IndexId,
    IndexNot,
    IndexParentOf,
    IndexQuery,
    IndexTagged,
    IndexTyped,
    IndexLinked,
} from "index/types/index-query";

////////////////////////
// Parsing Primitives //
////////////////////////

/** Primitive parsing for commonly seen types. */
export interface PrimitivesLanguage {
    number: number;
    string: string;
    escapeCharacter: string;
    bool: boolean;
    tag: string;
    identifier: string;
    link: Link;
    embedLink: Link;
    rootDate: DateTime;
    dateShorthand: keyof typeof DATE_SHORTHANDS;
    date: DateTime;
    datePlus: DateTime;
    durationType: keyof typeof DURATION_TYPES;
    duration: Duration;
    rawNull: string;

    binaryPlusMinus: BinaryOp;
    binaryMulDiv: BinaryOp;
    binaryCompareOp: BinaryOp;
    binaryAndOp: BinaryOp;
    binaryOrOp: BinaryOp;
}

/** Implementations for many primitives. */
export const PRIMITIVES = P.createLanguage<PrimitivesLanguage>({
    number: (_) =>
        P.regexp(/-?[0-9]+(\.[0-9]+)?/)
            .map((str) => Number.parseFloat(str))
            .desc("number"),

    // A quote-surrounded string which supports escape characters ('\').
    string: (q) =>
        P.string('"')
            .then(
                P.alt(q.escapeCharacter, P.noneOf('"\\'))
                    .atLeast(0)
                    .map((chars) => chars.join(""))
            )
            .skip(P.string('"'))
            .desc("string"),

    escapeCharacter: (_) =>
        P.string("\\")
            .then(P.any)
            .map((escaped) => {
                // If we are escaping a backslash or a quote, pass in on in escaped form
                if (escaped === '"') return '"';
                if (escaped === "\\") return "\\";
                else return "\\" + escaped;
            }),

    // A boolean true/false value.
    bool: (_) =>
        P.regexp(/true|false|True|False/)
            .map((str) => str.toLowerCase() == "true")
            .desc("boolean"),

    // A tag of the form '#stuff/hello-there'.
    tag: (_) =>
        P.seqMap(
            P.string("#"),
            P.alt(P.regexp(/[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]/).desc("text")).many(),
            (start, rest) => start + rest.join("")
        ).desc("tag"),

    // A variable identifier, which is alphanumeric and must start with a letter or... emoji.
    identifier: (_) =>
        P.seqMap(
            P.alt(P.regexp(/\p{Letter}/u), P.regexp(EMOJI_REGEX).desc("text")),
            P.alt(P.regexp(/[0-9\p{Letter}_-]/u), P.regexp(EMOJI_REGEX).desc("text")).many(),
            (first, rest) => first + rest.join("")
        ).desc("variable"),

    // An Obsidian link of the form [[<link>]].
    link: (_) =>
        P.regexp(/\[\[([^\[\]]*?)\]\]/u, 1)
            .map((linkInner) => Link.parseInner(linkInner))
            .desc("file link"),

    // An embeddable link which can start with '!'. This overlaps with the normal negation operator, so it is only
    // provided for metadata parsing.
    embedLink: (q) =>
        P.seqMap(P.string("!").atMost(1), q.link, (p, l) => {
            if (p.length > 0) l.embed = true;
            return l;
        }).desc("file link"),

    // Binary plus or minus operator.
    binaryPlusMinus: (_) =>
        P.regexp(/\+|-/)
            .map((str) => str as BinaryOp)
            .desc("'+' or '-'"),

    // Binary times or divide operator.
    binaryMulDiv: (_) =>
        P.regexp(/\*|\/|%/)
            .map((str) => str as BinaryOp)
            .desc("'*' or '/' or '%'"),

    // Binary comparison operator.
    binaryCompareOp: (_) =>
        P.regexp(/>=|<=|!=|>|<|=/)
            .map((str) => str as BinaryOp)
            .desc("'>=' or '<=' or '!=' or '=' or '>' or '<'"),

    // Binary boolean combination operator.
    binaryAndOp: (_) =>
        P.regexp(/and|&/i)
            .map((_str) => "&" as BinaryOp)
            .desc("'and'"),
    binaryOrOp: (_) =>
        P.regexp(/or|\|/i)
            .map((_str) => "|" as BinaryOp)
            .desc("'or'"),

    // A date which can be YYYY-MM[-DDTHH:mm:ss].
    rootDate: (_) =>
        P.seqMap(P.regexp(/\d{4}/), P.string("-"), P.regexp(/\d{2}/), (year, _, month) => {
            return DateTime.fromObject({ year: Number.parseInt(year), month: Number.parseInt(month) });
        }).desc("date in format YYYY-MM[-DDTHH-MM-SS.MS]"),
    dateShorthand: (_) =>
        P.alt(
            ...Object.keys(DATE_SHORTHANDS)
                .sort((a, b) => b.length - a.length)
                .map(P.string)
        ) as P.Parser<keyof typeof DATE_SHORTHANDS>,
    date: (q) =>
        chainOpt<DateTime>(
            q.rootDate,
            (ym: DateTime) =>
                P.seqMap(P.string("-"), P.regexp(/\d{2}/), (_, day) => ym.set({ day: Number.parseInt(day) })),
            (ymd: DateTime) =>
                P.seqMap(P.string("T"), P.regexp(/\d{2}/), (_, hour) => ymd.set({ hour: Number.parseInt(hour) })),
            (ymdh: DateTime) =>
                P.seqMap(P.string(":"), P.regexp(/\d{2}/), (_, minute) =>
                    ymdh.set({ minute: Number.parseInt(minute) })
                ),
            (ymdhm: DateTime) =>
                P.seqMap(P.string(":"), P.regexp(/\d{2}/), (_, second) =>
                    ymdhm.set({ second: Number.parseInt(second) })
                ),
            (ymdhms: DateTime) =>
                P.alt(
                    P.seqMap(P.string("."), P.regexp(/\d{3}/), (_, millisecond) =>
                        ymdhms.set({ millisecond: Number.parseInt(millisecond) })
                    ),
                    P.succeed(ymdhms) // pass
                ),
            (dt: DateTime) =>
                P.alt(
                    P.seqMap(P.string("+").or(P.string("-")), P.regexp(/\d{1,2}(:\d{2})?/), (pm, hr) =>
                        dt.setZone("UTC" + pm + hr, { keepLocalTime: true })
                    ),
                    P.seqMap(P.string("Z"), () => dt.setZone("utc", { keepLocalTime: true })),
                    P.seqMap(P.string("["), P.regexp(/[0-9A-Za-z+-\/]+/u), P.string("]"), (_a, zone, _b) =>
                        dt.setZone(zone, { keepLocalTime: true })
                    )
                )
        )
            .assert((dt: DateTime) => dt.isValid, "valid date")
            .desc("date in format YYYY-MM[-DDTHH-MM-SS.MS]"),

    // A date, plus various shorthand times of day it could be.
    datePlus: (q) =>
        P.alt<DateTime>(
            q.dateShorthand.map((d) => DATE_SHORTHANDS[d]()),
            q.date
        ).desc("date in format YYYY-MM[-DDTHH-MM-SS.MS] or in shorthand"),

    // A duration of time.
    durationType: (_) =>
        P.alt(
            ...Object.keys(DURATION_TYPES)
                .sort((a, b) => b.length - a.length)
                .map(P.string)
        ) as P.Parser<keyof typeof DURATION_TYPES>,
    duration: (q) =>
        P.seqMap(q.number, P.optWhitespace, q.durationType, (count, _, t) =>
            DURATION_TYPES[t].mapUnits((x) => x * count)
        )
            .sepBy1(P.string(",").trim(P.optWhitespace).or(P.optWhitespace))
            .map((durations) => durations.reduce((p, c) => p.plus(c)))
            .desc("duration like 4hr2min"),

    // A raw null value.
    rawNull: (_) => P.string("null"),
});

/** Emoji regex, strpping any regex flags it has. */
const EMOJI_REGEX = new RegExp(emojiRegex(), "");

/** Provides a lookup table for unit durations of the given type. */
export const DURATION_TYPES = {
    year: Duration.fromObject({ years: 1 }),
    years: Duration.fromObject({ years: 1 }),
    yr: Duration.fromObject({ years: 1 }),
    yrs: Duration.fromObject({ years: 1 }),

    month: Duration.fromObject({ months: 1 }),
    months: Duration.fromObject({ months: 1 }),
    mo: Duration.fromObject({ months: 1 }),
    mos: Duration.fromObject({ months: 1 }),

    week: Duration.fromObject({ weeks: 1 }),
    weeks: Duration.fromObject({ weeks: 1 }),
    wk: Duration.fromObject({ weeks: 1 }),
    wks: Duration.fromObject({ weeks: 1 }),
    w: Duration.fromObject({ weeks: 1 }),

    day: Duration.fromObject({ days: 1 }),
    days: Duration.fromObject({ days: 1 }),
    d: Duration.fromObject({ days: 1 }),

    hour: Duration.fromObject({ hours: 1 }),
    hours: Duration.fromObject({ hours: 1 }),
    hr: Duration.fromObject({ hours: 1 }),
    hrs: Duration.fromObject({ hours: 1 }),
    h: Duration.fromObject({ hours: 1 }),

    minute: Duration.fromObject({ minutes: 1 }),
    minutes: Duration.fromObject({ minutes: 1 }),
    min: Duration.fromObject({ minutes: 1 }),
    mins: Duration.fromObject({ minutes: 1 }),
    m: Duration.fromObject({ minutes: 1 }),

    second: Duration.fromObject({ seconds: 1 }),
    seconds: Duration.fromObject({ seconds: 1 }),
    sec: Duration.fromObject({ seconds: 1 }),
    secs: Duration.fromObject({ seconds: 1 }),
    s: Duration.fromObject({ seconds: 1 }),
};

/** Shorthand for common dates (relative to right now). */
export const DATE_SHORTHANDS = {
    now: () => DateTime.local(),
    today: () => DateTime.local().startOf("day"),
    yesterday: () =>
        DateTime.local()
            .startOf("day")
            .minus(Duration.fromObject({ days: 1 })),
    tomorrow: () =>
        DateTime.local()
            .startOf("day")
            .plus(Duration.fromObject({ days: 1 })),
    sow: () => DateTime.local().startOf("week"),
    "start-of-week": () => DateTime.local().startOf("week"),
    eow: () => DateTime.local().endOf("week"),
    "end-of-week": () => DateTime.local().endOf("week"),
    soy: () => DateTime.local().startOf("year"),
    "start-of-year": () => DateTime.local().startOf("year"),
    eoy: () => DateTime.local().endOf("year"),
    "end-of-year": () => DateTime.local().endOf("year"),
    som: () => DateTime.local().startOf("month"),
    "start-of-month": () => DateTime.local().startOf("month"),
    eom: () => DateTime.local().endOf("month"),
    "end-of-month": () => DateTime.local().endOf("month"),
};

////////////////////
// Query Language //
////////////////////

/** Supported types in the grammar for index queries. */
export interface QueryLanguage {
    queryTag: IndexTagged;
    queryId: IndexId;
    queryType: IndexTyped;
    queryPath: IndexPath;
    queryParentOf: IndexParentOf;
    queryChildOf: IndexChildOf;
    querySimpleLinked: IndexLinked;
    queryLinked: IndexLinked;
    queryNegate: IndexNot;
    queryParens: IndexQuery;
    queryAtom: IndexQuery;
    queryAnds: IndexQuery;
    queryOrs: IndexQuery;
    query: IndexQuery;
}

/**
 * Parser for the query language. Did I really need a query language instead of just a better UI? Probably not.
 * But query languages are fun for the whole family and at some point you get so used to writing them that
 * you don't stop to think if you *need* to write them anymore. It's good typing practice for everyone.
 */
export const QUERY = P.createLanguage<QueryLanguage>({
    queryTag: (_) => PRIMITIVES.tag.map((value) => ({ type: "tagged", value })),
    queryId: (_) => createFunction("id", PRIMITIVES.string).map(([_, id]) => ({ type: "id", value: id })),
    queryType: (_) =>
        P.string("@")
            .then(PRIMITIVES.identifier)
            .map((value) => ({ type: "typed", value: value })),

    queryPath: (_) =>
        createFunction(P.regexp(/e?path/i).desc("[e]path"), PRIMITIVES.string).map(([func, path]) => ({
            type: "path",
            value: path,
            exact: func.toLowerCase() === "epath",
        })),

    queryParentOf: (q) =>
        createFunction(P.regexp(/parentof|supertree/i).desc("parentof"), q.query).map(([func, children]) => ({
            type: "parent-of",
            children,
            inclusive: func.toLowerCase() === "supertree",
        })),
    queryChildOf: (q) =>
        createFunction(P.regexp(/childof|subtree/i).desc("childof"), q.query).map(([func, parents]) => ({
            type: "child-of",
            parents,
            inclusive: func.toLowerCase() === "subtree",
        })),
    querySimpleLinked: (_) => PRIMITIVES.link.map(link => ({ type: "linked", source: { type: "link", value: link }, direction: "incoming" })),
    queryLinked: (q) =>
        createFunction(P.regexp(/linksto|linkedfrom|connected/i).desc("connected"), q.query).map(([func, source]) => ({
            type: "linked",
            source,
            direction: func.toLowerCase() == "linksto" ? "incoming" : (func.toLowerCase() == "linkedfrom" ? "outgoing" : "both")
        })),

    queryParens: (q) => q.query.trim(P.optWhitespace).wrap(P.string("("), P.string(")")),
    queryNegate: (q) =>
        P.string("!")
            .skip(P.optWhitespace)
            .then(q.queryAtom)
            .map((value) => ({
                type: "not",
                element: value,
            })),
    queryAtom: (q) =>
        P.alt<IndexQuery>(
            q.queryParens,
            q.queryNegate,
            q.querySimpleLinked,
            q.queryTag,
            q.queryType,
            q.queryId,
            q.queryChildOf,
            q.queryParentOf,
            q.queryLinked,
            q.queryPath
        ),
    queryAnds: (q) =>
        createBinaryParser(q.queryAtom, PRIMITIVES.binaryAndOp, (left, _op, right) => ({
            type: "and",
            elements: [left, right],
        })),
    queryOrs: (q) =>
        createBinaryParser(q.queryAnds, PRIMITIVES.binaryOrOp, (left, _op, right) => ({
            type: "or",
            elements: [left, right],
        })),
    query: (q) => q.queryOrs.trim(P.optWhitespace),
});

/** Return a new parser which executes the underlying parser and returns it's raw string representation. */
export function captureRaw<T>(base: P.Parser<T>): P.Parser<[T, string]> {
    return P.custom((_success, _failure) => {
        return (input, i) => {
            let result = (base as any)._(input, i);
            if (!result.status) return result;

            return Object.assign({}, result, { value: [result.value, input.substring(i, result.index)] });
        };
    });
}

/** Create a left-associative binary parser which parses the given sub-element and separator. Handles whitespace. */
export function createBinaryParser<T, U>(
    child: P.Parser<T>,
    sep: P.Parser<U>,
    combine: (a: T, b: U, c: T) => T
): P.Parser<T> {
    return P.seqMap(child, P.seq(P.optWhitespace, sep, P.optWhitespace, child).many(), (first, rest) => {
        if (rest.length == 0) return first;

        let node = combine(first, rest[0][1], rest[0][3]);
        for (let index = 1; index < rest.length; index++) {
            node = combine(node, rest[index][1], rest[index][3]);
        }
        return node;
    });
}

/** Create a parser which parses <function>(<args>). */
export function createFunction<T>(func: string | P.Parser<string>, args: P.Parser<T>): P.Parser<[string, T]> {
    const realFunc = typeof func === "string" ? P.string(func) : func;
    return P.seqMap(
        realFunc.skip(P.optWhitespace),
        args.trim(P.optWhitespace).wrap(P.string("("), P.string(")")),
        (f, a) => [f, a]
    );
}

export function chainOpt<T>(base: P.Parser<T>, ...funcs: ((r: T) => P.Parser<T>)[]): P.Parser<T> {
    return P.custom((_success, _failure) => {
        return (input, i) => {
            let result = (base as any)._(input, i);
            if (!result.status) return result;

            for (let func of funcs) {
                let next = (func(result.value as T) as any)._(input, result.index);
                if (!next.status) return result;

                result = next;
            }

            return result;
        };
    });
}
