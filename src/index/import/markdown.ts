import { getFileTitle } from "expression/normalize";
import {
    MarkdownBlock,
    MarkdownFile,
    MarkdownListBlock,
    MarkdownListItem,
    MarkdownSection,
    MarkdownTaskItem,
} from "index/types/markdown";
import { DateTime } from "luxon";
import { CachedMetadata, FileStats, ListItemCache } from "obsidian";
import BTree from "sorted-btree";

/**
 * Given the raw source and Obsidian metadata for a given markdown file,
 * return full markdown file metadata.
 */
export function markdownImport(
    path: string,
    markdown: string,
    metadata: CachedMetadata,
    stats: FileStats
): MarkdownFile {
    // Total length of the file.
    const lines = markdown.split("\n");
    const empty = !lines.some((line) => line.trim() !== "");

    //////////////
    // Sections //
    //////////////
    const metaheadings = metadata.headings ?? [];
    metaheadings.sort((a, b) => a.position.start.line - b.position.start.line);

    const sections = new BTree<number, MarkdownSection>(undefined, (a, b) => a - b);
    for (let index = 0; index < metaheadings.length; index++) {
        const section = metaheadings[index];
        const start = section.position.start.line;
        const end =
            index == metaheadings.length - 1 ? lines.length - 1 : metaheadings[index + 1].position.start.line - 1;

        sections.set(
            start,
            new MarkdownSection(path, {
                ordinal: index + 1,
                title: section.heading,
                level: section.level,
                position: { start, end },
                blocks: [],
                etags: new Set(),
            })
        );
    }

    // Add an implicit section for the "heading" section of the page if there is not an immediate header but there is
    // some content in the file. If there are other sections, then go up to that, otherwise, go for the entire file.
    const firstSection: [number, MarkdownSection] | undefined = sections.getPairOrNextHigher(0);
    if ((!firstSection && !empty) || (firstSection && !emptylines(lines, 0, firstSection[1].position.start))) {
        const end = firstSection ? firstSection[1].position.start - 1 : lines.length;
        sections.set(
            0,
            new MarkdownSection(path, {
                ordinal: 0,
                title: getFileTitle(path),
                level: 1,
                position: { start: 0, end },
                blocks: [],
                etags: new Set(),
            })
        );
    }

    // All blocks; we will assign tags and other metadata to blocks as we encounter them. At the end, only blocks that
    // have actual metadata will be stored to save on memory pressure.
    const blocks = new BTree<number, MarkdownBlock>(undefined, (a, b) => a - b);
    let blockOrdinal = 1;
    for (const block of metadata.sections || []) {
        // Skip headings blocks, we handle them specially as sections.
        if (block.type === "heading") continue;

        const start = block.position.start.line;
        const end = block.position.end.line;

        if (block.type === "list") {
            blocks.set(
                start,
                new MarkdownListBlock(path, {
                    ordinal: blockOrdinal,
                    position: { start, end },
                    etags: new Set(),
                    blockId: block.id,
                    elements: [],
                })
            );
        } else {
            blocks.set(
                start,
                new MarkdownBlock(path, {
                    ordinal: blockOrdinal,
                    position: { start, end },
                    etags: new Set(),
                    blockId: block.id,
                    type: block.type,
                })
            );
        }
    }

    // Add blocks to sections.
    for (const block of blocks.values() as Iterable<MarkdownBlock>) {
        const section = sections.getPairOrNextLower(block.position.start);

        if (section && section[1].position.end >= block.position.end) {
            section[1].blocks.push(block);
        }
    }

    // All list items in lists. Start with a simple trivial pass.
    const listItems = new BTree<number, MarkdownListItem>(undefined, (a, b) => a - b);
    for (const list of metadata.listItems || []) {
        const item = convertListItem(path, list);
        listItems.set(item.position.start, item);
    }

    // In the second list pass, actually construct the list heirarchy.
    for (const item of listItems.values()) {
        if (item.parentLine < 0) {
            const listBlock = blocks.get(-item.parentLine);
            if (!listBlock || !(listBlock instanceof MarkdownListBlock)) continue;

            listBlock.elements.push(item);
        } else {
            const listItem = listItems.get(item.parentLine);
            if (!listItem) continue;

            listItem.elements.push(item);
        }
    }

    // For each tag, assign it to the appropriate section and block that it is a part of.
    const etags = new Set<string>();
    for (let tagdef of metadata.tags ?? []) {
        const tag = tagdef.tag.startsWith("#") ? tagdef.tag : "#" + tagdef.tag;
        const line = tagdef.position.start.line;
        etags.add(tag);

        const section = sections.getPairOrNextLower(line);
        if (section && section[1].position.end >= line) {
            section[1].etags.add(tag);
        }

        const block = blocks.getPairOrNextLower(line);
        if (block && block[1].position.end >= line) {
            block[1].etags.add(tag);
        }

        const listItem = blocks.getPairOrNextHigher(line);
        if (listItem && listItem[1].position.end >= line) {
            listItem[1].etags.add(tag);
        }
    }

    return new MarkdownFile({
        path,
        etags,
        sections: sections.valuesArray(),
        ctime: DateTime.fromMillis(stats.ctime),
        mtime: DateTime.fromMillis(stats.mtime),
        frontmatter: metadata.frontmatter,
        extension: "md",
        size: stats.size,
        position: { start: 0, end: lines.length },
    });
}

/** Convert a list item into the appropriate markdown list type. */
function convertListItem(path: string, raw: ListItemCache): MarkdownListItem {
    const common: Partial<MarkdownListItem> = {
        etags: new Set(),
        position: { start: raw.position.start.line, end: raw.position.end.line },
        elements: [],
        parentLine: raw.parent,
        blockId: raw.id,
    };

    if (raw.task) {
        return new MarkdownTaskItem(
            path,
            Object.assign(common, {
                status: raw.task,
            })
        );
    } else {
        return new MarkdownListItem(path, common);
    }
}

/** Check if the given line range is all empty. Start is inclusive, end exclusive. */
function emptylines(lines: string[], start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
        if (lines[index].trim() !== "") return false;
    }

    return false;
}
