//! Provides utilities for executing queries against the storage layer.
import { IndexAnd, IndexQuery, IndexPrimitive, IndexOr } from "index/types/index-query";
import { Filter, Filters } from "./filters";

//////////////////////////////
// Index Query Optimization //
//////////////////////////////

/** Perform simple recursive optimizations over an index query, such as constant folding and de-nesting. */
export function optimizeQuery(query: IndexQuery): IndexQuery {
    query = denest(query);
    query = constantfold(query);

    return query;
}

/** De-nest recursively nested AND and OR queries into a single top-level and/or. */
function denest(query: IndexQuery): IndexQuery {
    switch (query.type) {
        case "and":
            const ands = query.elements.flatMap((element) => {
                const fixed = denest(element);
                if (fixed.type === "and") return fixed.elements;
                else return [fixed];
            });
            return { type: "and", elements: ands };
        case "or":
            const ors = query.elements.flatMap((element) => {
                const fixed = denest(element);
                if (fixed.type === "or") return fixed.elements;
                else return [fixed];
            });
            return { type: "or", elements: ors };
        case "not":
            return { type: "not", element: denest(query.element) };
        case "child-of":
            return Object.assign({}, query, { parents: denest(query.parents) });
        case "parent-of":
            return Object.assign({}, query, { children: denest(query.children) });
        case "linked":
            return Object.assign({}, query, { source: denest(query.source) });
        default:
            return query;
    }
}

/** Perform constant folding by eliminating dead 'true' and 'false' terms. */
function constantfold(query: IndexQuery): IndexQuery {
    switch (query.type) {
        case "and":
            const achildren = [] as IndexQuery[];
            for (const child of query.elements) {
                const folded = constantfold(child);

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
                const folded = constantfold(child);

                // Eliminate 'false' constants and short circuit on a 'true' constant.
                if (folded.type === "constant") {
                    if (!folded.constant) continue;
                    else return { type: "constant", constant: true };
                }

                ochildren.push(folded);
            }

            return { type: "or", elements: ochildren };
        case "not":
            const folded = constantfold(query.element);

            if (folded.type === "constant") {
                return { type: "constant", constant: !folded.constant };
            }

            return { type: "not", element: folded };
        case "child-of":
            // parents = EMPTY means this will also be empty.
            const parents = constantfold(query.parents);
            if (parents.type === "constant") {
                if (!parents.constant) return { type: "constant", constant: false };
                else if (parents.constant && query.inclusive) return { type: "constant", constant: true };
            }

            return Object.assign({}, query, { parents });
        case "parent-of":
            // children = EMPTY means this will also be empty.
            const children = constantfold(query.children);
            if (children.type === "constant") {
                if (!children.constant) return { type: "constant", constant: false };
                else if (children.constant && query.inclusive) return { type: "constant", constant: true };
            }

            return Object.assign({}, query, { children });
        case "linked":
            const source = constantfold(query.source);
            if (source.type === "constant") {
                if (!source.constant) return { type: "constant", constant: false };
                else if (source.constant && query.inclusive) return { type: "constant", constant: true };
            }

            return Object.assign({}, query, { source });
        default:
            return query;
    }
}

//////////////////
// Filter Trees //
//////////////////

export type And<T> = { type: "and"; elements: FilterTree<T>[] };
export type Or<T> = { type: "or"; elements: FilterTree<T>[] };
export type Not<T> = { type: "not"; element: FilterTree<T> };
export type Primitive<T> = { type: "primitive"; value: Filter<T> };
export type Scan<T> = { type: "scan"; relevant: Filter<T>; operation: (universe: Set<T>) => Set<T> };

/**
 * Filter trees represent a tree of sets combined by AND/OR/NOT; they allow for efficiently joining the entire tree
 * with the smallest number of operations possible.
 */
export type FilterTree<T> = And<T> | Or<T> | Not<T> | Primitive<T> | Scan<T>;

/** Provides utility functions for creating and evaluating filter trees. */
export namespace FilterTrees {
    export function and<T>(...elements: FilterTree<T>[]): And<T> {
        return { type: "and", elements };
    }

    export function or<T>(...elements: FilterTree<T>[]): Or<T> {
        return { type: "or", elements };
    }

    export function not<T>(element: FilterTree<T>): Not<T> {
        return { type: "not", element };
    }

    export function primitive<T>(value: Filter<T>): Primitive<T> {
        return { type: "primitive", value };
    }

    export function scan<T>(relevant: Filter<T>, operation: (universe: Set<T>) => Set<T>): Scan<T> {
        return { type: "scan", relevant, operation };
    }
}

//////////////////////////
// Index Query Executor //
//////////////////////////

/** Interface provided to the query executor to resolve query leaf nodes (like "find all pages matching '#tag'"). */
export interface IndexResolver<T> {
    /** The set of all possible objects. */
    universe: Set<T>;

