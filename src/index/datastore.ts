import { Literals } from "expression/literal";
import { Filter, Filters } from "index/storage/filters";
import { FolderIndex } from "index/storage/folder";
import { InvertedIndex } from "index/storage/inverted";
import { IndexPrimitive, IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { Vault } from "obsidian";

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
    /** Map parent object to it's direct child objects. */
    private children: Map<string, Set<string>>;

    // Indices for the various accepted query types. These will probably be moved to a different type later.
    /** Global map of object type -> list of all objects of that type. */
    private types: InvertedIndex<string>;
    /** Tracks exact tag occurence in objects. */
    private etags: InvertedIndex<string>;
    /** Tracks tag occurence in objects. */
    private tags: InvertedIndex<string>;
    /**
     * Quick searches for objects in folders. This index only tracks top-level objects - it is expanded recursively to
     * find child objects.
     */
    private folder: FolderIndex;

    public constructor(vault: Vault) {
        this.revision = 0;
        this.ids = new Set();
        this.objects = new Map();
        this.children = new Map();

        this.types = new InvertedIndex();
        this.etags = new InvertedIndex();
        this.tags = new InvertedIndex();
        this.folder = new FolderIndex(vault);
    }

    /** Update the revision of the datastore due to an external update. */
    public touch() {
        this.revision += 1;
    }

    /** Load an object by ID. */
    public load(id: string): Indexable | undefined;
    /** Load a list of objects by ID. */
    public load(ids: string[]): Indexable[];

    load(id: string | string[]): Indexable | Indexable[] | undefined {
        if (Array.isArray(id)) {
            return id.map((a) => this.load(a)).filter((obj): obj is Indexable => obj !== undefined);
        }

        return this.objects.get(id);
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
                this._recursiveStore(element, revision, substorer, parent);
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

        // Add the object to the parent children map.
        if (parent) {
            if (!this.children.has(parent)) this.children.set(parent, new Set());
            this.children.get(parent)!.add(object.$id);
        }

        this._index(object);

        // Index any subordinate objects in this object.
        substorer?.(object, (incoming, subindex) => this._recursiveStore(incoming, revision, subindex, object.$id));
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
        this._unindex(object);
        this.ids.delete(id);
        this.objects.delete(id);
        return true;
    }

    /** Add the given indexable to the appropriate indices. */
    private _index(object: Indexable) {
        this.types.set(object.$id, object.$types);

        if ("etags" in object && object.etags != undefined && Symbol.iterator in (object.etags as any)) {
            this.etags.set(object.$id, object.etags as Iterable<string>);
        }

        if ("tags" in object && object.tags != undefined && Symbol.iterator in (object.tags as any)) {
            this.tags.set(object.$id, object.tags as Iterable<string>);
        }
    }

    /** Remove the given indexable from all indices. */
    private _unindex(object: Indexable) {
        this.types.delete(object.$id, object.$types);

        if ("etags" in object && object.etags != undefined && Symbol.iterator in (object.etags as any)) {
            this.etags.delete(object.$id, object.etags as Iterable<string>);
        }

        if ("tags" in object && object.tags != undefined && Symbol.iterator in (object.tags as any)) {
            this.tags.delete(object.$id, object.tags as Iterable<string>);
        }
    }

    /** Completely clear the datastore of all values. */
    public clear() {
        this.ids.clear();
        this.objects.clear();
        this.children.clear();

        this.types.clear();
        this.tags.clear();
        this.etags.clear();

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
            case "not":
                return { type: "not", element: this._denest(query.element) };
            case "child-of":
                return { type: "child-of", parents: this._denest(query.parents) };
            case "parent-of":
                return { type: "parent-of", children: this._denest(query.children) };
            default:
                return query;
        }
    }

    /** Perform constant folding by eliminating dead 'true' and 'false' terms. */
    private _constantfold(query: IndexQuery): IndexQuery {
        switch (query.type) {
            case "and":
                const achildren = [] as IndexQuery[];
                for (const child of query.elements) {
                    const folded = this._constantfold(child);

                    // Eliminate 'true' constants and eliminate the entire and on a 'false' constant.
                    if (folded.type === "constant") {
                        if (folded.constant) continue;
                        else return { type: "constant", constant: false };
                    }

                    achildren.push(folded);
                }

                return { type: "and", elements: achildren };
            case "or":
                const ochildren = [] as IndexQuery[];
                for (const child of query.elements) {
                    const folded = this._constantfold(child);

                    // Eliminate 'false' constants and short circuit on a 'true' constant.
                    if (folded.type === "constant") {
                        if (!folded.constant) continue;
                        else return { type: "constant", constant: true };
                    }

                    ochildren.push(folded);
                }

                return { type: "or", elements: ochildren };
            case "not":
                const folded = this._constantfold(query.element);

                if (folded.type === "constant") {
                    return { type: "constant", constant: !folded.constant };
                }

                return { type: "not", element: folded };
            case "child-of":
                // parents = EMPTY means this will also be empty.
                const parents = this._constantfold(query.parents);
                if (parents.type === "constant") {
                    if (!parents.constant) return { type: "constant", constant: false };
                    else if (parents.constant && query.inclusive) return { type: "constant", constant: true };
                }

                return { type: "child-of", parents: parents, inclusive: query.inclusive };
            case "parent-of":
                // children = EMPTY means this will also be empty.
                const children = this._constantfold(query.children);
                if (children.type === "constant") {
                    if (!children.constant) return { type: "constant", constant: false };
                    else if (children.constant && query.inclusive) return { type: "constant", constant: true };
                }

                return { type: "parent-of", children: children, inclusive: query.inclusive };
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
            case "child-of":
                // TODO: This is an inefficient implementation and would benefit from "lazily-computed" filters.
                const parents = this._searchRecursive(query.parents);
                if (Filters.empty(parents)) {
                    return Filters.NOTHING;
                } else if (parents.type === "everything") {
                    if (query.inclusive) return Filters.EVERYTHING;

                    // Return the set all children. TODO: Consider caching via a `parents` map.
                    const allChildren = new Set<string>();
                    for (const element of this.objects.values()) {
                        if (element.$parent) allChildren.add(element.$id);
                    }

                    return Filters.atom(allChildren);
                }

                const resolvedParents = Filters.resolve(parents, this.ids);
                const childResults = new Set<string>(query.inclusive ? resolvedParents : []);

                for (const parent of resolvedParents) {
                    for (const child of this._iterateChildren(parent)) {
                        childResults.add(child);
                    }
                }

                return Filters.atom(childResults);
            case "parent-of":
                // TODO: This is an inefficient implementation and would benefit from "lazily-computed" filters.
                const children = this._searchRecursive(query.children);
                if (Filters.empty(children)) {
                    return Filters.NOTHING;
                } else if (children.type === "everything") {
                    if (query.inclusive) return Filters.EVERYTHING;

                    return Filters.atom(new Set(this.children.keys()));
                }

                const resolvedChildren = Filters.resolve(children, this.ids);
                const parentResults = new Set<string>(query.inclusive ? resolvedChildren : []);

                for (const child of resolvedChildren) {
                    for (const parent of this._iterateParents(child)) {
                        parentResults.add(parent);
                    }
                }

                return Filters.atom(parentResults);
            default:
                return this._searchPrimitive(query);
        }
    }

    /** Execute a primitive index query, i.e., a query that directly produces results. */
    private _searchPrimitive(query: IndexPrimitive): Filter<string> {
        switch (query.type) {
            case "constant":
                return Filters.constant(query.constant);
            case "id":
                const exactObject = this.objects.get(query.value);
                return exactObject ? Filters.atom(new Set([exactObject.$id])) : Filters.NOTHING;
            case "typed":
                return Filters.nullableAtom(this.types.get(query.value));
            case "tagged":
                if (query.exact) {
                    return Filters.nullableAtom(this.etags.get(query.value));
                } else {
                    return Filters.nullableAtom(this.tags.get(query.value));
                }
            case "folder":
                let toplevel;
                if (query.exact) {
                    toplevel = this.folder.getExact(query.value);
                } else {
                    if (query.value == "" || query.value == "/") return Filters.EVERYTHING;

                    toplevel = this.folder.get(query.value);
                }

                if (toplevel.size == 0) return Filters.NOTHING;

                // Expand all children.
                const result = new Set(toplevel);
                for (let top of toplevel) {
                    for (let child of this._iterateChildren(top)) {
                        result.add(child);
                    }
                }

                return Filters.atom(result);
            case "bounded-value":
            case "equal-value":
            case "field":
            case "connected":
                return Filters.NOTHING;
        }
    }

    /** Iterator which produces all parents of the given object. */
    private *_iterateParents(child: string): Generator<string> {
        let object = this.objects.get(child);
        while (object && object?.$parent) {
            yield object.$parent;
            object = this.objects.get(object.$parent);
        }
    }

    /** Iterative which produces all children (recursively) of the given object. */
    private *_iterateChildren(parent: string): Generator<string> {
        const children = this.children.get(parent);
        if (children && children.size > 0) {
            for (let child of children) {
                yield child;
                yield* this._iterateChildren(child);
            }
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
    /** Whether this is a  */
    loading?: boolean;
}
