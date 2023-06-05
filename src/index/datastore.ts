import { Literals } from "expression/literal";
import { intersect } from "index/storage/sets";
import { IndexPrimitive, IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";

/** Central, index storage for datacore values. */
export class Datastore {
    /** The current store revision. */
    public revision: number;
    /** The master collection of ALL indexed objects, mapping ID -> the object. */
    private objects: Map<string, Indexable>;
    /** Global map of object type -> list of all objects of that type. */
    private types: Map<string, Set<string>>;
    /** Map parent object to it's direct child objects. */
    private children: Map<string, Set<string>>;

    public constructor() {
        this.revision = 0;
        this.objects = new Map();
        this.types = new Map();
        this.children = new Map();
    }

    /** Update the revision of the datastore due to an external update. */
    public touch() {
        this.revision += 1;
    }

    /** Load an object by ID. */
    public load(id: string): Indexable;
    /** Load a list of objects by ID. */
    public load(ids: string[]): Indexable[];

    load(id: string | string[]): Indexable | Indexable[] | undefined {
        if (Array.isArray(id)) {
            return id.map((a) => this.load(a)).filter((obj) => obj !== undefined);
        }

        return this.objects.get(id);
    }

    /** Returns the current set of all indexed types. */
    public availableTypes(): Set<string> {
        return new Set(this.types.keys());
    }

    /**
     * Store the given object, making it immediately queryable. Storing an object
     * takes ownership over it, and index-specific variables (prefixed via '$') may be
     * added to the object.
     */
    public store<T extends Indexable>(object: T | T[], subindexer?: Subindexer<T>) {
        this._recursiveStore(object, this.revision++, subindexer, undefined);
    }

    /** Recursively store objects using a potential subindexer. */
    private _recursiveStore<T extends Indexable>(
        object: T | T[],
        revision: number,
        subindexer?: Subindexer<T>,
        parent?: string
    ) {
        // Handle array inputs.
        if (Literals.isArray(object)) {
            for (let element of object) {
                this.store(element);
            }

            return;
        }

        // Delete the previous instance of this object if present.
        // TODO: Probably only actually need to delete the root objects.
        this._deleteRecursive(object.$id);

        // Assign the next revision to this object; indexed objects are implied to be root objects.
        object.$revision = revision;
        object.$parent = parent;

        // Add the object to the appropriate object maps.
        this.objects.set(object.$id, object);
        for (let type of object.$types) {
            if (!this.types.has(type)) this.types.set(type, new Set());

            this.types.get(type)?.add(object.$id);
        }

        // Add the object to the parent children map.
        if (parent) {
            if (!this.children.has(parent)) this.children.set(parent, new Set());
            this.children.get(parent)?.add(object.$id);
        }

        // Index any subordinate objects in this object.
        if (subindexer) {
            subindexer(object, (incoming, subindex) => {
                if (Literals.isArray(incoming)) {
                    for (let element of incoming) {
                        this._recursiveStore(element, revision, subindex, object.$id);
                    }
                } else {
                    this._recursiveStore(incoming, revision, subindex, object.$id);
                }
            });
        }
    }

    /** Delete an object by ID from the index, recursively deleting any child objects as well. */
    public delete(id: string): boolean {
        if (this._deleteRecursive(id)) {
            this.revision++;
            return true;
        }

        return false;
    }

    /** Internal method that does not bump the revision. */
    private _deleteRecursive(id: string): boolean {
        const object = this.objects.get(id);
        if (!object) {
            return false;
        }

        // Recursively delete all child objects.
        const children = this.children.get(id);
        if (children) {
            for (let child of children) {
                this._deleteRecursive(child);
            }

            this.children.delete(id);
        }

        // Drop this object from the appropriate maps.
        for (let type of object.$types) {
            this.types.get(type)?.delete(id);
        }

        this.objects.delete(id);
        return true;
    }

    /** Completely clear the datastore of all values. */
    public clear() {
        this.objects.clear();
        this.types.clear();
        this.children.clear();

        this.revision++;
    }

    /**
     * Search the datastore for all documents matching the given query, returning them
     * as a list of indexed objects along with performance metadata.
     */
    public search(query: IndexQuery): SearchResult<Indexable> {
        const start = Date.now();

        return {
            query: query,
            results: [],
            duration: (Date.now() - start) / 1000.0,
            revision: 0,
        };
    }

    /** Recursively execute a subquery, returning a set of all matching document IDs. */
    private _searchRecursive(query: IndexQuery): Set<string> {
        switch (query.type) {
            case "and":
                const subsets: Set<string>[] = [];
                for (let child of query.elements) {
                    const results = this._searchRecursive(child);
                    if (results.size == 0) return Datastore.EMPTY_SET;
                }

                return intersect(subsets);
            case "constant":
            case "not":
            case "or":
                // TODO.
                return Datastore.EMPTY_SET;
            case "connected":
            case "folder":
            case "tagged":
            case "typed":
                return this._searchPrimitive(query);
        }
    }

    /** Execute a primitive index query, i.e., a query that directly produces results. */
    private _searchPrimitive(query: IndexPrimitive): Set<string> {
        switch (query.type) {
            case "connected":
            case "folder":
            case "tagged":
            case "typed":
                return Datastore.EMPTY_SET;
        }
    }

    /** Static empty set used for efficiently returning empty sets. */
    private static EMPTY_SET: Set<string> = Object.freeze(new Set()) as Set<string>;
}

/** A general function for indexing sub-objects in a given object. */
export type Subindexer<T extends Indexable> = (
    object: T,
    add: <U extends Indexable>(object: U | U[], subindex?: Subindexer<U>) => void
) => void;

/** The result of searching given an index query. */
export interface SearchResult<O> {
    /** The query used to search. */
    query: IndexQuery;
    /** All of the returned results. */
    results: O[];
    /** The amount of time in seconds that the search took. */
    duration: number;
    /** The maximum revision of any document in the result, which is useful for diffing. */
    revision: number;
}
