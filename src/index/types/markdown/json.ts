//! Note: These are "serialization" types for datacore metadata, which contain
// the absolute minimum information needed to save and load datacore data.

import { Field } from "expression/field";
import { Link, Literal } from "expression/literal";
import { InlineField } from "index/import/inline-field";

/** An entry in the frontmatter; includes the raw value, parsed value, and raw key (before lower-casing). */
export interface FrontmatterEntry {
    /** The actual string in frontmatter with exact casing. */
    key: string;
    /** The parsed value of the frontmatter entry (date, duration, etc.). */
    value: Literal;
    /** The raw value of the frontmatter entry before parsing; generally a string or number. */
    raw: string;
}

/** A span of contiguous lines. */
export interface LineSpan {
    /** The inclusive start line. */
    start: number;
    /** The inclusive end line. */
    end: number;
}

/** Stores just the minimal information needed to create a markdown file; used for saving and loading these files. */
export interface JsonMarkdownPage {
    /** Frontmatter values in the file, if present. Maps lower case frontmatter key -> entry. */
    $frontmatter?: Record<string, FrontmatterEntry>;
    /** Map of all distinct inline fields in the document. Maps lower case key name -> full metadata. */
    $infields: Record<string, InlineField>;

    /** The path this file exists at. */
    $path: string;
    /** Obsidian-provided date this page was created. */
    $ctime: number;
    /** Obsidian-provided date this page was modified. */
    $mtime: number;
    /** The extension; for markdown files, almost always '.md'. */
    $extension: string;
    /** Obsidian-provided size of this page in bytes. */
    $size: number;
    /** The full extent of the file (start 0, end the number of lines in the file.) */
    $position: LineSpan;
    /** The exact tags in the file. */
    $tags: string[];
    /** All links in the file. */
    $links: Link[];
    /**
     * All child markdown sections of this markdown file. The initial section before any content is special and is
     * named with the title of the file.
     */
    $sections: JsonMarkdownSection[];
}

export interface JsonMarkdownSection {
    /** The index of this section in the file. */
    $ordinal: number;
    /** The title of the section; the root (implicit) section will have the title of the page. */
    $title: string;
    /** The indentation level of the section (1 - 6). */
    $level: number;
    /** The span of lines indicating the position of the section. */
    $position: LineSpan;
    /** All tags on the file. */
    $tags: string[];
    /** All links in the file. */
    $links: Link[];
    /** All of the markdown blocks in this section. */
    $blocks: JsonMarkdownBlock[];
    /** Map of all distinct inline fields in the document, from key name -> metadata. */
    $infields: Record<string, InlineField>;
}

export interface JsonMarkdownBlock {
    /** The index of this block in the file. */
    $ordinal: number;
    /** The position/extent of the block. */
    $position: LineSpan;
    /** All tags on the block. */
    $tags: string[];
    /** All links in the file. */
    $links: Link[];
    /** Map of all distinct inline fields in the document, from key name -> metadata. */
    $infields: Record<string, InlineField>;
    /** If present, the distinct block ID for this block. */
    $blockId?: string;
    /** The type of block - paragraph, list, and so on. */
    $type: string;
}

export interface JsonMarkdownListBlock extends JsonMarkdownBlock {
    /** The list items inside of this block. */
    $elements: JsonMarkdownListItem[];

    $type: "list";
}

export interface JsonMarkdownListItem {
    /** The position of the list item in the file. */
    $position: LineSpan;
    /** Child elements of this list item. */
    $elements: JsonMarkdownListItem[];
    /** The type of list item that this element is. */
    $type: string;
    /** Exact tags on this list item. */
    $tags: string[];
    /** Map of all distinct inline fields in the document, from key name -> metadata. */
    $infields: Record<string, InlineField>;
    /** All links in the file. */
    $links: Link[];
    /** The block ID of this list item if present. */
    $blockId?: string;
    /**
     * The line number of the parent of this list item.
     * If a positive number, then this list element is a child
     * of the list element at that line.
     *
     * If a negative number, then this list element is a root element
     * of a list starting at that line (negated). I.e., -7 means
     * this is a root element of the list starting at line 7.
     */
    $parentLine: number;
}

export interface JsonMarkdownTaskItem extends JsonMarkdownListItem {
    $type: "task";

    /** The text inside of the task item. */
    $status: string;
}


export interface JsonMarkdownYamlObject extends JsonMarkdownBlock {
    $type: "yaml-data";
    /** top level fields in the YAML object */
    $fields: Field[];
}