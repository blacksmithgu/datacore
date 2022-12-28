import { Literal, Literals } from "./literal";

/** A grouping on a type which supports recursively-nested groups. */
export type GroupElement<T> = { key: Literal; rows: Grouping<T> };
/** A grouping on a type which supports recursively-nested groups. */
export type Grouping<T> = T[] | GroupElement<T>[];

export namespace Groupings {
    /** Determines if the given group entry is of the form { key: ..., rows: [...] }. */
    export function isElementGroup<T>(entry: T | GroupElement<T>): entry is GroupElement<T> {
        return Literals.isObject(entry) && Object.keys(entry).length == 2 && "key" in entry && "rows" in entry;
    }

    /** Determines if the given array is a list of groupings. */
    export function isGrouping<T>(entry: Grouping<T>): entry is GroupElement<T>[] {
        for (let element of entry) if (!isElementGroup(element)) return false;

        return true;
    }

    /** Count the total number of elements in a recursive grouping. */
    export function count<T>(elements: Grouping<T>): number {
        let result = 0;
        for (let element of elements) {
            if (isElementGroup(element)) result += count(element.rows);
            else result += 1;
        }

        return result;
    }
}
