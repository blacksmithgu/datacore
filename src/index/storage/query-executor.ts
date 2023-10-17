//! Provides utilities for executing queries against the storage layer.
import { IndexPrimitive, IndexQuery, IndexSource } from "index/types/index-query";
import { Filter, Filters } from "expression/filters";
import { Result } from "api/result";
import { Expression, Expressions } from "expression/expression";
import { Evaluator, Variables } from "expression/evaluator";
import { Indexable } from "index/types/indexable";
import { Literals } from "expression/literal";

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

//////////////////////////
// Index Query Executor //
//////////////////////////

/** Interface provided to the query executor to resolve query leaf nodes (like "find all pages matching '#tag'"). */
export interface IndexResolver<T> {
    /** The set of all possible objects. */
    universe: Set<T>;

    /** Resolve an arbitrary index source (like "find all pages matching '#tag'") into a filter.  */
    resolve(leaf: IndexSource): Result<Filter<T>, string>;

    /** Resolve an index primitive, which is garaunteed to never raise an exception. */
    resolvePrimitive(leaf: IndexPrimitive): Filter<T>;

    /** Load a specific object if available. */
    load(id: T): Indexable | undefined;
}

/** Execute a query, using the given resolver to execute the leaf nodes and the given evaluator to resolve expressions. */
export function execute<T>(
    query: IndexQuery,
    resolver: IndexResolver<T>,
    evaluator: Evaluator
): Result<Filter<T>, string> {
    return simplify(query, resolver).flatMap((tree) => collapse(tree, resolver, evaluator));
}

/** Simplify a tree, combining primitives in ANDs/ORs. */
export function simplify<T>(query: IndexQuery, resolver: IndexResolver<T>): Result<FilterTree<T>, string> {
    switch (query.type) {
        case "and":
            // TODO: Early return on a NOTHING inside the mapAll loop.
            return Result.mapAll(query.elements, (child) => simplify(child, resolver)).map((elements) => {
                const flattened = elements.flatMap((element) =>
                    element.type === "and" ? element.elements : [element]
                );

                const other: FilterTree<T>[] = [];
                const primitive = Filters.lazyIntersect(flattened, (element) => {
                    if (element.type === "filter") return element.filter;
                    else {
                        other.push(element);
                        return undefined;
                    }
                });

                // Early return on NOTHING (nothing will match), and skip on NOTHING.
                if (primitive.type === "nothing") return { type: "filter", filter: Filters.NOTHING };
                else if (primitive.type != "everything") other.push(FilterTrees.filter(primitive));

                return FilterTrees.and(other);
            });
        case "or":
            return Result.mapAll(query.elements, (child) => simplify(child, resolver)).map((elements) => {
                const flattened = elements.flatMap((element) => (element.type === "or" ? element.elements : [element]));

                const other: FilterTree<T>[] = [];
                const primitive = Filters.lazyUnion(flattened, (element) => {
                    if (element.type === "filter") return element.filter;
                    else {
                        other.push(element);
                        return undefined;
                    }
                });

                // Early return on EVERYTHING (all will match), and skip on NOTHING.
                if (primitive.type === "everything") return { type: "filter", filter: Filters.EVERYTHING };
                else if (primitive.type != "nothing") other.push(FilterTrees.filter(primitive));

                return FilterTrees.or(other);
            });
        case "not":
            return simplify(query.element, resolver).map(FilterTrees.not);
        case "expression":
            const candidates = hasVariables(query.expression, resolver);
            return Result.success({ type: "scan", candidates, expression: query.expression });
        default:
            return resolver.resolve(query).map((filter) => ({ type: "filter", filter }));
    }
}

