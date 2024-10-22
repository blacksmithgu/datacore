import { JsonLink, Link } from "expression/link";
import { getExtension, getFileTitle } from "utils/normalizers";
import { CachedMetadata, FileStats, FrontMatterCache } from "obsidian";
import { parse as parseYaml } from "yaml";
import BTree from "sorted-btree";
import {
    InlineField,
    JsonInlineField,
    asInlineField,
    extractFullLineField,
    extractInlineFields,
    jsonInlineField,
} from "./inline-field";
import {
    JsonMarkdownBlock,
    JsonMarkdownListBlock,
    JsonMarkdownListItem,
    JsonMarkdownPage,
    JsonMarkdownSection,
    JsonMarkdownTaskItem,
    JsonMarkdownDatablock,
    JsonMarkdownCodeblock,
    JsonFrontmatterEntry,
} from "index/types/json/markdown";
import { JsonConversion } from "index/types/json/common";
import { YamlConversion } from "index/types/yaml";
import { mapObjectValues } from "utils/data";

/** Matches yaml datablocks, which show up as independent objects in the datacore index. */
const YAML_DATA_REGEX = /```yaml:data/i;
/** Matches the start of any codeblock fence. */
const CODEBLOCK_FENCE_REGEX = /^(?:```|~~~)(.*)$/im;
/** Matches list items (including inside text blocks). */
const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu;

/**
 * Given the raw source and Obsidian metadata for a given markdown file,
 * return full markdown file metadata.
 */
export function markdownImport(
    path: string,
    markdown: string,
    metadata: CachedMetadata,
    stats: FileStats
): JsonMarkdownPage {
    const { lines, metadata: pageMetadata, frontmatter, sections } = markdownSourceImport(path, markdown, metadata);
    const page = new PageData(path, stats, lines.length, pageMetadata, sections, frontmatter);

    return page.build();
}

