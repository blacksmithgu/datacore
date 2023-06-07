import { getFileTitle } from "expression/normalize";
import { MarkdownFile, MarkdownSection } from "index/types/markdown";
import { DateTime } from "luxon";
import { CachedMetadata, FileStats } from "obsidian";
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

    // All sections.
    const sections = new BTree(undefined, (a, b) => a - b);
    let sectionOrdinal = 1;
    if (metadata.headings) {
        for (let index = 0; index < metadata.headings.length; index++) {
            const section = metadata.headings[index];
            const start = section.position.start.line;
            const end =
                index == metadata.headings.length - 1 ? lines.length : metadata.headings[index + 1].position.start.line;

            sections.set(
                start,
                new MarkdownSection(path, {
                    ordinal: sectionOrdinal,
                    title: section.heading,
                    level: section.level,
                    position: { start, end },
                    etags: new Set(),
                })
            );

            sectionOrdinal += 1;
        }
    }

    // Add an implicit section for the "heading" section of the page if there is not an immediate header but there is
    // some content in the file. If there are other sections, then go up to that, otherwise, go for the entire file.
    const firstSection: [number, MarkdownSection] | undefined = sections.getPairOrNextHigher(0);
    if ((!firstSection && !empty) || (firstSection && !emptylines(lines, 0, firstSection[1].position.start))) {
        const end = firstSection ? firstSection[1].position.start : lines.length;
        sections.set(
            0,
            new MarkdownSection(path, {
                ordinal: 0,
                title: getFileTitle(path),
                level: 1,
                position: { start: 0, end },
                etags: new Set(),
            })
        );
    }

    // For each tag, assign it to the appropriate section that it is a part of.
    const etags = new Set<string>();
    for (let tagdef of metadata.tags ?? []) {
        const tag = tagdef.tag.startsWith("#") ? tagdef.tag : "#" + tagdef.tag;
        etags.add(tag);

        const section = sections.getPairOrNextLower(tagdef.position.start.line);
        if (!section) {
            // Not sure why there isn't a section.
            continue;
        }

        section[1].etags.add(tag);
    }

    return new MarkdownFile({
        path,
        etags,
        sections: sections.valuesArray(),
        ctime: DateTime.fromMillis(stats.ctime),
        mtime: DateTime.fromMillis(stats.mtime),
        frontmatter: metadata.frontmatter,
        size: stats.size,
        position: { start: 0, end: lines.length },
    });
}

/** Check if the given line range is all empty. Start is inclusive, end exclusive. */
function emptylines(lines: string[], start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
        if (lines[index].trim() !== "") return false;
    }

    return false;
}
