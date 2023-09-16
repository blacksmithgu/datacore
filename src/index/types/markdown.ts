import { Link, Literal } from "expression/literal";
import { getFileTitle } from "util/normalize";
import {
    FILE_TYPE,
    File,
    Indexable,
    LINKABLE_TYPE,
    LINKBEARING_TYPE,
    Linkable,
    Linkbearing,
    TAGGABLE_TYPE,
    Taggable,
} from "index/types/indexable";
import { DateTime } from "luxon";
import { Extractors, FIELDBEARING_TYPE, Field, FieldExtractor, Fieldbearing } from "./field";

/** A link normalizer which takes in a raw link and produces a normalized link. */
export type LinkNormalizer = (link: Link) => Link;

/** A markdown file in the vault; the source of most metadata. */
export class MarkdownFile implements File, Linkbearing, Taggable, Indexable, Fieldbearing {
    /** All of the types that a markdown file is. */
    static TYPES = [FILE_TYPE, "markdown", "page", TAGGABLE_TYPE, LINKABLE_TYPE, LINKBEARING_TYPE, FIELDBEARING_TYPE];

    // Use static types for all markdown files.
    $types: string[] = MarkdownFile.TYPES;
    $typename: string = "Page";

    // Markdown file IDs are always just the full path.
    get $id() {
        return this.path;
    }
    // The file of a file is... it's file.
    get $file() {
        return this.path;
    }

    /** Frontmatter values in the file, if present. */
    frontmatter?: Record<string, Literal>;
    /** Raw values in the front matter before any parsing. Restricted to numbers, strings, arrays, objects, and nulls. */
    rawmatter?: Record<string, any>;

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
    /** The exact tags in the file. */
    tags: Set<string>;
    /** All links in the file. */
    links: Link[];
    /**
     * All child markdown sections of this markdown file. The initial section before any content is special and is
     * named with the title of the file.
     */
    sections: MarkdownSection[] = [];

    /** Create a markdown file from the given raw values. */
    static from(raw: Partial<MarkdownFile>, normalizer?: LinkNormalizer): MarkdownFile {
        const file = new MarkdownFile(raw);
        file.sections = (file.sections ?? []).map((section) => MarkdownSection.from(section, normalizer));

        if (normalizer) {
            file.links = file.links.map(normalizer);
        }

        return file;
    }

    public constructor(init: Partial<MarkdownFile>) {
        Object.assign(this, init);
    }

    /** Return the number of lines in the document. */
    get lineCount() {
        return this.position.end;
    }

    /** The name of the file. */
    get name() {
        return getFileTitle(this.path);
    }

    /** A link to this file. */
    get link() {
        return Link.file(this.path);
    }

    /** All of the indexed fields in this object. */
    get fields(): Field[] {
        return MarkdownFile.FIELD_DEF(this);
    }

    public field(key: string): Field | undefined {
        return MarkdownFile.FIELD_DEF(this, key)?.[0];
    }

    public value(key: string): Literal | undefined {
        return this.field(key)?.value;
    }

    private static FIELD_DEF: FieldExtractor<MarkdownFile> = Extractors.merge(
        Extractors.intrinsics(),
        Extractors.frontmatter(
            (f) => f.frontmatter,
            (f) => f.rawmatter
        )
    );
}

export class MarkdownSection implements Indexable, Taggable, Linkable, Linkbearing, Fieldbearing {
    /** All of the types that a markdown section is. */
    static TYPES = ["markdown", "section", TAGGABLE_TYPE, LINKABLE_TYPE, LINKBEARING_TYPE, FIELDBEARING_TYPE];

    /** Path of the file that this section is in. */
    $types: string[] = MarkdownSection.TYPES;
    $typename: string = "Section";
    $id: string;
    $file: string;

    /** The index of this section in the file. */
    ordinal: number;
    /** The title of the section; the root (implicit) section will have the title of the page. */
    title: string;
    /** The indentation level of the section (1 - 6). */
    level: number;
    /** The span of lines indicating the position of the section. */
    position: LineSpan;
    /** All tags on the file. */
    tags: Set<string>;
    /** All links in the file. */
    links: Link[];
    /** All of the markdown blocks in this section. */
    blocks: MarkdownBlock[];

    /** Convert raw markdown section data to the appropriate class. */
    static from(raw: Partial<MarkdownSection>, normalizer?: LinkNormalizer): MarkdownSection {
        const section = new MarkdownSection((raw as any).$file, raw);
        section.blocks = (section.blocks ?? []).map((block) => MarkdownBlock.from(block, normalizer));

        if (normalizer) {
            section.links = section.links.map(normalizer);
        }

        return section;
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

    /** Alias for title which allows searching over pages and sections by 'name'. */
    get name(): string {
        return this.title;
    }

    /** Return a link to this section. */
    get link(): Link {
        return Link.header(this.$file, this.title);
    }

    /** All of the indexed fields in this object. */
    get fields(): Field[] {
        return MarkdownSection.FIELD_DEF(this);
    }

    /** Fetch a specific field by key. */
    public field(key: string): Field {
        return MarkdownSection.FIELD_DEF(this, key)?.[0];
    }

    public value(key: string): Literal | undefined {
        return this.field(key)?.value;
    }

    private static FIELD_DEF: FieldExtractor<MarkdownSection> = Extractors.intrinsics();

    /** Generate a readable ID for this section using the first 8 characters of the string and the ordinal. */
    static readableId(file: string, title: string, ordinal: number): string {
        const first8 = title.substring(0, Math.min(title.length, 8)).replace(/[^A-Za-z0-9-_]+/gi, "-");

        return `${file}/section${ordinal}/${first8}`;
    }
}

/** Base class for all markdown blocks. */
export class MarkdownBlock implements Indexable, Linkbearing, Taggable {
    static TYPES = ["markdown", "block", LINKBEARING_TYPE, TAGGABLE_TYPE];

