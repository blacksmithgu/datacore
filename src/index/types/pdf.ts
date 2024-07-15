import { Link } from "expression/link";
import { DateTime } from "luxon";
import { FILE_TYPE, File, Indexable, LINKABLE_TYPE, Linkable } from "./indexable";
import { JsonPDF } from "./json/pdf";
export class PDF implements File, Indexable, Linkable {
    static TYPES = [FILE_TYPE, "pdf", LINKABLE_TYPE];
    $types: string[] = PDF.TYPES;
    $typename: string = "PDF";
    $parent?: Indexable | undefined;
    $revision?: number | undefined;
    $path: string;
    $ctime: DateTime;
    $mtime: DateTime;
    $size: number;
    $extension: string;
    $pageCount: number;
    // file IDs are always just the full path.
    get $id() {
        return this.$path;
    }
    // The file of a file is... it's file.
    get $file() {
        return this.$path;
    }
    /** A link to this file. */
    get $link() {
        return Link.file(this.$path);
    }
    private constructor(init: Partial<PDF>) {
        Object.assign(this, init);
    }
    /** Convert this page into it's partial representation for saving. */
    public partial(): JsonPDF {
        return {
            $path: this.$path,
            $ctime: this.$ctime.toMillis(),
            $mtime: this.$mtime.toMillis(),
            $extension: this.$extension,
            $size: this.$size,
            $pageCount: this.$pageCount
        };
    }
    public static from(raw: JsonPDF): PDF {
        return new PDF({
            $path: raw.$path,
            $ctime: DateTime.fromMillis(raw.$ctime),
            $mtime: DateTime.fromMillis(raw.$mtime),
            $extension: raw.$extension,
            $size: raw.$size,
            $pageCount: raw.$pageCount
        });
    }
}