/** Import markdown file metadata, producing all relevant markdown data. */
export function markdownSourceImport(
    path: string,
    markdown: string,
    metadata: CachedMetadata
): {
    lines: string[];
    metadata: Metadata;
    frontmatter?: Record<string, JsonFrontmatterEntry>;
    sections: SectionData[];
} {
    const frontmatter: Record<string, JsonFrontmatterEntry> | undefined = metadata.frontmatter
        ? parseFrontmatterBlock(metadata.frontmatter)
        : undefined;
    const lines = markdown.split(/\r\n|\r|\n/);
    const markdownMetadata = new Metadata();
    const sectionArray: SectionData[] = [];
    //////////////
    // Sections //
    //////////////

    const metaheadings = metadata.headings ?? [];
    metaheadings.sort((a, b) => a.position.start.line - b.position.start.line);

    const sections = new BTree<number, SectionData>(undefined, (a, b) => a - b);
    for (let index = 0; index < metaheadings.length; index++) {
        const entry = metaheadings[index];
        const start = entry.position.start.line;
        const end = index == metaheadings.length - 1 ? lines.length : metaheadings[index + 1].position.start.line;

        const section = new SectionData(start, end, entry.heading, entry.level, index + 1);
        sections.set(start, section);
    }

    // Add an implicit section for the "heading" section of the page if there is not an immediate header but there is
    // some content in the file. If there are other sections, then go up to that, otherwise, go for the entire file.
    if (sections.size == 0) {
        if (!emptylines(lines, 0, lines.length)) {
            const section = new SectionData(0, lines.length, getFileTitle(path), 1, 0);
            sections.set(0, section);
        }
    } else {
        // Find the start of the first section.
        const first = sections.getPairOrNextHigher(0)?.[1]!!;

        if (first.start > 0 && !emptylines(lines, 0, first.start)) {
            const section = new SectionData(0, first.start, getFileTitle(path), 1, 0);

            sections.set(0, section);
        }
    }

    ////////////
    // Blocks //
    ////////////

    // All blocks; we will assign tags and other metadata to blocks as we encounter them. At the end, only blocks that
    // have actual metadata will be stored to save on memory pressure.
    const blocks = new BTree<number, BlockData>(undefined, (a, b) => a - b);
    let blockOrdinal = 1;
    for (const block of metadata.sections || []) {
        // Skip headings blocks, we handle them specially as sections.
        if (block.type === "heading") continue;

        const start = block.position.start.line;
        const end = block.position.end.line + 1;
        const startLine = lines[start]; // to use to check the codeblock type

        if (block.type === "list") {
            blocks.set(start, new ListBlockData(start, end, blockOrdinal++, block.id));
        } else if (block.type == "code" && YAML_DATA_REGEX.test(startLine)) {
            const yaml: string = lines
                .slice(start + 1, end - 1)
                .join("\n")
                .replace(/\t/gm, "  ");
            const split: Record<string, JsonFrontmatterEntry> = parseFrontmatterBlock(parseYaml(yaml));

            blocks.set(start, new DatablockData(start, end, blockOrdinal++, split, block.id));
        } else if (block.type === "code") {
            // Check if the block is fenced.
            const match = startLine.match(CODEBLOCK_FENCE_REGEX);
            if (!match) {
                // This is an indented-style codeblock.
                blocks.set(start, new CodeblockData(start, end, blockOrdinal++, [], "indent", start, end, block.id));
            } else {
                const languages = match.length > 1 && match[1] ? match[1].split(",") : [];
                blocks.set(
                    start,
                    new CodeblockData(start, end, blockOrdinal++, languages, "fenced", start + 1, end - 1, block.id)
                );
            }
        } else {
            blocks.set(start, new BaseBlockData(start, end, blockOrdinal++, block.type, block.id));
        }
    }

    // Add blocks to sections.
    for (const block of blocks.values()) {
        lookup(block.start, sections)?.block(block);
    }

    ///////////
    // Lists //
    ///////////

    // All list items in lists. Start with a simple trivial pass.
    const contentRegex = /^[\t\f\v ]*[\-+\*]\s(\[.\]\s)?/;
    const markerRegex = /^(>?\s?)*(\t|\s)*/g;
    const listItems = new BTree<number, ListItemData>(undefined, (a, b) => a - b);

    for (const list of metadata.listItems || []) {
        const line = lines[list.position.start.line];

        // TODO: Implement flag which skips indexing list items.
        const match = line.match(LIST_ITEM_REGEX);
        let symbol = undefined,
            text = undefined;
        if (match) {
            symbol = match[1];
            text = match[3];
        }

        const item = new ListItemData(
            list.position.start.line,
            list.position.end.line,
            list.parent,
            symbol,
            list.id,
            list.task,
            text
        );
        listItems.set(item.start, item);
    }

    // In the second list pass, actually construct the list heirarchy.
    for (const item of listItems.values()) {
        if (item.parentLine < 0) {
            const listBlock = blocks.get(-item.parentLine);
            if (!listBlock || !(listBlock.type === "list")) continue;

            (listBlock as ListBlockData).items.push(item);
        } else {
            listItems.get(item.parentLine)?.elements.push(item);
        }
    }

    //////////
    // Tags //
    //////////

    // For each tag, assign it to the appropriate section and block that it is a part of.
    for (const tagdef of metadata.tags ?? []) {
        const tag = tagdef.tag.startsWith("#") ? tagdef.tag : "#" + tagdef.tag;
        const line = tagdef.position.start.line;
        markdownMetadata.tag(tag);

        lookup(line, sections)?.metadata.tag(tag);
        lookup(line, blocks)?.metadata.tag(tag);
        lookup(line, listItems)?.metadata.tag(tag);
    }

    // Add frontmatter tags.
    if (metadata.frontmatter) {
        for (const rawtag of extractTags(metadata.frontmatter)) {
            const tag = rawtag.startsWith("#") ? rawtag : "#" + rawtag;
            markdownMetadata.tag(tag);
        }
    }

    ///////////
    // Links //
    ///////////

    for (let linkdef of metadata.links ?? []) {
        const link = Link.infer(linkdef.link);
        const line = linkdef.position.start.line;
        markdownMetadata.link(link);

        lookup(line, sections)?.metadata.link(link);
        lookup(line, blocks)?.metadata.link(link);
        lookup(line, listItems)?.metadata.link(link);
    }

    ///////////////////////
    // Frontmatter Links //
    ///////////////////////

    // Frontmatter links are only assigned to the page.
    for (const linkdef of metadata.frontmatterLinks ?? []) {
        markdownMetadata.link(Link.infer(linkdef.link, false, linkdef.displayText));
    }

    ///////////////////
    // Inline Fields //
    ///////////////////

    for (const field of iterateInlineFields(lines)) {
        const line = field.position.line;
        markdownMetadata.inlineField(field);

        lookup(line, sections)?.metadata.inlineField(field);
        lookup(line, blocks)?.metadata.inlineField(field);
        lookup(line, listItems)?.metadata.inlineField(field);
    }
    sectionArray.push(...sections.values());
    return {
        lines,
        frontmatter,
        metadata: markdownMetadata,
        sections: sectionArray,
    };
}
//////////////////
// Parsing Aids //
//////////////////

