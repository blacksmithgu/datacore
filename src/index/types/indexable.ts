import BTree from "sorted-btree";

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

/** A reference to an object inside of the index. */
export class Reference {
    public id: string;
}

/** Maps key -> set<value>, and value -> set<key>. Sets and values are sorted into BTrees. */
export class BimapIndex {
    /** Maps key -> values for that key. */
    private map: BTree<string, Set<string>>;
    /** Cached inverse map; maps values -> keys that reference that value. */
    private inverse: BTree<string, Set<string>>;

    /** Create a new, empty index map. */
    public constructor() {
        this.map = new BTree();
        this.inverse = new BTree();
    }

    /** Returns all values for the given key. */
    public get(key: string): Readonly<Set<string>> {
        return this.map.get(key, BimapIndex.EMPTY)!;
    }

    /** Returns all keys for the given value. */
    public invert(value: string): Readonly<Set<string>> {
        return this.inverse.get(value, BimapIndex.EMPTY)!;
    }

    /** Sets the key to the given values; this will delete the old mapping for the key if one was present. */
    public set(key: string, values: Set<string>): this {
        if (!values.size) {
            // No need to store if no values.
            this.delete(key);
            return this;
        }

        let oldValues = this.map.get(key);
        if (oldValues) {
            for (let value of oldValues) {
                // Only delete the ones we're not adding back
                if (!values.has(value)) this.inverse.get(value)?.delete(key);
            }
        }

        this.map.set(key, values);
        for (let value of values) {
            if (!this.inverse.has(value)) this.inverse.set(value, new Set([key]));
            else this.inverse.get(value)?.add(key);
        }

        return this;
    }

    /** Clears all values for the given key so they can be re-added. */
    public delete(key: string): boolean {
        let oldValues = this.map.get(key);
        if (!oldValues) return false;

        this.map.delete(key);
        for (let value of oldValues) {
            this.inverse.get(value)?.delete(key);
        }

        return true;
    }

    /** Rename all references to the given key to a new value. */
    public rename(oldKey: string, newKey: string): boolean {
        let oldValues = this.map.get(oldKey);
        if (!oldValues) return false;

        this.delete(oldKey);
        this.set(newKey, oldValues);
        return true;
    }

    /** Clear the entire index. */
    public clear() {
        this.map.clear();
        this.inverse.clear();
    }

    static EMPTY: Set<string> = new Set();
}
