import { Link } from "expression/link";
import { getFileTitle } from "utils/normalizers";
import { DateTime } from "luxon";
import { CachedMetadata, FileStats, ListItemCache } from "obsidian";
import { parse as parseYaml } from "yaml";
import BTree from "sorted-btree";
import { InlineField, asInlineField, extractFullLineField, extractInlineFields } from "./inline-field";
import { EXPRESSION } from "expression/parser";
import { Literal } from "expression/literal";
import {
    FrontmatterEntry,
    JsonMarkdownBlock,
    JsonMarkdownListBlock,
    JsonMarkdownListItem,
    JsonMarkdownPage,
    JsonMarkdownSection,
    JsonMarkdownTaskItem,
    JsonMarkdownDatablock,
} from "index/types/markdown/json";

/** Matches yaml datablocks, which show up as independent objects in the datacore index. */
const YAML_DATA_REGEX = /```yaml:data/i;

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
    // Total length of the file.
    const lines = markdown.split("\n");
    const empty = !lines.some((line) => line.trim() !== "");

    //////////////
    // Sections //
    //////////////

    const metaheadings = metadata.headings ?? [];
    metaheadings.sort((a, b) => a.position.start.line - b.position.start.line);

    const sections = new BTree<number, JsonMarkdownSection>(undefined, (a, b) => a - b);
    for (let index = 0; index < metaheadings.length; index++) {
        const section = metaheadings[index];
        const start = section.position.start.line;
        const end =
            index == metaheadings.length - 1 ? lines.length - 1 : metaheadings[index + 1].position.start.line - 1;

        sections.set(start, {
            $ordinal: index + 1,
            $title: section.heading,
            $level: section.level,
            $position: { start, end },
            $infields: {},
            $blocks: [],
            $tags: [],
            $links: [],
        });
    }

    // Add an implicit section for the "heading" section of the page if there is not an immediate header but there is
    // some content in the file. If there are other sections, then go up to that, otherwise, go for the entire file.
    const firstSection: [number, JsonMarkdownSection] | undefined = sections.getPairOrNextHigher(0);
    if ((!firstSection && !empty) || (firstSection && !emptylines(lines, 0, firstSection[1].$position.start))) {
        const end = firstSection ? firstSection[1].$position.start - 1 : lines.length;
        sections.set(0, {
            $ordinal: 0,
            $title: getFileTitle(path),
            $level: 1,
            $position: { start: 0, end },
            $blocks: [],
            $infields: {},
            $tags: [],
            $links: [],
        });
    }

    ////////////
    // Blocks //
    ////////////

    // All blocks; we will assign tags and other metadata to blocks as we encounter them. At the end, only blocks that
    // have actual metadata will be stored to save on memory pressure.
    const blocks = new BTree<number, JsonMarkdownBlock>(undefined, (a, b) => a - b);
    let blockOrdinal = 1;
    for (const block of metadata.sections || []) {
        // Skip headings blocks, we handle them specially as sections.
        if (block.type === "heading") continue;

        const start = block.position.start.line;
        const end = block.position.end.line;
        const startLine = lines[start]; // to use to check the codeblock type

        if (block.type === "list") {
            blocks.set(start, {
                $ordinal: blockOrdinal++,
                $position: { start, end },
                $tags: [],
                $links: [],
                $infields: {},
                $blockId: block.id,
                $elements: [],
                $type: "list",
            } as JsonMarkdownListBlock);
        } else if (block.type == "code" && YAML_DATA_REGEX.test(startLine)) {
            const yaml: string = lines
                .slice(start + 1, end)
                .join("\n")
                .replace(/\t/gm, "  ");
            const parsed = parseYaml(yaml);

            const split: Record<string, FrontmatterEntry> = {};
            for (const key of Object.keys(parsed)) {
                const value = parsed[key];

                split[key.toLowerCase()] = {
                    key: key,
                    value: parseFrontmatter(value),
                    raw: value,
                };
            }

            blocks.set(start, {
                $ordinal: blockOrdinal++,
                $position: { start, end },
                $tags: [],
                $infields: {},
                $type: "datablock",
                $data: split,
                $links: [],
            } as JsonMarkdownDatablock);
        } else {
            blocks.set(start, {
                $ordinal: blockOrdinal++,
                $position: { start, end },
                $tags: [],
                $links: [],
                $infields: {},
                $blockId: block.id,
                $type: block.type,
            });
        }
    }

    // Add blocks to sections.
    for (const block of blocks.values() as Iterable<JsonMarkdownBlock>) {
        const section = sections.getPairOrNextLower(block.$position.start);

        if (section && section[1].$position.end >= block.$position.end) {
            section[1].$blocks.push(block);
        }
    }

    ///////////
    // Lists //
    ///////////

    // All list items in lists. Start with a simple trivial pass.
    const listItems = new BTree<number, JsonMarkdownListItem>(undefined, (a, b) => a - b);
    for (const list of metadata.listItems || []) {
        const item = convertListItem(list);
        let content = lines
            .slice(item.$position.start, (item.$position.end) + 1).join("\n")
            /** strip inline fields maybe */
        let marker = content.split("\n")[0].replace(/>|\t/g, "").trim().slice(0, 1)
        item.$symbol = marker;
        item.$text = content.replace(/[\-+\*]\s\[.\]\s/, "");
        listItems.set(item.$position.start, item);
    }

    // In the second list pass, actually construct the list heirarchy.
    for (const item of listItems.values()) {
        let content = lines
            .slice(item.$position.start, (item.$position.end) + 1).join("\n")
            .replace(/^[\t\f\v ]+|[\-*+]\s/gm, "")
            /** strip inline fields maybe */
            // .replace(/[\[\(].*?::\s*.*?[\]\)]/gm, "")
        item.$text = content;
        if (item.$parentLine < 0) {
            const listBlock = blocks.get(-item.$parentLine);
            if (!listBlock || !(listBlock.$type === "list")) continue;

            (listBlock as JsonMarkdownListBlock).$elements.push(item);
        } else {
            const listItem = listItems.get(item.$parentLine);
            if (!listItem) continue;

            listItem.$elements.push(item);
        }
    }

    //////////
    // Tags //
    //////////

    // For each tag, assign it to the appropriate section and block that it is a part of.
    const tags = new Set<string>();
    for (let tagdef of metadata.tags ?? []) {
        const tag = tagdef.tag.startsWith("#") ? tagdef.tag : "#" + tagdef.tag;
        const line = tagdef.position.start.line;
        tags.add(tag);

        const section = sections.getPairOrNextLower(line);
        if (section && section[1].$position.end >= line) addTag(section[1].$tags, tag);

        const block = blocks.getPairOrNextLower(line);
        if (block && block[1].$position.end >= line) addTag(block[1].$tags, tag);

        const listItem = blocks.getPairOrNextLower(line);
        if (listItem && listItem[1].$position.end >= line) addTag(listItem[1].$tags, tag);
    }

    ///////////
    // Links //
    ///////////

    const links: Link[] = [];
    for (let linkdef of metadata.links ?? []) {
        const link = Link.infer(linkdef.link);
        const line = linkdef.position.start.line;
        addLink(links, link);

        const section = sections.getPairOrNextLower(line);
        if (section && section[1].$position.end >= line) addLink(section[1].$links, link);

        const block = blocks.getPairOrNextLower(line);
        if (block && block[1].$position.end >= line) addLink(block[1].$links, link);

        const listItem = listItems.getPairOrNextLower(line);
        if (listItem && listItem[1].$position.end >= line) addLink(listItem[1].$links, link);
    }

    ///////////////////////
    // Frontmatter Links //
    ///////////////////////

    // Frontmatter links are only assigned to the page.
    for (const linkdef of metadata.frontmatterLinks ?? []) {
        const link = Link.infer(linkdef.link, false, linkdef.displayText);
        addLink(links, link);
    }

    ///////////////////
    // Inline Fields //
    ///////////////////

    const inlineFields: Record<string, InlineField> = {};
    for (const field of iterateInlineFields(lines)) {
        const line = field.position.line;
        addInlineField(inlineFields, field);

        const section = sections.getPairOrNextLower(line);
        if (section && section[1].$position.end >= line) addInlineField(section[1].$infields, field);

        const block = blocks.getPairOrNextLower(line);
        if (block && block[1].$position.end >= line) addInlineField(block[1].$infields, field);

        const listItem = listItems.getPairOrNextLower(line);
        if (listItem && listItem[1].$position.end >= line) addInlineField(listItem[1].$infields, field);
    }

    /////////////////////////
    // Frontmatter Parsing //
    /////////////////////////

    const frontmatter: Record<string, FrontmatterEntry> = {};
    for (const key of Object.keys(metadata.frontmatter ?? {})) {
        const value = metadata.frontmatter![key];

        // Lower-case the keys; this does mean we may miss some frontmatter entries but I hope not too many people
        // have frontmatter keys that are identical up to casing...
        // If you do, I'm very sorry to hear that. I may add the raw frontmatter somewhere for your explicit use case.
        frontmatter[key.toLowerCase()] = {
            key,
            value: parseFrontmatter(value),
            raw: value,
        };
    }

    return {
        $path: path,
        $tags: Array.from(tags),
        $links: links,
        $sections: sections.valuesArray(),
        $ctime: stats.ctime,
        $mtime: stats.mtime,
        $frontmatter: frontmatter,
        $infields: inlineFields,
        $extension: "md",
        $size: stats.size,
        $position: { start: 0, end: lines.length },
    };
}

/** Convert a list item into the appropriate markdown list type. */
function convertListItem(raw: ListItemCache): JsonMarkdownListItem {
    if (raw.task) {
        return {
            $tags: [],
            $links: [],
            $position: { start: raw.position.start.line, end: raw.position.end.line },
            $elements: [],
            $infields: {},
            $parentLine: raw.parent,
            $blockId: raw.id,
            $type: "task",
            $status: raw.task,
        } as JsonMarkdownTaskItem;
    } else {
        return {
            $tags: [],
            $links: [],
            $position: { start: raw.position.start.line, end: raw.position.end.line },
            $elements: [],
            $infields: {},
            $parentLine: raw.parent,
            $blockId: raw.id,
            $type: "list",
        };
    }
}

/** Check if the given line range is all empty. Start is inclusive, end exclusive. */
function emptylines(lines: string[], start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
        if (lines[index].trim() !== "") return false;
    }

    return true;
}

/**
 * Mutably add the given link to the list only if it is not already present.
 * This is O(n) but should be fine for most files; we could eliminate the O(n) by instead
 * using intermediate sets but not worth the complexity.
 */
function addLink(target: Link[], incoming: Link) {
    if (target.find((v) => v.equals(incoming))) return;
    target.push(incoming);
}

/**
 * Yields all inline fields found in the document by traversing line by line through the document. Performs some optimizations
 * to skip extra-large lines, and can be disabled.
 */
function* iterateInlineFields(content: string[]): Generator<InlineField> {
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

/**
 * Mutably add the inline field to the list only if a field with the given name is not already present.
 * This is linear time, which hopefully will not be awful. We can complicate the storage container if it is.
 *
 * TODO: As a simple optimization, make a builder which makes this O(1).
 */
function addInlineField(target: Record<string, InlineField>, incoming: InlineField) {
    const lower = incoming.key.toLowerCase();
    if (Object.keys(target).some((key) => key.toLowerCase() == lower)) return;

    target[lower] = incoming;
}

/** Add a tag to the given list only if it is not already present. */
function addTag(target: string[], incoming: string) {
    if (target.indexOf(incoming) != -1) return;
    target.push(incoming);
}

/** Recursively convert frontmatter into fields. We have to dance around YAML structure. */
export function parseFrontmatter(value: any): Literal {
    if (value == null) {
        return null;
    } else if (typeof value === "object") {
        if (Array.isArray(value)) {
            let result = [];
            for (let child of value as Array<any>) {
                result.push(parseFrontmatter(child));
            }

            return result;
        } else if (value instanceof Date) {
            let dateParse = DateTime.fromJSDate(value);
            return dateParse;
        } else {
            let object = value as Record<string, any>;
            let result: Record<string, Literal> = {};
            for (let key in object) {
                result[key] = parseFrontmatter(object[key]);
            }

            return result;
        }
    } else if (typeof value === "number") {
        return value;
    } else if (typeof value === "boolean") {
        return value;
    } else if (typeof value === "string") {
        let dateParse = EXPRESSION.date.parse(value);
        if (dateParse.status) return dateParse.value;

        let durationParse = EXPRESSION.duration.parse(value);
        if (durationParse.status) return durationParse.value;

        let linkParse = EXPRESSION.link.parse(value);
        if (linkParse.status) return linkParse.value;

        return value;
    }

    // Backup if we don't understand the type.
    return null;
}