/** Check if the given line range is all empty. Start is inclusive, end exclusive. */
function emptylines(lines: string[], start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
        if (lines[index].trim() !== "") return false;
    }

    return true;
}

/**
 * Yields all inline fields found in the document by traversing line by line through the document. Performs some optimizations
 * to skip extra-large lines, and can be disabled.
 */
export function* iterateInlineFields(content: string[]): Generator<InlineField> {
    for (let lineno = 0; lineno < content.length; lineno++) {
        const line = content[lineno];

        // Fast-bailout for lines that are too long or do not contain '::'.
        if (line.length > 32768 || !line.includes("::")) continue;

        // TODO: Re-add support for those custom emoji fields on tasks and similar.
        let inlineFields = extractInlineFields(line);
        if (inlineFields.length > 0) {
            for (let ifield of inlineFields) yield asInlineField(ifield, lineno);
        } else {
            let fullLine = extractFullLineField(line);
            if (fullLine) yield asInlineField(fullLine, lineno);
        }
    }
}

/** Top-level function which maps a YAML block - including frontmatter - into frontmatter entries. */
export function parseFrontmatterBlock(block: Record<string, any>): Record<string, JsonFrontmatterEntry> {
    const result: Record<string, JsonFrontmatterEntry> = {};
    for (const key of Object.keys(block)) {
        const value = block[key];

        result[key.toLowerCase()] = {
            key: key,
            value: JsonConversion.json(YamlConversion.literal(value)),
            raw: value,
        };
    }

    return result;
}

/** Finds an element which contains the given line. */
export function lookup<T extends { start: number; end: number }>(line: number, tree: BTree<number, T>): T | undefined {
    const target = tree.getPairOrNextLower(line)?.[1];
    if (target && target.end >= line) return target;

    return undefined;
}

/** Extract tags intelligently from frontmatter. Handles arrays, numbers, and strings. */
export function extractTags(metadata: FrontMatterCache): string[] {
    let tagKeys = Object.keys(metadata).filter((t) => t.toLowerCase() == "tags" || t.toLowerCase() == "tag");

    return tagKeys
        .map((k) => splitFrontmatterTagOrAlias(metadata[k], /[,\s]+/))
        .reduce((p, c) => p.concat(c), [])
        .map((str) => (str.startsWith("#") ? str : "#" + str));
}

