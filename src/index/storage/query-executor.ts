//! Provides utilities for executing queries against the storage layer.
import { IndexQuery, IndexPrimitive } from "index/types/index-query";
import { Filter, Filters } from "expression/filters";
import { Result } from "api/result";
import { Expression, Expressions } from "expression/expression";
import { Evaluator } from "expression/evaluator";
import { Indexable } from "index/types/indexable";

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

    /** Resolve an index primitive (like "find all pages matching '#tag'") into a filter.  */
    resolve(leaf: IndexPrimitive): Filter<T>;

    /** Load a specific object if available. */
    load(id: T): Indexable | undefined;
}

/** Execute a query, using the given resolver to execute the leaf nodes. */
export function execute<T>(query: IndexQuery, resolver: IndexResolver<T>): Result<Filter<T>, string> {
    switch (query.type) {
        case "or":
            // Split into each sub-or element and union.
            // TODO: Move result handling into `Filters.lazyUnion` to simplify logic.
            const parts = [];
            for (const element of query.elements) {
                const result = execute(element, resolver);
                if (!result.successful) return result;

                if (result.value.type == "everything") return Result.success(Filters.EVERYTHING);
                else if (result.value.type == "nothing") continue;

                parts.push(result.value);
            }

            return Result.success(Filters.union(parts));
        case "and":

            break;
        case "not":
            // Negate result of subexecution.
            return execute(query.element, resolver).map(Filters.negate);
        case "expression":
            // Standalone expression (kind of unfortunate); extract out unbound fields and filter to just 
            // pages that have at least one relevant field.
            const candidates = Filters.resolve(hasVariables(query.expression, resolver), resolver.universe);

            return null;
        default:
            return Result.success(resolver.resolve(query));
    }
}

/** Scan over all candidate objects, returning objects for which the given expression resolves to true. */
export function filterScan<T>(candidates: Set<T>, expr: Expression, evaluator: Evaluator, resolver: IndexResolver<T>): Result<Set<T>, string> {
    const result = new Set<T>();
    for (const candidate of candidates) {
        const object = resolver.load(candidate);
        if (!object) continue;

        const value = evaluator.evaluate(expr, object as any);
        if (!value.successful) return value.cast();
        else result.add(candidate);
    }

    return Result.success(result);
}

/** Filters an expression to find pages that have the variables for that expression.  */
export function hasVariables<T>(expr: Expression, resolver: IndexResolver<T>): Filter<T> {
    const variables = Expressions.unboundVariables(expr);

    return Filters.lazyUnion(variables, (variable) => resolver.resolve({ type: "field", value: variable }));
}