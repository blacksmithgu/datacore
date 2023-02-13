import { Literals } from "expression/literal";
import { DatastoreQuery } from "index/types/index-query";
import { BimapIndex, Indexable } from "index/types/indexable";
import BTree from "sorted-btree";

/** Central, index storage for datacore values. */
export class Datastore {

    /** The current store revision. */
    private revision: number;
    /** The master collection of ALL indexed objects. */
    private objects: BTree<string, Indexable>;
    /** Global map of object type -> list of all objects of that type. */
    private types: Map<string, Set<string>>;
    /** Map parent object to ALL of it's child objects. */
    private children: Map<string, Set<string>>;

    public constructor() {
        this.revision = 0;
        this.objects = new BTree();
        this.types = new Map();
        this.children = new Map();
    }

    /** Index the given object, making it immediately queryable. */
    public index(object: Indexable | Indexable[]) {
        // Handle array inputs.
        if (Literals.isArray(object)) {
            for (let element of object) {
                this.index(element);
            }

            return;
        }

    }

    /**
     * Search the datastore using the given query, returning an iterator over results.
     * 
     * Datastore queries return (ordered) lists of results which match the given query.
     */
    public search(query: DatastoreQuery): Iterator<Indexable> {
        return [];
    }
}