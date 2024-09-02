import { DateTime, Duration } from "luxon";
import * as P from "parsimmon";
import emojiRegex from "emoji-regex";
import { Link } from "expression/link";

/** Test-environment-friendly function which fetches the current system locale. */
export function currentLocale(): string {
    if (typeof window === "undefined") return "en-US";
    return window.navigator.language;
}

// Date/Time Rendering

/** Normalize a duration to all of the proper units. */
export function normalizeDuration(dur: Duration) {
    if (dur === undefined || dur === null) return dur;

    return dur.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds").normalize();
}

/** Strip the time components of a date time object. */
export function stripTime(dt: DateTime): DateTime {
    if (dt === null || dt === undefined) return dt;

    return DateTime.fromObject({
        year: dt.year,
        month: dt.month,
        day: dt.day,
    });
}

/** Try to extract a YYYYMMDD date from a string. */
export function extractDate(str: string): DateTime | undefined {
    let dateMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (!dateMatch) dateMatch = /(\d{4})(\d{2})(\d{2})/.exec(str);
    if (dateMatch) {
        let year = Number.parseInt(dateMatch[1]);
        let month = Number.parseInt(dateMatch[2]);
        let day = Number.parseInt(dateMatch[3]);
        return DateTime.fromObject({ year, month, day });
    }

    return undefined;
}

/** Render a DateTime in a minimal format to save space. */
export function renderMinimalDate(time: DateTime, dateFormat: string, dateTimeFormat: string, locale?: string): string {
    // If there is no relevant time specified, fall back to just rendering the date.
    if (time.second == 0 && time.minute == 0 && time.hour == 0) {
        return time.toLocal().toFormat(dateFormat, { locale });
    }

    return time.toLocal().toFormat(dateTimeFormat, { locale });
}

/** Render a duration in a minimal format to save space. */
export function renderMinimalDuration(dur: Duration): string {
    dur = normalizeDuration(dur);

    // TODO: Luxon does not have multi-lingual/locale-aware duration rendering.
    let result = "";
    if (dur.years) result += `${dur.years} years, `;
    if (dur.months) result += `${dur.months} months, `;
    if (dur.weeks) result += `${dur.weeks} weeks, `;
    if (dur.days) result += `${dur.days} days, `;
    if (dur.hours) result += `${dur.hours} hours, `;
    if (dur.minutes) result += `${dur.minutes} minutes, `;
    if (dur.seconds) result += `${Math.round(dur.seconds)} seconds, `;
    if (dur.milliseconds) result += `${Math.round(dur.milliseconds)} ms, `;

    if (result.endsWith(", ")) result = result.substring(0, result.length - 2);
    return result;
}

// Path utilities.

/** Get the folder containing the given path (i.e., like computing 'path/..'). */
export function getParentFolder(path: string): string {
    return path.split("/").slice(0, -1).join("/");
}

/** Get the file name for the file referenced in the given path, by stripping the parent folders. */
export function getFileName(path: string): string {
    return path.includes("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
}

/** Get the "title" for a file, by stripping other parts of the path as well as the extension. */
export function getFileTitle(path: string): string {
    if (path.includes("/")) path = path.substring(path.lastIndexOf("/") + 1);
    if (path.endsWith(".md")) path = path.substring(0, path.length - 3);
    return path;
}

/** Get the extension of a file from the file path. */
export function getExtension(path: string): string {
    if (!path.includes(".")) return "";
    return path.substring(path.lastIndexOf(".") + 1);
}

// Tag extraction.

/** Parse all subtags out of the given tag. I.e., #hello/i/am would yield [#hello/i/am, #hello/i, #hello]. */
export function extractSubtags(tags: string | Iterable<string>): string[] {
    let result = [];
    for (let tag of typeof tags === "string" ? [tags] : tags) {
        result.push(tag);
        while (tag.includes("/")) {
            tag = tag.substring(0, tag.lastIndexOf("/"));
            result.push(tag);
        }
    }

    return result;
}

/** Split each block and section link into the original link and a corresponding file link. */
export function extractFileLinks(elinks: Link[]): Link[] {
    const result: Link[] = [];
    for (const link of elinks) {
        result.push(link);

        const fileLink = link.toFile();
        if (link.type != "file" && !result.find((existing) => existing.equals(fileLink))) {
            result.push(fileLink);
        }
    }

    return result;
}

// String escaping and canonicalization.

/**
 * Escape regex characters in a string.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions.
 */
export function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HEADER_CANONICALIZER: P.Parser<string> = P.alt(
    P.regex(new RegExp(emojiRegex(), "")),
    P.regex(/[0-9\p{Letter}_-]+/u),
    P.whitespace.map((_) => " "),
    P.any.map((_) => " ")
)
    .many()
    .map((result) => {
        return result.join("").split(/\s+/).join(" ").trim();
    });

/**
 * Normalizes the text in a header to be something that is actually linkable to. This mimics
 * how Obsidian does it's normalization, collapsing repeated spaces and stripping out control characters.
 */
export function normalizeHeaderForLink(header: string): string {
    return HEADER_CANONICALIZER.tryParse(header);
}

// Fast extraction of line ranges from large pieces of text.

/** Update the line range from [start, end) with the given function. */
export function lineReplace(text: string, start: number, end: number, func: (line: string) => string): string {
    const [data, offset] = lineSpan(text, start, end);
    if (!offset) return text;

    return (
        data.substring(0, offset.start) + func(data.substring(offset.start, offset.end)) + data.substring(offset.end)
    );
}

/** Extract the lines in the range [start, end), as well as the actual offsets of the start and end. */
export function lineSpan(
    text: string,
    start: number,
    end: number
): [string, { start: number; end: number } | undefined] {
    start = Math.max(start, 0);
    end = Math.max(end, 0);

    if (start >= end) return ["", undefined];

    // Start by finding the starting line offset.
    const startOffset = skipNewlines(text, 0, start);
    if (startOffset == -1) return ["", undefined];

    const endOffset = skipNewlines(text, startOffset, end - start);
    if (endOffset == -1) return [text.substring(startOffset), { start: startOffset, end: text.length }];
    else return [text.substring(startOffset, endOffset - 1), { start: startOffset, end: endOffset - 1 }];
}

/** Extract the lines in the range [start, end). Start is inclusive, end is exclusive. */
export function lineRange(text: string, start: number, end: number): string {
    return lineSpan(text, start, end)[0];
}

/** Skip {count} total newlines, returning the start of the line {count} lines after the current line. If count is 0, the initial offset is returned. */
export function skipNewlines(text: string, start: number, count: number): number {
    if (count == 0) return start;

    let position = start;
    while (count > 0) {
        position = text.indexOf("\n", position);
        if (position == -1) return -1;

        count--;
        position += 1;
    }

    return position;
}
