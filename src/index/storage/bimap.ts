/** Maps key -> set<value>, and value -> set<key>. Sets and values are sorted into BTrees. */
export class BimapIndex {
    /** Maps key -> values for that key. */
    private map: Map<string, Set<string>>;
    /** Cached inverse map; maps values -> keys that reference that value. */
    private inverse: Map<string, Set<string>>;

    /** Create a new, empty index map. */
    public constructor() {
        this.map = new Map();
        this.inverse = new Map();
    }

    /** Returns all values for the given key. */
    public get(key: string): Readonly<Set<string>> {
        return this.map.get(key) ?? BimapIndex.EMPTY;
    }

    /** Returns all keys for the given value. */
    public invert(value: string): Readonly<Set<string>> {
        return this.inverse.get(value) ?? BimapIndex.EMPTY;
    }

    /** Sets the key to the given values; this will delete the old mapping for the key if one was present. */
    public set(key: string, values: Iterable<string>): this {
        const sorted = new Set(values);
        if (!sorted.size) {
            // No need to store if no values.
            this.delete(key);
            return this;
        }

        let oldValues = this.map.get(key);
        if (oldValues) {
            for (let value of oldValues.keys()) {
                // Only delete the ones we're not adding back
                if (!sorted.has(value)) this.inverse.get(value)?.delete(key);
            }
        }

        this.map.set(key, sorted);
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
        for (let value of oldValues.keys()) {
            this.inverse.get(value)?.delete(key);
        }

        return true;
    }

    /** Rename all references to the given key to a new value. */
    public rename(oldKey: string, newKey: string): boolean {
        let oldValues = this.map.get(oldKey);
        if (!oldValues) return false;

        this.delete(oldKey);
        this.set(newKey, oldValues.keys());
        return true;
    }

    /** Clear the entire index. */
    public clear() {
        this.map.clear();
        this.inverse.clear();
    }

    static EMPTY: Readonly<Set<string>> = Object.freeze(new Set<string>());
}
