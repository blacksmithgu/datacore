import { CachedMetadata, FileStats } from "obsidian";

export interface MarkdownImport {
    type: "markdown";

    /** The path we are importing. */
    path: string;
    /** The file contents to import. */
    contents: string;
    /** The stats for the file. */
    stat: FileStats;
    /** Metadata for the file. */
    metadata: CachedMetadata;
} 

export interface CanvasImport {
    type: "canvas";

    /** The path we are importing. */
    path: string;
    /** The raw JSON contents we are importing. */
    contents: string;
    /** The stats for the file. */
    stat: FileStats;
}

/** Available import commands to be sent to an import web worker. */
export type ImportCommand = MarkdownImport | CanvasImport;
