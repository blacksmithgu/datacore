import { Link } from "expression/literal";
import { extractSubtags } from "expression/normalize";
import { File } from "index/types/file";
import { Indexable } from "index/types/indexable";
import { DateTime } from "luxon";

/** A markdown file in the vault; the source of most metadata. */
export class MarkdownFile implements File, Indexable {
    /** All of the types that a markdown file is. */
    static TYPES = ["file", "file/markdown", "markdown", "markdown/page"];

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
    /** The extension; for markdown files, almost always '.md'. */
    extension: string;
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
        file.sections = (file.sections ?? []).map(MarkdownSection.from);

        return file;
    }

    public constructor(init: Partial<MarkdownFile>) {
        Object.assign(this, init);

        this.tags = new Set(Array.from(this.etags).flatMap((t) => extractSubtags(t)));
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
    /** The exact set of tags in the file. */
    etags: Set<string>;
    /** All tags (both direct and indirectly) on the file. */
    tags: Set<string>;
    /** All of the markdown blocks in this section. */
    blocks: MarkdownBlock[];

    /** Convert raw markdown section data to the appropriate class. */
    static from(raw: Partial<MarkdownSection>): MarkdownSection {
        const section = new MarkdownSection((raw as any).$file, raw);
        section.blocks = (section.blocks ?? []).map(MarkdownBlock.from);

        return section;
    }

    public constructor(file: string, init: Partial<MarkdownSection>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownSection.readableId(file, this.title, this.ordinal);

        this.tags = new Set(Array.from(this.etags).flatMap((t) => extractSubtags(t)));
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

        return `${file}/section${ordinal}/${first8}`;
    }
}

/** Base class for all markdown blocks. */
export class MarkdownBlock implements Indexable {
    /** All of the types of this markdown block. */
    static TYPES = ["markdown", "block"];

    /** Path of the file that this block is in. */
    $file: string;

    $types: string[] = MarkdownBlock.TYPES;
    $id: string;

    /** The index of this block in the file. */
    ordinal: number;
    /** The position/extent of the block. */
    position: LineSpan;
    /** The exact set of tags in the block. */
    etags: Set<string>;
    /** All tags (both direct and indirectly) on the block. */
    tags: Set<string>;
    /** If present, the distinct block ID for this block. */
    blockId?: string;
    /** The type of block - paragraph, list, and so on. */
    type: string;

    static from(object: Partial<MarkdownBlock>): MarkdownBlock {
        if (object.type === "list") {
            return new MarkdownListBlock(object.$file!, object as Partial<MarkdownListBlock>);
        } else {
            return new MarkdownBlock(object.$file!, object);
        }
    }

    public constructor(file: string, init: Partial<MarkdownBlock>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownBlock.readableId(file, this.ordinal);

        this.tags = new Set(Array.from(this.etags).flatMap((t) => extractSubtags(t)));
    }

    /** Generate a readable ID for this block using the ordinal of the block. */
    static readableId(file: string, ordinal: number): string {
        return `${file}/block${ordinal}`;
    }
}

/** Special block for markdown lists (of either plain list entries or tasks). */
export class MarkdownListBlock extends MarkdownBlock {
    static TYPES = ["markdown", "block", "block-list"];

    $types: string[] = MarkdownListBlock.TYPES;

    /** The list items inside of this block. */
    elements: MarkdownListItem[];
    type: "list";

    /** Create a list block from a serialized value. */
    static from(object: Partial<MarkdownListBlock>): MarkdownListBlock {
        const result = new MarkdownListBlock(object.$file!, object);
        result.elements = (result.elements || []).map(MarkdownListItem.from);

        return result;
    }

    public constructor(file: string, init: Partial<MarkdownListBlock>) {
        super(file, init);

        this.type = "list";
    }
}

/** A specific list item in a list. */
export class MarkdownListItem {
    static TYPES = ["markdown", "list-item"];

    $file: string;

    $types: string[] = MarkdownListItem.TYPES;
    $id: string;

    /** The position of the list item in the file. */
    position: LineSpan;
    /** Child elements of this list item. */
    elements: MarkdownListItem[];
    /** The type of list item that this element is. */
    type: string;
    /** The exact set of tags on this list item. */
    etags: Set<string>;
    /** Exact and derived tags on this list item. */
    tags: Set<string>;
    /** The block ID of this list item if present. */
    blockId?: string;
    /**
     * The line number of the parent of this list item.
     * If a positive number, then this list element is a child
     * of the list element at that line.
     *
     * If a negative number, then this list element is a root element
     * of a list starting at that line (negated). I.e., -7 means
     * this is a root element of the list starting at line 7.
     */
    parentLine: number;

    /** Create a list item from a serialized object. */
    static from(object: Partial<MarkdownListItem>): MarkdownListItem {
        let result: MarkdownListItem;
        if (object.type === "task") result = new MarkdownTaskItem(object.$file!, object);
        else result = new MarkdownListItem(object.$file!, object);

        result.elements = (result.elements || []).map(MarkdownListItem.from);
        return result;
    }

    public constructor(file: string, init: Partial<MarkdownListItem>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownListItem.readableId(file, this.position.start);
        this.type = "list-item";

        this.tags = new Set(Array.from(this.etags).flatMap((t) => extractSubtags(t)));
    }

    /** Get the line that this list item starts on. */
    get line(): number {
        return this.position.start;
    }

    /** Generate a readable ID for this item using the line number. */
    static readableId(file: string, line: number): string {
        return `${file}/list${line}`;
    }
}

/** A specific task inside of a markdown list. */
export class MarkdownTaskItem extends MarkdownListItem implements Indexable {
    static TYPES = ["markdown", "list-item", "task"];

    $types: string[] = MarkdownTaskItem.TYPES;

    /** The text inside of the task item. */
    status: string;

    public constructor(file: string, init: Partial<MarkdownTaskItem>) {
        super(file, init);

        this.type = "task";
    }

    /** Determine if the given task is completed. */
    public get completed() {
        return this.status === "x" || this.status === "X";
    }
}

/** A span of contiguous lines. */
export interface LineSpan {
    /** The inclusive start line. */
    start: number;
    /** The inclusive end line. */
    end: number;
}
