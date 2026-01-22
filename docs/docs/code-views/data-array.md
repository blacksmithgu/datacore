---
title: Data Arrays
sidebar_label: Data Arrays
sidebar_position: 1000
---

To make common data manipulation operations simple, datacore provides the `DataArray` abstraction, which is a [proxied](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) wrapper around a regular list with a large set of additional functions.

## Creation

Data arrays are mainly present in two places.

### Via `dc.useArray`

The most common route for using data arrays is the `dc.useArray` hook, which takes in a regular array
of data, converts it to a data array, performs operations on it, and then converts it back to a regular array:

```js
return function View() {
    // Start with some data you want to process...
    const books = dc.useQuery("#books and @page");
    // Use `dc.useArray` to get a data array for processing.
    const groupedBooks = dc.useArray(books, array =>
        array.sort(book => book.$name)
             .groupBy(book => book.value("genre")));

    // Then render it.
    return <dc.List rows={groupedBooks} />;
}
```

### Via `dc.array`

You can also directly make `DataArray`s via the utility function `dc.array(data)`, which accepts a
regular array as input and produces a data array.

```js
return function View() {
    // da is a `DataArray`.
    const da = dc.array([1, 2, 3]);
    // da2 is still a `DataArray`.
    const da2 = da.map(x => x + 4).limit(2);

    // To get a regular array back, use `.array()`.
    const data = da2.array();
}
```

## Indexing and Swizzling

Data arrays support regular indexing just like normal arrays (like `array[0]`), but importantly, they also support
query-language-style "swizzling": if you index into a data array with a field name (like `array.field`), it
automatically maps every element in the array to `field`, flattening `field` if it itself is also an array.

```js
const data = dc.array(dc.query("#books and @page"));

data.$name // => List of all book names.
data.$ctime // => List of all book created times.
```

## Raw Interface

The full interface for the data array implementation is provided below for reference:

```ts
/** A function which maps an array element to some value. */
export type ArrayFunc<T, O> = (elem: T, index: number, arr: T[]) => O;

/** A function which compares two types. */
export type ArrayComparator<T> = (a: T, b: T) => number;

/**
 * Proxied interface which allows manipulating array-based data. All functions on a data array produce a NEW array
 * (i.e., the arrays are immutable).
 */
export interface DataArray<T> {
    /** The total number of elements in the array. */
    length: number;

    /** Filter the data array down to just elements which match the given predicate. */
    where(predicate: ArrayFunc<T, boolean>): DataArray<T>;
    /** Alias for 'where' for people who want array semantics. */
    filter(predicate: ArrayFunc<T, boolean>): DataArray<T>;

    /** Map elements in the data array by applying a function to each. */
    map<U>(f: ArrayFunc<T, U>): DataArray<U>;
    /** Map elements in the data array by applying a function to each, then flatten the results to produce a new array. */
    flatMap<U>(f: ArrayFunc<T, U[]>): DataArray<U>;
    /** Mutably change each value in the array, returning the same array which you can further chain off of. */
    mutate(f: ArrayFunc<T, any>): DataArray<any>;

    /** Limit the total number of entries in the array to the given value. */
    limit(count: number): DataArray<T>;
    /**
     * Take a slice of the array. If `start` is undefined, it is assumed to be 0; if `end` is undefined, it is assumed
     * to be the end of the array.
     */
    slice(start?: number, end?: number): DataArray<T>;
    /** Concatenate the values in this data array with those of another iterable / data array / array. */
    concat(other: Iterable<T>): DataArray<T>;

    /** Return the first index of the given (optionally starting the search) */
    indexOf(element: T, fromIndex?: number): number;
    /** Return the first element that satisfies the given predicate. */
    find(pred: ArrayFunc<T, boolean>): T | undefined;
    /** Find the index of the first element that satisfies the given predicate. Returns -1 if nothing was found. */
    findIndex(pred: ArrayFunc<T, boolean>, fromIndex?: number): number;
    /** Returns true if the array contains the given element, and false otherwise. */
    includes(element: T): boolean;

    /**
     * Return a string obtained by converting each element in the array to a string, and joining it with the
     * given separator (which defaults to ', ').
     */
    join(sep?: string): string;

    /**
     * Return a sorted array sorted by the given key; an optional comparator can be provided, which will
     * be used to compare the keys in leiu of the default dataview comparator.
     */
    sort<U>(key: ArrayFunc<T, U>, direction?: "asc" | "desc", comparator?: ArrayComparator<U>): DataArray<T>;

    /**
     * Return an array where elements are grouped by the given key; the resulting array will have objects of the form
     * { key: <key value>, rows: DataArray }.
     */
    groupBy<U>(key: ArrayFunc<T, U>, comparator?: ArrayComparator<U>): DataArray<{ key: U; rows: DataArray<T> }>;

    /**
     * Return distinct entries. If a key is provided, then rows with distinct keys are returned.
     */
    distinct<U>(key?: ArrayFunc<T, U>, comparator?: ArrayComparator<U>): DataArray<T>;

    /** Return true if the predicate is true for all values. */
    every(f: ArrayFunc<T, boolean>): boolean;
    /** Return true if the predicate is true for at least one value. */
    some(f: ArrayFunc<T, boolean>): boolean;
    /** Return true if the predicate is FALSE for all values. */
    none(f: ArrayFunc<T, boolean>): boolean;

    /** Return the first element in the data array. Returns undefined if the array is empty. */
    first(): T;
    /** Return the last element in the data array. Returns undefined if the array is empty. */
    last(): T;

    /** Map every element in this data array to the given key, and then flatten it.*/
    to(key: string): DataArray<any>;
    /**
     * Recursively expand the given key, flattening a tree structure based on the key into a flat array. Useful for handling
     * hierarchical data like tasks with 'subtasks'.
     */
    expand(key: string): DataArray<any>;

    /** Run a lambda on each element in the array. */
    forEach(f: ArrayFunc<T, void>): void;

    /** Convert this to a plain javascript array. */
    array(): T[];

    /** Allow iterating directly over the array. */
    [Symbol.iterator](): Iterator<T>;

    /** Map indexes to values. */
    [index: number]: any;
    /** Automatic flattening of fields. Equivalent to implicitly calling `array.to("field")` */
    [field: string]: any;
}
```
