/** Parse inline fields and other embedded metadata in a line. */

import { PRIMITIVES } from "expression/parser";
import { Literal } from "expression/literal";
import * as P from "parsimmon";
import emojiRegex from "emoji-regex";
import { JsonConversion, JsonLiteral } from "index/types/json/common";

/** A parsed inline field from a specific line. */
export interface LocalInlineField {
    /** The raw parsed key. */
    key: string;
    /** The raw value of the field. */
    value: string;
    /** The start column of the field. */
    start: number;
    /** The start column of the *value* for the field. */
    startValue: number;
    /** The end column of the field. */
    end: number;
    /** If this inline field was defined via a wrapping ('[' or '(' or 'link'), then the wrapping that was used. */
    wrapping?: string;
}

/** Full inline field metadata for an object. */
export interface InlineField {
    /** The actual key describing the inline field. */
    key: string;
    /** The raw value of the inline field. */
    raw: string;
    /** The parsed value. */
    value: Literal;
    /** Full position information for where the inline field is located in the document. */
    position: {
        /** The line number the inline field appears on. */
        line: number;
        /** The start column of the field. */
        start: number;
        /** The start column of the *value* for the field. Immediately after the '::'. */
        startValue: number;
        /** The end column of the field. */
        end: number;
    };
    /** If this inline field was defined via a wrapping ('[' or '(' or 'link'), then the wrapping that was used. */
    wrapping?: string;
}

/** JSON, serializable representation of an inline field. */
export interface JsonInlineField {
    /** The actual key describing the inline field. */
    key: string;
    /** The raw value of the inline field. */
    raw: string;
    /** The parsed value. */
    value: JsonLiteral;
    /** Full position information for where the inline field is located in the document. */
    position: {
        /** The line number the inline field appears on. */
        line: number;
        /** The start column of the field. */
        start: number;
        /** The start column of the *value* for the field. Immediately after the '::'. */
        startValue: number;
        /** The end column of the field. */
        end: number;
    };
    /** If this inline field was defined via a wrapping ('[' or '(' or 'link'), then the wrapping that was used. */
    wrapping?: string;
}

/** Convert an inline field to a JSON format. */
export function jsonInlineField(field: InlineField): JsonInlineField {
    return Object.assign({}, field, { value: JsonConversion.json(field.value) });
}

/** Convert a JSON inline field back to a regular field. */
export function valueInlineField(field: JsonInlineField): InlineField {
    return Object.assign({}, field, { value: JsonConversion.value(field.value) });
}

export function asInlineField(local: LocalInlineField, lineno: number): InlineField;
export function asInlineField(local: LocalInlineField[], lineno: number): InlineField[];
/** Convert a local inline field into a full inline field by performing parsing and adding the correct line number. */
export function asInlineField(
    local: LocalInlineField | LocalInlineField[],
    lineno: number
): InlineField | InlineField[] {
    if (Array.isArray(local)) {
        return local.map((f) => asInlineField(f, lineno));
    }

    return {
        key: local.key,
        raw: local.value,
        value: parseInlineValue(local.value),
        position: {
            line: lineno,
            start: local.start,
            startValue: local.startValue,
            end: local.end,
        },
        wrapping: local.wrapping,
    };
}

/** The wrapper characters that can be used to define an inline field. */
export const INLINE_FIELD_WRAPPERS: Readonly<Record<string, string>> = Object.freeze({
    "[": "]",
    "(": ")",
});

/**
 * Find a matching closing bracket that occurs at or after `start`, respecting nesting and escapes. If found,
 * returns the value contained within and the string index after the end of the value.
 */
function findClosing(
    line: string,
    start: number,
    open: string,
    close: string
): { value: string; endIndex: number } | undefined {
    let nesting = 0;
    let escaped = false;
    for (let index = start; index < line.length; index++) {
        let char = line.charAt(index);

        // Allows for double escapes like '\\' to be rendered normally.
        if (char == "\\") {
            escaped = !escaped;
            continue;
        }

        // If escaped, ignore the next character for computing nesting, regardless of what it is.
        if (escaped) {
            escaped = false;
            continue;
        }

        if (char == open) nesting++;
        else if (char == close) nesting--;

        // Only occurs if we are on a close character and trhere is no more nesting.
        if (nesting < 0) return { value: line.substring(start, index).trim(), endIndex: index + 1 };

        escaped = false;
    }

    return undefined;
}

