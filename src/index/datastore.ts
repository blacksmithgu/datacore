import { Literals } from "expression/literal";
import { Filter, Filters } from "index/storage/filters";
import { IndexPrimitive, IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";

/** Central, index storage for datacore values. */
export class Datastore {
    /** The current store revision. */
    public revision: number;
    /**
     * Master collection of all object IDs. This is technically redundant with objects.keys() but this is a fast set
     * compared to an iterator.
     */
    private ids: Set<string>;
    /** The master collection of ALL indexed objects, mapping ID -> the object. */
    private objects: Map<string, Indexable>;
    /** Global map of object type -> list of all objects of that type. */
    private types: Map<string, Set<string>>;
    /** Map parent object to it's direct child objects. */
    private children: Map<string, Set<string>>;

    public constructor() {
        this.revision = 0;
        this.ids = new Set();
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
    public store<T extends Indexable>(object: T | T[], substorer?: Substorer<T>) {
        this._recursiveStore(object, this.revision++, substorer, undefined);
    }

    /** Recursively store objects using a potential subindexer. */
    private _recursiveStore<T extends Indexable>(
        object: T | T[],
        revision: number,
        substorer?: Substorer<T>,
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
        this.ids.add(object.$id);
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
        if (substorer) {
            substorer(object, (incoming, subindex) => {
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

        this.ids.delete(id);
        this.objects.delete(id);
        return true;
    }

    /** Completely clear the datastore of all values. */
    public clear() {
        this.ids.clear();
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

        const filter = this._searchRecursive(this._optimize(query));
        const result = Filters.resolve(filter, this.ids);

        const objects: Indexable[] = [];
        let maxRevision = 0;
        for (let id of result) {
            const object = this.objects.get(id);
            if (object) {
                objects.push(object);
                maxRevision = Math.max(maxRevision, object.$revision ?? 0);
            }
        }

        return {
            query: query,
            results: objects,
            duration: (Date.now() - start) / 1000.0,
            revision: maxRevision,
        };
    }

    /** Perform simple recursive optimizations over an index query, such as constant folding and de-nesting. */
    private _optimize(query: IndexQuery): IndexQuery {
        query = this._denest(query);
        query = this._constantfold(query);

        return query;
    }

    /** De-nest recursively nested AND and OR queries into a single top-level and/or. */
    private _denest(query: IndexQuery): IndexQuery {
        switch (query.type) {
            case "and":
                const ands = query.elements.flatMap((element) => {
                    const fixed = this._denest(element);
                    if (fixed.type === "and") return fixed.elements;
                    else return [fixed];
                });
                return { type: "and", elements: ands };
            case "or":
                const ors = query.elements.flatMap((element) => {
                    const fixed = this._denest(element);
                    if (fixed.type === "or") return fixed.elements;
                    else return [fixed];
                });
                return { type: "or", elements: ors };
            default:
                return query;
        }
    }

    /** Perform constant folding by eliminating dead 'true' and 'false' terms. */
    private _constantfold(query: IndexQuery): IndexQuery {
        switch (query.type) {
            case "and":
                const achildren = [] as IndexQuery[];
                for (let child of query.elements) {
                    // Eliminate 'true' constants and eliminate the entire and on a 'false' constant.
                    if (child.type === "constant") {
                        if (child.constant) continue;
                        else return { type: "constant", constant: false };
                    }

                    achildren.push(child);
                }

                return { type: "and", elements: achildren };
            case "or":
                const ochildren = [] as IndexQuery[];
                for (let child of query.elements) {
                    // Eliminate 'false' constants and short circuit on a 'true' constant.
                    if (child.type === "constant") {
                        if (!child.constant) continue;
                        else return { type: "constant", constant: true };
                    }

                    ochildren.push(child);
                }

                return { type: "or", elements: ochildren };
            case "not":
                if (query.element.type === "constant") {
                    return { type: "constant", constant: !query.element.constant };
                }

                return query;
            default:
                return query;
        }
    }

    /** Recursively execute a subquery, returning a set of all matching document IDs. */
    private _searchRecursive(query: IndexQuery): Filter<string> {
        switch (query.type) {
            case "and":
                // TODO: For efficiency, can order queries by probability of being empty.
                return Filters.lazyIntersect(query.elements, (elem) => this._searchRecursive(elem));
            case "or":
                // TODO: For efficiency, can order queries by probability of being EVERYTHING.
                return Filters.lazyUnion(query.elements, (elem) => this._searchRecursive(elem));
            case "not":
                return Filters.negate(this._searchRecursive(query.element));
            default:
                return this._searchPrimitive(query);
        }
    }

    /** Execute a primitive index query, i.e., a query that directly produces results. */
    private _searchPrimitive(query: IndexPrimitive): Filter<string> {
        switch (query.type) {
            case "constant":
                return Filters.constant(query.constant);
            case "typed":
                return Filters.nullableAtom(this.types.get(query.value));
            case "connected":
            case "folder":
            case "tagged":
            case "bounded-value":
            case "equal-value":
            case "field":
                return Filters.NOTHING;
        }
    }
}

/** A general function for storing sub-objects in a given object. */
export type Substorer<T extends Indexable> = (
    object: T,
    add: <U extends Indexable>(object: U | U[], subindex?: Substorer<U>) => void
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
