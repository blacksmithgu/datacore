import { Literal } from "expression/literal";
import { DateTime } from "luxon";

/** General metadata for any file. */
export interface File {
    /** The path this file exists at. */
    path: string;
    /** Obsidian-provided date this page was created. */
    ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    size: number;
}

/** A span of lines inside of a document. */
export interface LineSpan {
    /** The inclusive start line. */
    start: number;
    /** The exclusive end line. */
    end: number;
}

/** A span of characters inside of a document. */
export interface CharacterSpan {
    /** The line this character occurs on. */
    line: number;

    /** The inclusive start character offset. */
    start: number;
    /** The exclusive end character offset. */
    end: number;
}

/** A markdown file. */
export interface MarkdownFile extends File {
    /** Frontmatter values in the file, if present. */
    frontmatter?: Record<string, any>;
    /** All inline fields present, and their values. */
    inlineFields: MarkdownInlineField[];
    /** All markdown objects present. */
    objects: MarkdownObject[];
}

/** A markdown section. */
export interface MarkdownSection {
    /** The title of the section; the root (implicit) section will have the title of the page. */
    title: string;
    /** All inline fields present, and their values. */
    inlineFields: MarkdownInlineField[];
    /** All markdown objects present. */
    objects: MarkdownObject[];
}

/** An inline YAML object. */
export interface MarkdownObject {
    /** The full position (including opening/closing codeblock glyphs) of the object. */
    position: LineSpan;
    /** The recorded type of the object. */
    type: string;
}

/** A (deprecated) inline field in a file. */
export interface MarkdownInlineField {
    /** The raw, un-cleaned key for the inline field. */
    rawKey: string;
    /** The cleaned key for this inline field (with all markup removed and casing normalized.) */
    key: string;
    /** The textual value of the inline field before parsing. */
    rawValue: string;
    /** The full value of the inline field. */
    value: Literal;
    /** The character position of the inline field. */
    position: CharacterSpan;
    /** The character position of just the value of the inline field. */
    valuePosition: CharacterSpan;
    /** How the inline field is delimited. */
    wrapping: '[' | '(' | 'line';
}