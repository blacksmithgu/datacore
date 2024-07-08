import { Literal, Literals } from "expression/literal";
import BTree from "sorted-btree";

/** General abstraction for all field indices; some may be optimized for some types. */
export interface FieldIndex {
    // TODO: Change all() and equals() to return Filter<string> instead for performance on some index types.

    /** Add an (object, value) pairing to the collection. */
    add(id: string, value: Literal): void;

    /** Delete an (object, value) pairing from the collection. */
    delete(id: string, value: Literal): void;

    /** Return a set of all pages in the collection. */
    all(): Set<string>;

    /** For indices which support fast value lookups, returns the set of all documents with the given value. */
    equals(value: Literal): Set<string> | undefined;
}

/** Field index for any field which is always or almost always present ($revision, $types). */
export class EverythingFieldIndex implements FieldIndex {
    public constructor(public all: () => Set<string>) {}

    public add(id: string, value: Literal): void {}
    public delete(id: string, value: Literal): void {}

    public equals(value: Literal): Set<string> | undefined {
        return undefined;
    }
}

/** Specialized field index for IDs which knows to directly just return the ID. */
export class IdFieldIndex implements FieldIndex {
    public constructor(public all: () => Set<string>, public lookup: (id: string) => boolean) {}

    public add(id: string, value: Literal): void {}
    public delete(id: string, value: Literal): void {}

    public equals(value: Literal): Set<string> | undefined {
        if (!Literals.isString(value)) return undefined;

        if (this.lookup(value as string)) {
            return new Set([value as string]);
        } else {
            return undefined;
        }
    }
}

/** Default field index which tracks field locations using a set. */
export class SetFieldIndex implements FieldIndex {
    /** The ID of every object that this field is present on. */
    private present: Set<string>;

    public constructor() {
        this.present = new Set();
    }

    /** Add an (object, value) pairing to the collection. */
    public add(id: string, value: Literal): void {
        this.present.add(id);
    }

    /** Delete an (object, value) pairing from the collection. */
    public delete(id: string, value: Literal): void {
        this.present.delete(id);
    }

    /** Return a set of all pages in which the field exists at all (even if undefined). */
    public all(): Set<string> {
        return this.present;
    }

    /** Return all pages with a value exactly equal to the given value. */
    public equals(value: Literal): Set<string> | undefined {
        return undefined;
    }
}

/** Field index which tracks field locations using both an overall set and a BTree of values. */
export class BTreeFieldIndex implements FieldIndex {
    /** The ID of every object that this field is present on. */
    private present: Set<string>;
    /** Maps (value, set of pages containing that value). */
    private values: BTree<Literal, Set<string>>;

    public constructor() {
        this.present = new Set();
        this.values = new BTree([], (a, b) => Literals.compare(a, b));
    }

    /** Add an (object, value) pairing to the collection. */
    public add(id: string, value: Literal): void {
        this.present.add(id);

        this.values.setIfNotPresent(value, new Set());
        this.values.get(value)!.add(id);
    }

    /** Delete an (object, value) pairing from the collection. */
    public delete(id: string, value: Literal): void {
        this.present.delete(id);

        const set = this.values.get(value);
        set?.delete(id);

        if (set == null || set.size == 0) {
            this.values.delete(value);
        }
    }

    /** Return a set of all pages in which the field exists at all (even if undefined). */
    public all(): Set<string> {
        return this.present;
    }

    /** Return all pages with a value exactly equal to the given value. */
    public equals(value: Literal): Set<string> | undefined {
        return this.values.get(value, BTreeFieldIndex.EMPTY_SET);
    }

    /** Placeholder empty set. */
    private static EMPTY_SET = new Set<string>();
}
