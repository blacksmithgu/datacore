import { Link } from "expression/literal";
import { extractSubtags } from "expression/normalize";
import { Indexable } from "index/types/indexable";
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

/** A markdown file in the vault; the source of most metadata. */
export class MarkdownFile implements File, Indexable {
    /** All of the types that a markdown file is. */
    static TYPES = ["file", "page", "markdown"];

    // Use static types for all markdown files.
    $types: string[] = MarkdownFile.TYPES;
    // Markdown file IDs are always just the full path.
    get $id() {
        return this.path;
    }

    /** Frontmatter values in the file, if present. */
    frontmatter?: Record<string, any>;
    /** The path this file exists at. */
    path: string;
    /** Obsidian-provided date this page was created. */
    ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    size: number = 0;
    /** The full extent of the file (start 0, end the number of lines in the file.) */
    position: LineSpan;
    /** The exact set of tags in the file. */
    etags: Set<string>;
    /** All tags (both direct and indirectly) on the file. */
    tags: Set<string>;
    /**
     * All child markdown sections of this markdown file. The initial section before any content is special and is
     * named with the title of the file.
     */
    sections: MarkdownSection[] = [];

    /** Create a markdown file from the given raw values. */
    static from(raw: Partial<MarkdownFile>): MarkdownFile {
        const file = new MarkdownFile(raw);
        file.sections = (file.sections ?? []).map((sect) => MarkdownSection.from(sect));

        return file;
    }

    public constructor(init: Partial<MarkdownFile>) {
        Object.assign(this, init);

        if (!this.tags) this.tags = new Set(Array.from(this.etags).flatMap((t) => extractSubtags(t)));
    }

    /** Return the number of lines in the document. */
    get lineCount() {
        return this.position.end;
    }
}

export class MarkdownSection implements Indexable {
    /** All of the types that a markdown section is. */
    static TYPES = ["markdown", "section"];

    /** Path of the file that this section is in. */
    private $file: string;

    $types: string[] = MarkdownSection.TYPES;
    $id: string;

    /** The index of this section in the file. */
    ordinal: number;
    /** The title of the section; the root (implicit) section will have the title of the page. */
    title: string;
    /** The indentation level of the section (1 - 6). */
    level: number;
    /** The span of lines indicating the position of the section. */
    position: LineSpan;
    /** If present, the block ID of this section. */
    blockId?: string;

    /** Convert raw markdown section data to the appropriate class. */
    static from(raw: Partial<MarkdownSection>): MarkdownSection {
        return new MarkdownSection((raw as any).$file, raw);
    }

    public constructor(file: string, init: Partial<MarkdownSection>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownSection.readableId(file, this.title, this.ordinal);
    }

    /** Obtain the number of lines in the section. */
    get lineCount(): number {
        return this.position.end - this.position.start;
    }

    /** Return a link to this section. */
    get link(): Link {
        return Link.header(this.$file, this.title);
    }

    /** Generate a readable ID for this section using the first 8 characters of the string and the ordinal. */
    static readableId(file: string, title: string, ordinal: number): string {
        const first8 = title.substring(0, Math.min(title.length, 8)).replace(/[^A-Za-z0-9-_]+/gi, "-");

        return `${file}/${ordinal}-${first8}`;
    }
}

/** A span of contiguous lines. */
export interface LineSpan {
    /** The inclusive start line. */
    start: number;
    /** The exclusive end line. */
    end: number;
}
