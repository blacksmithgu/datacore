/** Tracks an inverted index of value -> set<ids>. */
export class InvertedIndex<V> {
    private inverted: Map<V, Set<string>>;

    public constructor() {
        this.inverted = new Map();
    }

    /** Set the key to the given values. */
    public set(key: string, values: Iterable<V>) {
        for (let value of values) {
            if (!this.inverted.has(value)) this.inverted.set(value, new Set());
            this.inverted.get(value)!.add(key);
        }
    }

    /** Get all keys that map to the given value. */
    public get(value: V): Set<string> {
        return this.inverted.get(value) ?? InvertedIndex.EMPTY_SET;
    }

    /** Delete a key from the set of associated values. */
    public delete(key: string, values: Iterable<V>) {
        for (let value of values) {
            const set = this.inverted.get(value);
            if (set) {
                set.delete(key);
            }

            if (set && set.size == 0) {
                this.inverted.delete(value);
            }
        }
    }

    public clear() {
        this.inverted.clear();
    }

    private static EMPTY_SET: Set<string> = new Set();
}
