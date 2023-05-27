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
    if (metadata.headings) {
        for (let index = 0; index < metadata.headings.length; index++) {
            const section = metadata.headings[index];
            const end = index == metadata.headings.length - 1 ? lines.length : metadata.headings[index + 1].position.start.line;

            sections.push(
                new MarkdownSection(path, {
                    ordinal: sectionOrdinal,
                    title: section.heading,
                    level: section.level,
                    position: {
                        start: section.position.start.line,
                        end
                    },
                })
            );

            sectionOrdinal += 1;
        }
    }

    return new MarkdownFile({
        path,
        etags,
        sections,
        ctime: DateTime.fromMillis(stats.ctime),
        mtime: DateTime.fromMillis(stats.mtime),
        frontmatter: metadata.frontmatter,
        size: stats.size,
        position: { start: 0, end: lines.length },
    });
}
