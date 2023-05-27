import { Link } from "expression/link";
import { splitMarkdownHeader } from "expression/normalize";
import { MarkdownFile, MarkdownSection } from "index/types/markdown";
import { DateTime } from "luxon";
import { CachedMetadata, FileStats } from "obsidian";

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
    // All tags in the file.
    const etags = new Set(
        (metadata.tags ?? []).map((tag) => tag.tag).map((tag) => (!tag.startsWith("#") ? "#" + tag : tag))
    );

    // Total length of the file.
    const lines = markdown.split("\n");

    // All sections.
    const sections = [];
    let sectionOrdinal = 0;
    for (let section of metadata.sections || []) {
        let [level, title] = splitMarkdownHeader(lines[section.position.start.line]);

        sections.push(
            new MarkdownSection(path, {
                ordinal: sectionOrdinal,
                title,
                level,
                position: {
                    start: section.position.start.line,
                    end: section.position.end.line,
                },
                blockId: section.id,
            })
        );

        sectionOrdinal += 1;
    }

    return new MarkdownFile({
        path,
        etags,
        ctime: DateTime.fromMillis(stats.ctime),
        mtime: DateTime.fromMillis(stats.mtime),
        frontmatter: metadata.frontmatter,
        size: stats.size,
        position: { start: 0, end: lines.length },
    });
}
