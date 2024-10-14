/**
 * @module indexables
 */
import { Link } from "expression/link";
import { FILE_TYPE, File, Indexable, LINKABLE_TYPE, Linkable } from "./indexable";
import { DateTime } from "luxon";
import { Extractors, FIELDBEARING_TYPE, FieldExtractor, Fieldbearing } from "expression/field";
import { Literal } from "expression/literal";

/** Datacore representation of a generic file with no additional parsing. */
export class GenericFile implements File, Indexable, Fieldbearing, Linkable {
    static TYPES: string[] = [FILE_TYPE, FIELDBEARING_TYPE, LINKABLE_TYPE];

    $types: string[] = GenericFile.TYPES;
    $typename: string = "File";

    $path: string;
    /** Obsidian-provided date this page was created. */
    $ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    $mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    $size: number;
    /** The extension of the file. */
    $extension: string;

    public constructor(path: string, ctime: DateTime, mtime: DateTime, size: number) {
        this.$path = path;
        this.$ctime = ctime;
        this.$mtime = mtime;
        this.$size = size;

        const lastDot = path.lastIndexOf(".");
        this.$extension = lastDot < 0 ? "" : path.substring(lastDot + 1);
    }

    get fields() {
        return GenericFile.FIELD_DEF(this);
    }

    public field(key: string) {
        return GenericFile.FIELD_DEF(this, key)?.[0];
    }

    /** Get the value for the given field. */
    public value(key: string): Literal | undefined {
        return this.field(key)?.value;
    }

    /** Unique ID for this object. */
    get $id(): string {
        return this.$path;
    }

    /** The file for the file is the file. */
    get $file(): string {
        return this.$path;
    }

    /** A link to the file. */
    get $link(): Link {
        return Link.file(this.$path);
    }

    private static FIELD_DEF: FieldExtractor<GenericFile> = Extractors.intrinsics();
}
