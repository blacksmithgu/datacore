import { DateTime } from "luxon";

/** General metadata for any file. */
export interface File {
    /** The path this file exists at. */
    path: string;
    /** Obsidian-provided date this page was created. */
    ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    size: number;
    /** The extension of the file. */
    extension: string;
}