/** Find the '::' separator in an inline field. */
function findSeparator(line: string, start: number): { key: string; valueIndex: number } | undefined {
    let sep = line.indexOf("::", start);
    if (sep < 0) return undefined;

    return { key: line.substring(start, sep).trim(), valueIndex: sep + 2 };
}

/** Try to completely parse an inline field starting at the given position. Assumes `start` is on a wrapping character. */
function findSpecificInlineField(line: string, start: number): LocalInlineField | undefined {
    let open = line.charAt(start);

    let key = findSeparator(line, start + 1);
    if (key === undefined) return undefined;

    // Fail the match if we find any separator characters (not allowed in keys).
    for (let sep of Object.keys(INLINE_FIELD_WRAPPERS).concat(Object.values(INLINE_FIELD_WRAPPERS))) {
        if (key.key.includes(sep)) return undefined;
    }

    let value = findClosing(line, key.valueIndex, open, INLINE_FIELD_WRAPPERS[open]);
    if (value === undefined) return undefined;

    return {
        key: key.key,
        value: value.value,
        start: start,
        startValue: key.valueIndex,
        end: value.endIndex,
        wrapping: open,
    };
}

/** Parse a textual inline field value into something we can work with. */
export function parseInlineValue(value: string): Literal {
    // Empty inline values (i.e., no text) should map to null to match long-term Dataview semantics.
    // Null is also a more universal type to deal with than strings, since all functions accept nulls.
    if (value.trim() == "") return null;

    // The stripped literal field parser understands all of the non-array/non-object fields and can parse them for us.
    // Inline field objects are not currently supported; inline array objects have to be handled by the parser
    // separately.
    let inline = PRIMITIVES.inlineField.parse(value);
    if (inline.status) return inline.value;
    else return value;
}

/** Extracts inline fields of the form '[key:: value]' from a line of text. This is done in a relatively
 * "robust" way to avoid failing due to bad nesting or other interfering Markdown symbols:
 *
 * - Look for any wrappers ('[' and '(') in the line, trying to parse whatever comes after it as an inline key::.
 * - If successful, scan until you find a matching end bracket, and parse whatever remains as an inline value.
 */
export function extractInlineFields(line: string, includeTaskFields: boolean = false): LocalInlineField[] {
    let fields: LocalInlineField[] = [];
    for (let wrapper of Object.keys(INLINE_FIELD_WRAPPERS)) {
        let foundIndex = line.indexOf(wrapper);
        while (foundIndex >= 0) {
            let parsedField = findSpecificInlineField(line, foundIndex);
            if (!parsedField) {
                foundIndex = line.indexOf(wrapper, foundIndex + 1);
                continue;
            }

            fields.push(parsedField);
            foundIndex = line.indexOf(wrapper, parsedField.end);
        }
    }

    if (includeTaskFields) fields = fields.concat(extractSpecialTaskFields(line));

    fields.sort((a, b) => a.start - b.start);

    let filteredFields: LocalInlineField[] = [];
    for (let i = 0; i < fields.length; i++) {
        if (i == 0 || filteredFields[filteredFields.length - 1].end < fields[i].start) {
            filteredFields.push(fields[i]);
        }
    }
    return filteredFields;
}

/** Validates that a raw field name has a valid form. */
const FULL_LINE_KEY_PART: P.Parser<string> = P.alt(
    P.regexp(new RegExp(emojiRegex(), "u")),
    P.regexp(/[0-9\p{Letter}\w\s_/-]+/u)
)
    .many()
    .map((parts) => parts.join(""));

