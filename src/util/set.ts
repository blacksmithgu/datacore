import BTree, { ISortedSet, asSet } from "sorted-btree";

/** Create a new sorted set with a backing BTree. */
export function newSortedSet<T>(initial?: Iterable<T>): ISortedSet<T> {
    const set = asSet(new BTree<T, undefined>());

    if (initial) {
        for (const element of initial) {
            set.add(element);
        }
    }

    return set;
}
