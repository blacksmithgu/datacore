import { Result } from "api/result";

/** Static set element which matches everything. */
export type Everything = { type: "everything" };
/** Static set element which matches nothing. */
export type Nothing = { type: "nothing" };
/** Set which matches the negation of a set. */
export type Negated<T> = { type: "negated"; value: Set<T> };
/** Set which matches an actual set of values.  */
export type Atom<T> = { type: "atom"; value: Set<T> };

/** Abstract filter type which represents the results of applying filter operations to the data store. */
export type Filter<T> = Everything | Nothing | Atom<T> | Negated<T>;

/** Utility functions for efficiently operating on filters. */
export namespace Filters {
    /** Static filter which matches everything. */
    export const EVERYTHING: Everything = { type: "everything" };
    /** Static filter which matches nothing. */
    export const NOTHING: Nothing = { type: "nothing" };
    /** Empty set constant. */
    export const EMPTY_SET: Set<unknown> = new Set();

    /** Construct a new atom filter. */
    export function atom<T>(set: Set<T>): Filter<T> {
        if (set.size == 0) return NOTHING;

        return { type: "atom", value: set };
    }

    /** Construct a filter that matches everything or nothing. */
    export function constant<T>(value: boolean): Filter<T> {
        if (value) return EVERYTHING;
        else return NOTHING;
    }

    /** Construct a new atom filter which is NOTHING if set is undefined. */
    export function nullableAtom<T>(set: Set<T> | undefined): Filter<T> {
        return set !== undefined ? atom(set) : NOTHING;
    }

    /** Construct a negated atom filter. */
    export function negated<T>(set: Set<T>): Filter<T> {
        if (set.size == 0) return EVERYTHING;

        return { type: "negated", value: set };
    }

    /** Produces the negation of a filter. */
    export function negate<T>(filter: Filter<T>): Filter<T> {
        switch (filter.type) {
            case "everything":
                return NOTHING;
            case "nothing":
                return EVERYTHING;
            case "atom":
                return negated(filter.value);
            case "negated":
                return atom(filter.value);
        }
    }

    /** Determine if the given filter is definitively currently empty. */
    export function empty<T>(filter: Filter<T>): boolean {
        switch (filter.type) {
            case "everything":
                return false;
            case "negated":
                return false;
            case "atom":
                return filter.value.size == 0;
            case "nothing":
                return true;
        }
    }

    /** Resolve a top-level filter with the set of all available objects. */
    export function resolve<T>(filter: Filter<T>, everything: Set<T>): Set<T> {
        switch (filter.type) {
            case "everything":
                return everything;
            case "nothing":
                return EMPTY_SET as Set<T>;
            case "atom":
                return filter.value;
            case "negated":
                return setIntersectNegation(everything, filter.value);
        }
    }

    /** Intersect an iterable of filters. */
    export function intersect<T>(elements: Iterable<Filter<T>>): Filter<T> {
        return lazyIntersect(elements, (x) => x);
    }

    /** Intersect filters lazily, short-circuiting if the intersection would produce NOTHING. */
    export function lazyIntersect<I, T>(
        elements: Iterable<I>,
        produce: (input: I) => Filter<T> | undefined
    ): Filter<T> {
        return lazyFailableIntersection(elements, (x) => Result.success(produce(x))).orElseThrow();
    }

    /** Intersect filters lazily, short-circuiting if the intersection would produce NOTHING. */
    export function lazyFailableIntersection<I, T, E>(
        elements: Iterable<I>,
        produce: (input: I) => Result<Filter<T> | undefined, E>
    ): Result<Filter<T>, E> {
        const atoms: Set<T>[] = [];
        const negations: Set<T>[] = [];
        for (let element of elements) {
            const maybeFilter = produce(element);
            if (!maybeFilter.successful) return maybeFilter.cast();

            const filter = maybeFilter.value;
            if (filter === undefined) continue;

            // Empty filters will produce an empty intersection.
            if (empty(filter)) return Result.success(NOTHING);
            // EVERYTHING filters are redundant in ANDs, skip them.
            if (filter.type === "everything") continue;

            // Will only be left with atoms or negations.
            if (filter.type == "atom") atoms.push(filter.value);
            else if (filter.type == "negated") negations.push(filter.value);
        }

        // We start with something of the form a && b && !c && !d.
        // If no terms, then everything was EVERYTHING so return that.
        // If only atoms, just intersect them (a && b).
        // If only negations, then rewrite !c && !d => !(c || d) and return negated(c || d).
        // If both, compute x = (a && b) and y = (c || d), and then compute x && !y.

        if (atoms.length == 0 && negations.length == 0) {
            return Result.success(EVERYTHING);
        } else if (atoms.length > 0 && negations.length == 0) {
            return Result.success(atom(setIntersect(atoms)));
        } else if (atoms.length == 0 && negations.length > 0) {
            return Result.success(negated(setUnion(negations)));
        } else {
            return Result.success(Filters.atom(setIntersectNegation(setIntersect(atoms), setUnion(negations))));
        }
    }

