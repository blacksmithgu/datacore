import { JsonMarkdownPage } from "index/types/markdown/json";
import { JsonPDF } from "index/types/pdf/json";
import { CachedMetadata, FileStats } from "obsidian";

/** A command to import a markdown file. */
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

/** A command to import a canvas file. */
export interface CanvasImport {
    type: "canvas";

    /** The path we are importing. */
    path: string;
    /** The raw JSON contents we are importing. */
    contents: string;
    /** The stats for the file. */
    stat: FileStats;
}

/** A command to import a canvas file. */
export interface PDFImport {
    type: "pdf";

    /** The path we are importing. */
    path: string;
    /** The stats for the file. */
    stat: FileStats;

    resourceURI: string;
}

/** Available import commands to be sent to an import web worker. */
export type ImportCommand = MarkdownImport | CanvasImport | PDFImport;

/** The result of importing a file of some variety. */
export interface MarkdownImportResult {
    /** The type of import. */
    type: "markdown";
    /** The result of importing. */
    result: JsonMarkdownPage;
}

export interface PdfImportResult {
    /** The type of import. */
    type: "pdf";
    /** The result of importing. */
    result: JsonPDF;
}

export interface ImportFailure {
    /** Failed to import. */
    type: "error";

    /** The error that the worker indicated on failure. */
    $error: string;
}

export type ImportResult = MarkdownImportResult | PdfImportResult | ImportFailure;
