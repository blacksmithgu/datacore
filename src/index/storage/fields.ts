import { Literal, Literals } from "expression/literal";
import BTree, { EmptyBTree } from "sorted-btree";

export class FieldIndex {
    /** The ID of every object that this field is present on. */
    private present: Set<string>;
    /** Maps (value, set of pages containing that value). */
    private values: BTree<Literal, Set<string>>;

    /**
     * @param indexValues If true, all values of the field will be tracked for fast comparison operations. Should
     * be generally conserved to highly-requested fields (like date, status, and completion).
     */
    public constructor(public indexValues: boolean = false) {
        this.present = new Set();
        this.values = new BTree([], (a, b) => Literals.compare(a, b));
    }

    /** Add an (object, value) pairing to the collection. */
    public add(id: string, value: Literal): void {
        this.present.add(id);

        if (this.indexValues) {
            this.values.setIfNotPresent(value, new Set());
            this.values.get(value)!.add(id);
        }
    }

    /** Delete an (object, value) pairing from the collection. */
    public delete(id: string, value: Literal): void {
        this.present.delete(id);

        if (this.indexValues) {
            const set = this.values.get(value);
            set?.delete(id);

            if (set == null || set.size == 0) {
                this.values.delete(value);
            }
        }
    }

    /** Return a set of all pages in which the field exists at all (even if undefined). */
    public all(): Set<string> {
        return this.present;
    }

    /** Return all pages whose values are in the given (min, max) bounds. */
    public range(min?: [Literal, boolean], max?: [Literal, boolean]): Set<string> | undefined {
        if (!this.indexValues) return undefined;

        // TODO: BTree is a bit annoying to implement arbitrary min/max, but this can speed up
        // range queries by a lot.
        return undefined;
    }

    /** Return all pages with a value exactly equal to the given value. */
    public equals(value: Literal): Set<string> | undefined {
        if (!this.indexValues) return undefined;

        return this.values.get(value, FieldIndex.EMPTY_SET);
    }

    /** Placeholder empty set. */
    private static EMPTY_SET = new Set<string>();
}
