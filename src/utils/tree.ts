
import { SortDirection } from "api/ui/views/table";
import { GroupElement, Grouping, Groupings, Literal } from "expression/literal";

export interface TreeTableRowData<T> {
    value: T;
    children: TreeTableRowData<T>[];
}
export namespace TreeUtils {
    export function isTreeTableRowData<T>(data: any): data is TreeTableRowData<T> {
        return (
            "children" in data &&
            "value" in data &&
            !Array.isArray(data) &&
            Object.keys(data).length == 2 &&
            Array.isArray(data.children)
        );
    }
    export function countInTreeRow<T>(node: TreeTableRowData<T>, top: boolean = true): number {
        let result = 0;
        if (!top) result++;
        for (let n of node.children) result += countInTreeRow(n, false);
        return result;
    }
    export function ofArray<T>(source: T[], childFn: (el: T) => T[]): TreeTableRowData<T>[] {
        const mapper = (el: T): TreeTableRowData<T> => {
            return {
                value: el,
                children: childFn(el).map(mapper),
            } as TreeTableRowData<T>;
        };
        return source.map(mapper);
    }
    export function ofNode<T>(source: T, childFn: (el: T) => T[]): TreeTableRowData<T> {
        return {
            value: source,
            children: ofArray(childFn(source), childFn),
        };
    }

    export function ofGrouping<T>(elements: Grouping<T>, childFn: (el: T) => T[]): Grouping<TreeTableRowData<T>> {
        const mapper = (l: T | GroupElement<T>): GroupElement<TreeTableRowData<T>> | TreeTableRowData<T> => {
            if (Groupings.isElementGroup(l))
                return { key: l.key, rows: l.rows.map(mapper) } as GroupElement<TreeTableRowData<T>>;
            return {
                value: l,
                children: childFn(l).map(mapper),
            } as TreeTableRowData<T>;
        };
        return elements.map(mapper) as Grouping<TreeTableRowData<T>>;
    }

    export function count<T>(elements: Grouping<TreeTableRowData<T>> | GroupElement<TreeTableRowData<T>>): number {
        if (Groupings.isElementGroup(elements)) {
            return count(elements.rows);
        } else if (Groupings.isGrouping(elements)) {
            let result = 0;
            for (let group of elements) result += count(group.rows);
            return result;
        } else {
            return elements.reduce((pv, cv) => pv + countInTreeRow(cv), 0);
        }
    }

    export function slice<T>(
        elements: Grouping<TreeTableRowData<T>>,
        start: number,
        end: number
    ): Grouping<TreeTableRowData<T>> {
        let initial = [...Groupings.slice(elements, start, end)] as Grouping<TreeTableRowData<T>>;
        let index = 0,
            seen = 0;

        for (let element of initial) {
            if (Groupings.isElementGroup(element)) {
                let groupSize = Groupings.count(elements);
                let groupStart = Math.min(seen, start);
                let groupEnd = Math.min(groupSize, end);
                (initial[index] as GroupElement<TreeTableRowData<T>>).rows = Groupings.slice(
                    element.rows,
                    groupStart,
                    groupEnd
                );
                seen += groupSize;
            } else {
                seen += countInTreeRow(element);
            }
            index++;
        }
        return initial;
    }
    /** recursively sort a tree */
    export function sort<T, V = Literal>(
        rows: (TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>)[],
        comparators: {
            fn: (a: V, b: V, ao: T, ab: T) => number;
            direction: SortDirection;
            actualValue: (obj: T) => V;
        }[]
    ): (TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>)[] {
        const realComparator = (
            a: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>,
            b: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>
        ): number => {
            for (let comp of comparators) {
                const direction = comp.direction.toLocaleLowerCase() === "ascending" ? 1 : -1;
                let result = 0;
                if (Groupings.isElementGroup(a) && Groupings.isElementGroup(b)) {
                    result = 0;
                } else if (!Groupings.isElementGroup(a) && !Groupings.isElementGroup(b)) {
                    result =
                        direction * comp.fn(comp.actualValue(a.value), comp.actualValue(b.value), a.value, b.value);
                }
                if (result != 0) return result;
            }
            return 0;
        };
        const map = (
            t: TreeTableRowData<T> | GroupElement<TreeTableRowData<T>>
        ): TreeTableRowData<T> | GroupElement<TreeTableRowData<T>> => {
            let r;
            if (Groupings.isElementGroup(t))
                r = { ...t, rows: sort(t.rows, comparators).map(map) } as GroupElement<TreeTableRowData<T>>;
            else r = { ...t, children: sort(t.children, comparators).map(map) } as TreeTableRowData<T>;
            return r;
        };
        return rows.map(map).sort(realComparator);
    }
}