    /** Union filters, producing a single result filter. */
    export function union<T>(filters: Iterable<Filter<T>>): Filter<T> {
        return lazyUnion(filters, (x) => x);
    }

    /** Union filters lazily, short-circuiting if the union would produce EVERYTHING. */
    export function lazyUnion<I, T>(elements: Iterable<I>, produce: (input: I) => Filter<T> | undefined): Filter<T> {
        return lazyFailableUnion(elements, (x) => Result.success(produce(x))).orElseThrow();
    }

    /** Union filters lazily, short-circuiting if the union would produce EVERYTHING. */
    export function lazyFailableUnion<I, T, E>(
        elements: Iterable<I>,
        produce: (input: I) => Result<Filter<T> | undefined, E>
    ): Result<Filter<T>, E> {
        const atoms: Set<T>[] = [];
        const negations: Set<T>[] = [];
        for (let element of elements) {
            const maybeFilter = produce(element);
            if (!maybeFilter.successful) return maybeFilter.cast();

            const filter = maybeFilter.value;
            if (filter === undefined) continue;

            // EVERYTHING filters will produce everything always.
            if (filter.type === "everything") return Result.success(EVERYTHING);
            // Empty filters are redundant.
            if (empty(filter)) continue;

            // Will only be left with atoms or negations.
            if (filter.type == "atom") atoms.push(filter.value);
            else if (filter.type == "negated") negations.push(filter.value);
        }

        // Or is a bit harder than AND since you can end up with scenarios like a || !b, which are
        // not computable directly. However, we can do boolean logic to always produce a single
        // set.
        // If nothing => nothing, no non-empty filters.
        // If atoms but no negations (a || b || c) => compute union.
        // If negations but no atoms (!a || !b || !c) => rewrite as !(a && b && c).
        // If both: (a || b || !c || !d) => combine each part into (a || b) || (!c || !d) => (a || b) || !(c && d) => e || !f => !(!e && f) which
        // can be computed using intersection logic.

        if (atoms.length == 0 && negations.length == 0) {
            return Result.success(NOTHING);
        } else if (atoms.length > 0 && negations.length == 0) {
            return Result.success(Filters.atom(setUnion(atoms)));
        } else if (atoms.length == 0 && negations.length > 0) {
            return Result.success(Filters.negated(setIntersect(negations)));
        } else {
            return Result.success(negated(setIntersectNegation(setIntersect(negations), setUnion(atoms))));
        }
    }

    /** Efficiently compute the intersection of sets. */
    export function setIntersect<T>(sets: Set<T>[]): Set<T> {
        if (sets.length == 0) return new Set();
        else if (sets.length == 1) return sets[0];

        // Sort by size and combine smallest and largest set repeatedly.
        let sorted = ([] as Set<T>[]).concat(sets).sort((a, b) => a.size - b.size);

        while (sorted.length > 1) {
            const result = new Set<T>();
            const largest = sorted.pop()!;

            for (let element of sorted[0]) {
                if (largest.has(element)) result.add(element);
            }

            sorted[0] = result;
        }

        return sorted[0];
    }

    /** Efficiently compute the union of sets. */
    export function setUnion<T>(sets: Set<T>[]): Set<T> {
        if (sets.length == 0) return new Set();
        else if (sets.length == 1) return sets[0];

        // I'm not sure if there is any useful optimization for set unions, so just add them all I guess.
        const result = new Set<T>();
        for (const set of sets) {
            for (const element of set) {
                result.add(element);
            }
        }

        return result;
    }

    /** Efficiently compute atom && !negated. */
    export function setIntersectNegation<T>(atom: Set<T>, negated: Set<T>): Set<T> {
        if (atom.size > negated.size) {
            // TODO: Would be nice to avoid the copy, since I'm not sure it's any faster with the copy.
            const result = new Set(atom);
            for (let element of negated) {
                result.delete(element);
            }

            return result;
        } /* atom.size < negation.size */ else {
            const result = new Set<T>();
            for (let element of atom) {
                if (negated.has(element)) continue;
                result.add(element);
            }

            return result;
        }
    }
}
