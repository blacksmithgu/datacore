/** Efficiently intersect any number of sets by intersecting the smallest one first. */
export function intersect<T>(sets: Set<T>[]): Set<T> {
    if (sets.length == 0) return new Set();
    else if (sets.length == 1) return sets[0];

    let sorted = ([] as Set<T>[]).concat(sets).sort((a, b) => a.size - b.size);

    const result = new Set<T>();
    outer: for (let element of sorted[0]) {
        for (let index = 1; index < sorted.length; index++) {
            if (!sorted[index].has(element)) continue outer;
        }

        result.add(element);
    }

    return result;
}

/** Efficiently compute the union of two sets. */
export function union<T>(first: Set<T>, second: Set<T>) {}
