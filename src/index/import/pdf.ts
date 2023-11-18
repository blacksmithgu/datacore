import { JsonPDF } from "index/types/pdf/json";
import { FileStats } from "obsidian";
import { PDFDocumentProxy } from "pdfjs-dist";

export function pdfImport(
	path: string,
	stats: FileStats,
	doc: PDFDocumentProxy
): JsonPDF {
	return {
		$pageCount: doc.numPages,
		$extension: "pdf",
		$ctime: stats.ctime,
		$mtime: stats.mtime,
		$path: path,
		$size: stats.size
	}
}