const FULL_LINE_KEY_PARSER: P.Parser<string> = P.regexp(/[^0-9\w\p{Letter}]*/u)
    .then(FULL_LINE_KEY_PART)
    .skip(P.regexp(/[_\*~`]*/u));

/** Attempt to extract a full-line field (Key:: Value consuming the entire content line). */
export function extractFullLineField(text: string): LocalInlineField | undefined {
    let sep = findSeparator(text, 0);
    if (!sep) return undefined;

    // We need to post-process the key to drop unnecessary opening annotations as well as
    // drop surrounding Markdown.
    let realKey = FULL_LINE_KEY_PARSER.parse(sep.key);
    if (!realKey.status) return undefined;

    return {
        key: realKey.value,
        value: text.substring(sep.valueIndex).trim(),
        start: 0,
        startValue: sep.valueIndex,
        end: text.length,
    };
}

export const CREATED_DATE_REGEX = /\u{2795}\s*(\d{4}-\d{2}-\d{2})/u;
export const DUE_DATE_REGEX = /(?:\u{1F4C5}|\u{1F4C6}|\u{1F5D3}\u{FE0F}?)\s*(\d{4}-\d{2}-\d{2})/u;
export const DONE_DATE_REGEX = /\u{2705}\s*(\d{4}-\d{2}-\d{2})/u;
export const SCHEDULED_DATE_REGEX = /[\u{23F3}\u{231B}]\s*(\d{4}-\d{2}-\d{2})/u;
export const START_DATE_REGEX = /\u{1F6EB}\s*(\d{4}-\d{2}-\d{2})/u;

export const EMOJI_REGEXES = [
    { regex: CREATED_DATE_REGEX, key: "created" },
    { regex: START_DATE_REGEX, key: "start" },
    { regex: SCHEDULED_DATE_REGEX, key: "scheduled" },
    { regex: DUE_DATE_REGEX, key: "due" },
    { regex: DONE_DATE_REGEX, key: "completion" },
];

/** Parse special completed/due/done task fields which are marked via emoji. */
function extractSpecialTaskFields(line: string): LocalInlineField[] {
    let results: LocalInlineField[] = [];

    for (let { regex, key } of EMOJI_REGEXES) {
        const match = regex.exec(line);
        if (!match) continue;

        results.push({
            key,
            value: match[1],
            start: match.index,
            startValue: match.index + 1,
            end: match.index + match[0].length,
            wrapping: "emoji-shorthand",
        });
    }

    return results;
}

/** Sets or replaces the value of an inline field; if the value is 'undefined', deletes the key. */
export function setInlineField(source: string, key: string, value?: string): string {
    let existing = extractInlineFields(source);
    let existingKeys = existing.filter((f) => f.key == key);

    // Don't do anything if there are duplicate keys OR the key already doesn't exist.
    if (existingKeys.length > 2 || (existingKeys.length == 0 && !value)) return source;
    let existingKey = existingKeys[0];

    let annotation = value ? `[${key}:: ${value}]` : "";
    if (existingKey) {
        let prefix = source.substring(0, existingKey.start);
        let suffix = source.substring(existingKey.end);

        if (annotation) return `${prefix}${annotation}${suffix}`;
        else return `${prefix}${suffix.trimStart()}`;
    } else if (annotation) {
        return `${source.trimEnd()} ${annotation}`;
    }

    return source;
}

export function setEmojiShorthandCompletionField(source: string, value?: string): string {
    const existing = extractInlineFields(source, true);
    const existingKeys = existing.filter((f) => f.key === "completion" && f.wrapping === "emoji-shorthand");

    // Don't do anything if there are duplicate keys OR the key already doesn't exist.
    if (existingKeys.length > 2 || (existingKeys.length == 0 && !value)) return source;

    /* No wrapper, add own spacing at start */
    const annotation = value ? ` ✅ ${value}` : "";
    let existingKey = existingKeys[0];
    if (existingKey) {
        const prefix = source.substring(0, existingKey.start);
        const suffix = source.substring(existingKey.end);
        return `${prefix.trimEnd()}${annotation}${suffix}`;
    } else {
        return `${source.trimEnd()}${annotation}`;
    }
}