/** Split a frontmatter list into separate elements; handles actual lists, comma separated lists, and single elements. */
export function splitFrontmatterTagOrAlias(data: any, on: RegExp): string[] {
    if (data == null || data == undefined) return [];
    if (Array.isArray(data)) {
        return data
            .filter((s) => !!s)
            .map((s) => splitFrontmatterTagOrAlias(s, on))
            .reduce((p, c) => p.concat(c), []);
    }

    // Force to a string to handle numbers and so on.
    return ("" + data)
        .split(on)
        .filter((t) => !!t)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

///////////////////////
// Builder Utilities //
///////////////////////

/** Convienent shared utility for tracking metadata - links, tags, and so on. */
export class Metadata {
    public tags: Set<string> = new Set();
    public links: Link[] = [];
    public inlineFields: Record<string, InlineField> = {};

    /** Add a tag to the metadata. */
    public tag(tag: string) {
        this.tags.add(tag);
    }

    /** Add a link to the metadata. */
    public link(link: Link) {
        if (this.links.find((v) => v.equals(link))) return;
        this.links.push(link);
    }

    /** Add an inline field to the metadata. */
    public inlineField(field: InlineField) {
        const lower = field.key.toLowerCase();
        if (Object.keys(this.inlineFields).some((key) => key.toLowerCase() == lower)) return;

        this.inlineFields[lower] = field;
    }

    /** Return a list of unique added tags. */
    public finishTags(): string[] {
        return Array.from(this.tags);
    }

    /** Return a list of JSON-serialized links. */
    public finishLinks(): JsonLink[] {
        return this.links.map((link) => link.toObject());
    }

    /** Return a list of JSON-serialized inline fields. */
    public finishInlineFields(): Record<string, JsonInlineField> {
        return mapObjectValues(this.inlineFields, jsonInlineField);
    }
}

/** Convienent utility for constructing page objects. */
export class PageData {
    public constructor(
        public path: string,
        public stats: FileStats,
        public length: number,
        public metadata: Metadata,
        public sections: SectionData[],
        public frontmatter?: Record<string, JsonFrontmatterEntry>
    ) {}

    public build(): JsonMarkdownPage {
        return {
            $path: this.path,
            $ctime: this.stats.ctime,
            $mtime: this.stats.mtime,
            $size: this.stats.size,
            $extension: getExtension(this.path),
            $position: { start: 0, end: this.length },
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $infields: this.metadata.finishInlineFields(),
            $sections: this.sections.map((x) => x.build()),
            $frontmatter: this.frontmatter,
        };
    }
}

/** Convienent utility for constructing markdown sections. */
export class SectionData {
    public blocks: BlockData[] = [];
    public metadata: Metadata = new Metadata();

    public constructor(
        public start: number,
        public end: number,
        public title: string,
        public level: number,
        public ordinal: number
    ) {}

    public block(block: BlockData) {
        this.blocks.push(block);
    }

    public build(): JsonMarkdownSection {
        return {
            $title: this.title,
            $ordinal: this.ordinal,
            $level: this.level,
            $tags: this.metadata.finishTags(),
            $infields: this.metadata.finishInlineFields(),
            $links: this.metadata.finishLinks(),
            $position: { start: this.start, end: this.end },
            $blocks: this.blocks.map((block) => block.build()),
        };
    }
}

/** Constructs markdown list blocks specifically. */
export class ListBlockData {
    public type: string = "list";
    public metadata: Metadata = new Metadata();
    public items: ListItemData[] = [];

    public constructor(public start: number, public end: number, public ordinal: number, public blockId?: string) {}

    public build(): JsonMarkdownListBlock {
        return {
            $ordinal: this.ordinal,
            $position: { start: this.start, end: this.end },
            $infields: this.metadata.finishInlineFields(),
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $type: "list",
            $blockId: this.blockId,
            $elements: this.items.map((item) => item.build()),
        };
    }
}

/** Constructs markdown codeblocks specifically. */
export class CodeblockData {
    public type: string = "codeblock";
    public metadata: Metadata = new Metadata();

    public constructor(
        public start: number,
        public end: number,
        public ordinal: number,
        public languages: string[],
        public style: "indent" | "fenced",
        public contentStart: number,
        public contentEnd: number,
        public blockId?: string
    ) {}

    public build(): JsonMarkdownCodeblock {
        return {
            $type: "codeblock",
            $ordinal: this.ordinal,
            $position: { start: this.start, end: this.end },
            $infields: this.metadata.finishInlineFields(),
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $blockId: this.blockId,
            $languages: this.languages,
            $style: this.style,
            $contentPosition: { start: this.contentStart, end: this.contentEnd },
        };
    }
}

/** Constructs markdown datablocks specifically. */
export class DatablockData {
    public type: string = "datablock";
    public metadata: Metadata = new Metadata();

    public constructor(
        public start: number,
        public end: number,
        public ordinal: number,
        public data: Record<string, JsonFrontmatterEntry>,
        public blockId?: string
    ) {}

    public build(): JsonMarkdownDatablock {
        return {
            $type: "datablock",
            $ordinal: this.ordinal,
            $position: { start: this.start, end: this.end },
            $infields: this.metadata.finishInlineFields(),
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $blockId: this.blockId,
            $data: this.data,
        };
    }
}

/** Base block metadata used for non-specific blocks. */
export class BaseBlockData {
    public metadata: Metadata = new Metadata();

    public constructor(
        public start: number,
        public end: number,
        public ordinal: number,
        public type: string,
        public blockId?: string
    ) {}

    public build(): JsonMarkdownBlock {
        return {
            $type: this.type,
            $ordinal: this.ordinal,
            $position: { start: this.start, end: this.end },
            $infields: this.metadata.finishInlineFields(),
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $blockId: this.blockId,
        };
    }
}

export type BlockData = ListBlockData | CodeblockData | DatablockData | BaseBlockData;

/** Utility for constructing markdown list items. */
export class ListItemData {
    public metadata: Metadata = new Metadata();
    public elements: ListItemData[] = [];
    public constructor(
        public start: number,
        public end: number,
        public parentLine: number,
        public symbol?: string,
        public blockId?: string,
        public status?: string,
        public text?: string
    ) {}

    public build(): JsonMarkdownListItem {
        return {
            $parentLine: this.parentLine,
            $position: { start: this.start, end: this.end },
            $blockId: this.blockId,
            $elements: this.elements.map((element) => element.build()),
            $type: this.status ? "task" : "list",
            $infields: this.metadata.finishInlineFields(),
            $tags: this.metadata.finishTags(),
            $links: this.metadata.finishLinks(),
            $status: this.status,
            $symbol: this.symbol,
            $text: this.text,
        } as JsonMarkdownTaskItem;
    }
}
