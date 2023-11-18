export interface JsonPDF {
			/** The path this file exists at. */
			$path: string;
	    /** Obsidian-provided date this page was created. */
			$ctime: number;
			/** Obsidian-provided date this page was modified. */
			$mtime: number;
			/** The extension; for markdown files, almost always '.md'. */
			$extension: string;
			/** Obsidian-provided size of this page in bytes. */
			$size: number;
			/** the number of pages in this PDF */
			$pageCount: number;
}