    $types: string[] = MarkdownBlock.TYPES;
    $typename: string = "Block";
    $id: string;
    $file: string;

    /** The index of this block in the file. */
    ordinal: number;
    /** The position/extent of the block. */
    position: LineSpan;
    /** All tags on the block. */
    tags: Set<string>;
    /** All links in the file. */
    links: Link[];
    /** If present, the distinct block ID for this block. */
    blockId?: string;
    /** The type of block - paragraph, list, and so on. */
    type: string;

    static from(object: Partial<MarkdownBlock>, normalizer?: LinkNormalizer): MarkdownBlock {
        let result: MarkdownBlock;
        if (object.type === "list") {
            result = MarkdownListBlock.from(object as Partial<MarkdownListBlock>, normalizer);
        } else {
            result = new MarkdownBlock(object.$file!, object);
        }

        if (normalizer) {
            result.links = result.links.map(normalizer);
        }

        return result;
    }

    public constructor(file: string, init: Partial<MarkdownBlock>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownBlock.readableId(file, this.ordinal);
    }

    /** If this block has a block ID, the link to this block. */
    get link(): Link | undefined {
        if (this.blockId) return Link.block(this.$file, this.blockId);
        else return undefined;
    }

    /** All of the indexed fields in this object. */
    get fields() {
        return MarkdownBlock.FIELD_DEF(this);
    }

    /** Fetch a specific field by key. */
    public field(key: string) {
        return MarkdownBlock.FIELD_DEF(this, key)?.[0];
    }

    public value(key: string): Literal | undefined {
        return this.field(key)?.value;
    }

    private static FIELD_DEF: FieldExtractor<MarkdownBlock> = Extractors.intrinsics();

    /** Generate a readable ID for this block using the ordinal of the block. */
    static readableId(file: string, ordinal: number): string {
        return `${file}/block${ordinal}`;
    }
}

/** Special block for markdown lists (of either plain list entries or tasks). */
export class MarkdownListBlock extends MarkdownBlock implements Taggable, Linkbearing {
    static TYPES = ["markdown", "block", "block-list", TAGGABLE_TYPE, LINKBEARING_TYPE];

    $types: string[] = MarkdownListBlock.TYPES;
    $typename: string = "List Block";

    /** The list items inside of this block. */
    elements: MarkdownListItem[];
    type: "list";

    /** Create a list block from a serialized value. */
    static from(object: Partial<MarkdownListBlock>, normalizer?: LinkNormalizer): MarkdownListBlock {
        const result = new MarkdownListBlock(object.$file!, object);
        result.elements = (result.elements || []).map((elem) => MarkdownListItem.from(elem, normalizer));

        return result;
    }

    public constructor(file: string, init: Partial<MarkdownListBlock>) {
        super(file, init);

        this.type = "list";
    }
}

/** A specific list item in a list. */
export class MarkdownListItem implements Linkbearing, Taggable {
    static TYPES = ["markdown", "list-item", LINKBEARING_TYPE, TAGGABLE_TYPE];

    $types: string[] = MarkdownListItem.TYPES;
    $typename: string = "List Item";
    $id: string;
    $file: string;

    /** The position of the list item in the file. */
    position: LineSpan;
    /** Child elements of this list item. */
    elements: MarkdownListItem[];
    /** The type of list item that this element is. */
    type: string;
    /** Exact tags on this list item. */
    tags: Set<string>;
    /** All links in the file. */
    links: Link[];
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
    static from(object: Partial<MarkdownListItem>, normalizer?: LinkNormalizer): MarkdownListItem {
        let result: MarkdownListItem;
        if (object.type === "task") result = new MarkdownTaskItem(object.$file!, object);
        else result = new MarkdownListItem(object.$file!, object);

        if (normalizer) {
            result.links = result.links.map(normalizer);
        }

        result.elements = (result.elements || []).map((elem) => MarkdownListItem.from(elem, normalizer));
        return result;
    }

    public constructor(file: string, init: Partial<MarkdownListItem>) {
        Object.assign(this, init);

        this.$file = file;
        this.$id = MarkdownListItem.readableId(file, this.position.start);
        this.type = "list-item";
    }

    /** Get the line that this list item starts on. */
    get line(): number {
        return this.position.start;
    }

    /** All of the indexed fields in this object. */
    get fields() {
        return MarkdownListItem.FIELD_DEF(this);
    }

    /** Fetch a specific field by key. */
    public field(key: string) {
        return MarkdownListItem.FIELD_DEF(this, key)?.[0];
    }

    public value(key: string): Literal | undefined {
        return this.field(key)?.value;
    }

    private static FIELD_DEF: FieldExtractor<MarkdownListItem> = Extractors.intrinsics();

    /** Generate a readable ID for this item using the line number. */
    static readableId(file: string, line: number): string {
        return `${file}/list${line}`;
    }
}

/** A specific task inside of a markdown list. */
export class MarkdownTaskItem extends MarkdownListItem implements Indexable, Linkbearing, Taggable {
    static TYPES = ["markdown", "list-item", "task", LINKBEARING_TYPE, TAGGABLE_TYPE];

    $types: string[] = MarkdownTaskItem.TYPES;
    $typename: string = "Task";

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
