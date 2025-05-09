---
title: Codeblock API
sidebar_label: Codeblock API
sidebar_position: 100
---

Datacore views are built around the datacore codeblock (also known as "local") API, which is available in any datacore
codeblock as `dc`. The codeblock API provides access to a large number of useful utility functions and components with
which you can build our more complicated views.

Datacore codeblocks are built on React, so the basic structure of any codeblock will generally look like:

~~~
```datacorejsx
// Return a react functional component which renders your view.
return function View() {
    // Call functions on the datacore API, 'dc'.
    const data = dc.useQuery("#book");

    // And then return a view, possibly using more datacore API calls.
    return <dc.List rows={data} renderer={book => book.$link} />;
}
```
~~~

## Fetching Data

Datacore provides several methods for querying for data, including by the full query language and by path explicitly.

#### `dc.useCurrentFile()`

Loads the metadata for the file that the view is in - this will usually be `MarkdownPage`, but can also be a `CanvasPage`.
Using this hook will automatically refresh the view whenever the current file changes.

```jsx
return function View() {
    const file = dc.useCurrentFile();

    return <p>Hello, {file.$name}!</p>;
}
```

`dc.useCurrentFile` accepts an optional settings argument, which currently allows you to configure how often the view
should update via the `debounce` property.

```jsx
// Only update the view at most once per 10 seconds (1000ms).
const file = dc.useCurrentFile({ debounce: 10000 });
```

#### `dc.useCurrentPath()`

Loads the path of the file that the view is in - this will usually be `MarkdownPage`, but can also be a `CanvasPage`.
Using this hook will automatically refresh the view whenever the current file changes.

```jsx
return function View() {
    const path = dc.useCurrentPath();

    return <p>The file is at {path}!</p>;
}
```

Like `useCurrentFile`, `dc.useCurrentPath` accepts an optional settings argument which can configure a `debounce`:

```jsx
// Only update the view at most once per 10 seconds (1000ms).
const path = dc.useCurrentPath({ debounce: 10000 });
```

#### `dc.useQuery()`

Query for a list of results using the [query language](/data/query). This will return a vanilla javascript list containing
all of the results that match the query, which can be a wide range of different data types. This hook will cause the view
to update whenever the query returns new results.

```jsx
return function View() {
    const books = dc.useQuery("#book and @page");

    return <dc.List rows={books} renderer={book => book.$link} />;
}
```

`dc.useQuery` accepts an optional second argument containing configuration; currently, the only configuration option is `debounce`,
which allows you to control how fast the view is allowed to update to reflect new results:

```jsx
return function View() {
    // Only allow the view to update every 10000ms (aka, 10 seconds).
    const books = dc.useQuery("#book and @page", { debounce: 10000 });

    return <dc.List rows={books} renderer={book => book.$link} />;
}
```


#### `dc.useFullQuery()`

Variant of `dc.useQuery` which returns a full search result object, which mainly provides a bit of useful extra metadata about how the
search performed. Specifically, it returns the following data:

```jsx
export interface SearchResult<O> {
    /** The query used to search. */
    query: IndexQuery;
    /** All of the returned results. */
    results: O[];
    /** The amount of time in seconds that the search took. */
    duration: number;
    /** The maximum revision of any document in the result, which is useful for diffing. */
    revision: number;
}
```

`dc.useFullQuery` can otherwise be used identically to `dc.useQuery`:

```jsx
return function View() {
    // Only allow the view to update every 10000ms (aka, 10 seconds).
    const bookResult = dc.useFullQuery("#book and @page", { debounce: 10000 });

    return <dc.Stack>
        <p>The search took {bookResult.duration.toFixed(2)}s to run.</p>
        <dc.List rows={bookResult.results} renderer={book => book.$link} />
    </dc.Stack>;
}
```

#### `dc.useIndexUpdates()`

A minimal query which just returns the current `revision` of the datacore index. The index `revision` is a monotonically increasing number
which is incremented every time something in your vault changes. This call is mainly useful if you are making heavy usage of direct
`dc.query` calls (which don't cause the view to refresh on their own), as it will cause the view to re-render every time something
changes in your vault.

```jsx
return function View() {

}
```

Like the other hooks, `dc.useIndexUpdates` accepts an optional second parameter of configuration.