import { DataObject, Link, Literal } from "expression/literal";
import { Indexable } from "index/types/indexable";
import { DateTime } from "luxon";

/** General metadata for any file. */
export interface File extends Indexable {
    /** The path this file exists at. */
    path: string;
    /** Obsidian-provided date this page was created. */
    ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    size: number;
    /** An obsidian link to thie file. */
    link: Link;
}

/** A canvas file, using the Obsidian canvas format. */
export interface CanvasFile extends File {
    /** The number of nodes in the file. */
    nodeCount: number;
    /** The number of edges in the file. */
    edgeCount: number;
}

/** A markdown file. */
export interface MarkdownFile extends File {
    /** Frontmatter values in the file, if present. */
    frontmatter?: Record<string, any>;
    /** All inline fields present, and their values. */
    inlineFields: MarkdownInlineField[];
    /** All markdown codeblocks present; does not include objects, which are stored separately. */
    codeblocks: MarkdownCodeblock[];
    /** All markdown objects present. */
    objects: MarkdownObject[];
    /** All sections present within the markdown file. */
    sections: MarkdownSection[];
    /** All tags and subtags that show up on the page. */
    tags: Set<string>;
    /** The exact set of tags that show up in the page. */
    etags: Set<string>;
}

/** A markdown section. */
export interface MarkdownSection extends Indexable {
    /** The title of the section; the root (implicit) section will have the title of the page. */
    title: string;
    /** An Obsidian link to this section. */
    link: Link;
    /** All inline fields present, and their values. */
    inlineFields: MarkdownInlineField[];
    /** All markdown objects present. */
    objects: MarkdownObject[];
}

/** A markdown block. */
export interface MarkdownBlock extends Indexable {
    /** A block of contiguous markdown data. */
    position: LineSpan;
    /** If present, the block ID of the block. */
    blockId?: string;
}

/** A markdown codeblock. */
export interface MarkdownCodeblock extends MarkdownBlock {
    /** The full position (including opening/closing codeblock glyphs) of the codeblock. */
    position: LineSpan;
    /** The list of languages that the codeblock is in. */
    languages: string[];
    /** How the codeblock was defined (indent or backticks). */
    enclosure: "backticks" | "indent";
}

/** An inline YAML object. */
export interface MarkdownObject extends MarkdownCodeblock {
    /** The recorded types of the object. */
    types: string[];
    /** The parsed contents of the object. */
    contents: DataObject;
}

/** A list element. */
export interface MarkdownListElement extends Indexable {
    /** The starting line of the list that this element belongs to. */
    list: number;
    /** The text in the list element. */
    text: string;
    /** The list symbol being used. */
    symbol: string;
    /** Links inside of the list element. */
    links: Link[];
    /** All tags and subtags in the list element. */
    tags: Set<string>;
    /** The exact set of tags in the list element. */
    etags: Set<string>;
}

/** A list element that is also a task. */
export interface MarkdownTaskElement extends MarkdownListElement {
    /** The text inside of the brackets ('[ ]'). */
    status: string;
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
    wrapping: "[" | "(" | "line";
}

/** A union type over all possible markdown fields, including inline objects, frontmatter, and inline fields. */
export interface MarkdownInlineObjectField {
    type: "inline-object";

    key: string;
}

export type MarkdownField = MarkdownInlineObjectField;

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
