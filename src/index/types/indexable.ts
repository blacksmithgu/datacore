/**
 * @module indexables
 */
import { Link } from "expression/link";
import { DateTime } from "luxon";

/** Any indexable field, which must have a few index-relevant properties. */
export interface Indexable {
    /** The object types that this indexable is. */
    $types: string[];
    /** Textual description of the object, such as `Page` or `Section`. Used in visualizations. */
    $typename: string;
    /** The unique index ID for this object. */
    $id: string;
    /**
     * The indexable object that is the parent of this object. Only set after the object is actually indexed.
     */
    $parent?: Indexable;
    /** If present, the revision in the index of this object. */
    $revision?: number;
    /** The file that this indexable was derived from, if file-backed. */
    $file?: string;
}

/** Metadata for objects which support linking. */
export const LINKABLE_TYPE = "linkable";
/**
 * {@inheritDoc LINKABLE_TYPE}
 */
export interface Linkable {
    /** A link to this linkable object. */
    $link: Link;
}

/** General metadata for any file. */
export const FILE_TYPE = "file";
/**
 * {@inheritDoc FILE_TYPE}
 */
export interface File extends Linkable {
    /** The path this file exists at. */
    $path: string;
    /** Obsidian-provided date this page was created. */
    $ctime: DateTime;
    /** Obsidian-provided date this page was modified. */
    $mtime: DateTime;
    /** Obsidian-provided size of this page in bytes. */
    $size: number;
    /** The extension of the file. */
    $extension: string;
}

/** Metadata for taggable objects. */
export const TAGGABLE_TYPE = "taggable";
/**
 * {@inheritDoc TAGGABLE_TYPE}
 */
export interface Taggable {
    /** The exact tags on this object. (#a/b/c or #foo/bar). */
    $tags: string[];
}

/** Metadata for objects which can link to other things. */
export const LINKBEARING_TYPE = "links";
/**
 * {@inheritDoc LINKBEARING_TYPE}
 */
export interface Linkbearing {
    /** The links in this file. */
    $links: Link[];
}

/**
 * All supported extensions. This should probably become a dynamic lookup table and not just
 * a fixed list at some point, especially if we add the ability to turn indexing on/off.
 */
export const INDEXABLE_EXTENSIONS = new Set(["md", "markdown", "canvas"]);
