/** Any indexable field, which must have a few index-relevant properties. */
export interface Indexable {
    /** The object types that this indexable is. */
    $types: string[];
    /** The unique index ID for this object. */
    $id: string;
    /**
     * The unique index ID for the parent of this object. If present, when the parent is removed, the child will also
     * be removed.
     */
    $parent?: string;
    /** If present, the revision in the index of this object.  */
    $revision?: number;
}