/** Collapse a filter tree by evaluating all scans with the appropriate context. */
export function collapse<T>(
    tree: FilterTree<T>,
    resolver: IndexResolver<T>,
    evaluator: Evaluator,
    limit: Filter<T> = Filters.EVERYTHING
): Result<Filter<T>, string> {
    switch (tree.type) {
        case "or":
            return Filters.lazyFailableUnion(tree.elements, (element) => collapse(element, resolver, evaluator, limit));
        case "and":
            const primitives = tree.elements
                .filter((elem): elem is { type: "filter"; filter: Filter<T> } => elem.type === "filter")
                .map((f) => f.filter);
            let restrictedLimit = Filters.intersect([limit, ...primitives]);

            for (const element of tree.elements) {
                if (element.type === "filter") continue; // Already in the intersection.

                const maybeEvaluated = collapse(element, resolver, evaluator, restrictedLimit);
                if (!maybeEvaluated.successful) return maybeEvaluated.cast();

                const evaluated = maybeEvaluated.value;
                restrictedLimit = Filters.intersect([restrictedLimit, evaluated]);

                if (restrictedLimit.type === "nothing") return Result.success(Filters.NOTHING);
            }

            return Result.success(restrictedLimit);
        case "not":
            return collapse(tree.element, resolver, evaluator, limit).map(Filters.negate);
        case "filter":
            return Result.success(tree.filter);
        case "scan":
            // Local tree candidates + existing limit to produce the minimal set of candidates.
            const candidates = Filters.resolve(Filters.intersect([tree.candidates, limit]), resolver.universe);
            return filterScan(candidates, tree.expression, evaluator, resolver).map(Filters.atom);
    }
}

/** Scan over all candidate objects, returning objects for which the given expression resolves to true. */
export function filterScan<T>(
    candidates: Set<T>,
    expr: Expression,
    evaluator: Evaluator,
    resolver: IndexResolver<T>
): Result<Set<T>, string> {
    const result = new Set<T>();
    for (const candidate of candidates) {
        const object = resolver.load(candidate);
        if (!object) continue;

        const value = evaluator.evaluate(expr, Variables.infer(object));
        if (!value.successful) {
            return Result.failure(`Error while evaluating expression "${Expressions.toString(expr)}": ${value.error}`);
        } else {
            if (Literals.isTruthy(value.value)) result.add(candidate);
        }
    }

    return Result.success(result);
}

/** Filters an expression to find pages that have the variables for that expression.  */
export function hasVariables<T>(expr: Expression, resolver: IndexResolver<T>): Filter<T> {
    const variables = Expressions.unboundVariables(expr, new Set([Expressions.ROW, "this"]));

    // variables = 0 impliess some weird function or constant expression.
    // TODO: we can probably evaluate it without even scanning to `true` or `false` but to be defensive have to return everything for now.
    if (variables.size == 0) return Filters.EVERYTHING;

    return Filters.lazyUnion(variables, (variable) => resolver.resolvePrimitive({ type: "field", value: variable }));
}

//////////////////
// Filter Trees //
//////////////////

export type FilterTree<T> =
    | { type: "and"; elements: FilterTree<T>[] }
    | { type: "or"; elements: FilterTree<T>[] }
    | { type: "not"; element: FilterTree<T> }
    | { type: "filter"; filter: Filter<T> }
    | { type: "scan"; candidates: Filter<T>; expression: Expression };

export namespace FilterTrees {
    export function filter<T>(filter: Filter<T>): FilterTree<T> {
        return { type: "filter", filter };
    }

    export function and<T>(children: FilterTree<T>[]): FilterTree<T> {
        if (children.length == 0) return filter(Filters.EVERYTHING);
        else if (children.length == 1) return children[0];
        else return { type: "and", elements: children };
    }

    export function or<T>(children: FilterTree<T>[]): FilterTree<T> {
        if (children.length == 0) return filter(Filters.NOTHING);
        else if (children.length == 1) return children[0];
        else return { type: "or", elements: children };
    }

    export function not<T>(child: FilterTree<T>): FilterTree<T> {
        if (child.type === "filter") return { type: "filter", filter: Filters.negate(child.filter) };
        else return { type: "not", element: child };
    }
}