    /**
     * Given an index primitive (anything that produces data), produce the data matching the primitive.
     *
     * This method is essentially responsible for resolving the "leaves" of a query (i.e., find all pages matching '#tag');
     * the query executor then handles efficiently computing the union and intersections of these leaves.
     */
    resolve(leaf: IndexPrimitive): Primitive<T> | Scan<T>;
}

/** Execute a query, using the given resolver to execute the leaf nodes. */
export function execute<T>(query: IndexQuery, resolver: IndexResolver<T>) {
    // Step 1: Convert the query into a filter tree consisting of scans and constants.
    const tree = constructTree(query, resolver);
    // Step 2: Resolve scans by providing the minimal set of relevant pages to each one.
    return resolveTree(tree, resolver.universe, []);
}

/**
 * Given the basic index query, iterate downwards and convert it into a filter tree. The filter tree will contain reduced constants
 * and scans only.
 */
export function constructTree<T>(query: IndexQuery, resolver: IndexResolver<T>): FilterTree<T> {
    switch (query.type) {
        case "and":
            return constructTreeAnd(query, resolver);
        case "or":
            return constructTreeOr(query, resolver);
        case "not":
            const child = constructTree(query.element, resolver);
            if (child.type === "primitive") return FilterTrees.primitive(Filters.negate(child.value));
            else if (child.type === "not") return child.element;

            return FilterTrees.not(child);
        default:
            // All remaining cases are index sources and their value can be obtained directly.
            // TODO: To be defensive, can make sure these trees are simplified (no nested ANDs, no double negations, no EVERYWHERE / NOWHERE, etc).
            return resolver.resolve(query);
    }
}

/** Resolve AND nodes in queries. */
function constructTreeAnd<T>(query: IndexAnd, resolver: IndexResolver<T>): FilterTree<T> {
    const complexes: FilterTree<T>[] = [];

    const primitive = Filters.lazyIntersect(query.elements, (element) => {
        const node = constructTree(element, resolver);
        if (node.type === "primitive") return node.value;
        else {
            complexes.push(node);
            return undefined;
        }
    });

    // A NOTHING in an AND will always yield nothing.
    if (primitive.type === "nothing") return FilterTrees.primitive(Filters.NOTHING);

    // Return the rest of the tree, only including the primitive if it is not EVERYTHING.
    return FilterTrees.and(
        ...(primitive.type === "everything" ? [] : [FilterTrees.primitive(primitive)]),
        ...complexes
    );
}

/** Resolve OR queries in queries. */
function constructTreeOr<T>(query: IndexOr, resolver: IndexResolver<T>): FilterTree<T> {
    const complexes: FilterTree<T>[] = [];

    const primitive = Filters.lazyUnion(query.elements, (element) => {
        const node = constructTree(element, resolver);
        if (node.type === "primitive") return node.value;
        else {
            complexes.push(node);
            return undefined;
        }
    });

    // EVERYTHING in OR means it will return everything.
    if (primitive.type === "everything") return FilterTrees.primitive(Filters.EVERYTHING);

    // Return the rest of the tree, only including the primitive if it is not NOTHING.
    return FilterTrees.and(...(primitive.type === "nothing" ? [] : [FilterTrees.primitive(primitive)]), ...complexes);
}

/**
 * Given a filter tree of scans and constants, constructs the set of objects to scan over for each scan and then resolves the tree to
 * a final result from the bottom -> top.
 *
 */
export function resolveTree<T>(tree: FilterTree<T>, universe: Set<T>, limits: Filter<T>[]): Filter<T> {
    switch (tree.type) {
        case "and":
            // The main optimization. Elements in ANDs can all count as limits for child elements.
            // Gather all primitives and add them to limits, then resolve each subtree and add that as a limit as well.
            let limit = Filters.intersect(
                [Filters.EVERYTHING as Filter<T>].concat(
                    tree.elements.filter((e): e is Primitive<T> => e.type === "primitive").map((e) => e.value)
                )
            );

            // TODO: Can directly feed scans into each other to reduce some set intersections as well.
            for (const element of tree.elements) {
                if (element.type === "primitive") continue;

                const resolved = resolveTree(element, universe, limits.concat([limit]));
                limit = Filters.intersect([limit, resolved]);
            }

            return limit;
        case "or":
            // There isn't much we can do to optimize ORs, so just resolve each element and union them.
            return Filters.union(tree.elements.map((element) => resolveTree(element, universe, limits)));
        case "scan":
            // Standalone scan; intersect the limits with the relevant objects on the scan.
            const galaxy = Filters.intersect(limits.concat([tree.relevant]));
            const elements = Filters.resolve(galaxy, universe);

            return Filters.atom(tree.operation(elements));
        case "not":
            return Filters.negate(resolveTree(tree.element, universe, limits));
        case "primitive":
            return tree.value;
    }
}
