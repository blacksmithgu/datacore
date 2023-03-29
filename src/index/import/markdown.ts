import { MarkdownFile } from "index/types/markdown";
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
    return {
        path,
    } as any as MarkdownFile;
}
