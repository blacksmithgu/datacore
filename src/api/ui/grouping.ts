import { ArrayComparator, DataArray } from "api/data-array";
import { Literal } from "expression/literal";

/** A list of { key, value } grouped pairs. */
export interface Grouped<V> {
    type: "grouped";
    /** Whether this group was generated via flattening keys. */
    flattened: boolean;
    /** A list of (key, subvalue) grouped pairs. */
    elements: {
        /** The common key shared by all values in this group. */
        key: Literal;
        /** The total number of elements in this group / subgroups. */
        size: number;
        /** The elements in the group. */
        value: Grouping<V>;
    }[];
}

/** A leaf node of a grouping. */
export interface Leaf<V> {
    type: "leaf";
    /** The raw elements in this leaf node. */
    elements: V[];
}

/** A typed grouping used in visual UIs. */
export type Grouping<V> = Grouped<V> | Leaf<V>;

export namespace Grouping {
    /** Create a leaf grouping. */
    export function leaf<T>(rows: T[]): Grouping<T> {
        return {
            type: "leaf",
            elements: rows,
        };
    }

    /** Group a set of rows recursively by a list of grouping columns. */
    export function groupBy<T>(
        rows: T[],
        groupOn: { value: (v: T) => Literal; comparator?: ArrayComparator<Literal>; flatten?: boolean }[]
    ): Grouping<T> {
        if (groupOn.length == 0) return leaf(rows);

        const { value, comparator, flatten } = groupOn[0];
        return {
            type: "grouped",
            flattened: flatten ?? false,
            elements: flatten
                ? DataArray.from(rows)
                      .flatMap((raw) => flattened(value(raw)).map((val) => ({ key: val, row: raw })))
                      .groupBy((raw) => raw.key, comparator)
                      .map((group) => ({
                          key: group.key,
                          value: groupBy(
                              group.rows.map((g) => g.row),
                              groupOn.slice(1)
                          ),
                          size: group.rows.length,
                      }))
                      .array()
                : DataArray.from(rows)
                      .groupBy(value, comparator)
                      .map((group) => ({
                          key: group.key,
                          value: groupBy(group.rows, groupOn.slice(1)),
                          size: group.rows.length,
                      }))
                      .array(),
        };
    }

    /** Recursively slice a grouping, returning the grouping containing the absolute elements [start..end]. */
    export function slice<T>(grouping: Grouping<T>, start: number, end: number): Grouping<T> {
        if (end <= start) return leaf([]);
        if (grouping.type == "leaf") return leaf(grouping.elements.slice(start, end));

        // Find the first group that contains index `start`.
        let index = 0;
        let seen = 0;
        while (index < grouping.elements.length && seen + grouping.elements[index].size <= start) {
            seen += grouping.elements[index].size;
            index++;
        }

        // start was greater than the entire length of the groupings.
        if (index >= grouping.elements.length) return leaf([]);

        const result: Grouped<T>["elements"] = [];
        while (index < grouping.elements.length && seen < end) {
            const group = grouping.elements[index];
            const groupStart = Math.max(seen, start);
            const groupEnd = Math.min(group.size + seen, end);

            result.push({
                key: group.key,
                size: groupEnd - groupStart,
                value: slice(group.value, groupStart - seen, groupEnd - seen),
            });

            seen += group.size;
            index++;
        }

        return { type: "grouped", flattened: grouping.flattened, elements: result };
    }

    // TODO: Multi-level flattening potentially.
    function flattened(data: Literal): Literal[] {
        if (Symbol.iterator in (data as any)) {
            if (Array.isArray(data)) return data;

            return Array.from(data as Iterable<any>);
        }

        return [data];
    }
}
