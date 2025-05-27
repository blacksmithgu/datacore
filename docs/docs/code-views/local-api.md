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

## Query Hooks

Datacore provides several methods for querying for data, including by the full query language and by path explicitly.

### `dc.useCurrentFile()`

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

### `dc.useCurrentPath()`

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

### `dc.useQuery()`

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

### `dc.useFullQuery()`

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

### `dc.useIndexUpdates()`

A minimal query which just returns the current `revision` of the datacore index. The index `revision` is a monotonically increasing number
which is incremented every time something in your vault changes. This call is mainly useful if you are making heavy usage of direct
`dc.query` calls (which don't cause the view to refresh on their own), as it will cause the view to re-render every time something
changes in your vault.

```jsx
return function View() {
    // Revision will update on every index update.
    const revision = dc.useIndexUpdates();

    // Run some complex query that will be re-run on every revision update.
    const complexQuery = dc.useMemo(() => {
        const thing = dc.query(/* ... */);
        // ...
    }, [revision]);
}
```

Like the other hooks, `dc.useIndexUpdates` accepts an optional settings parameter, which allows you to set a debounce:

```jsx
// Only update at most once every ten seconds.
const revision = dc.useIndexUpdates({ debounce: 10000 });
```

## Common React Hooks

Datacore forwards the most common React hooks through it's API to make them available. The full list, with brief explanations of each, is:

- `dc.useState`: Create a React state variable that can be read and updated.
- `dc.useReducer`: Create a React reducer which accepts messages to update internal state.
- `dc.useMemo`: Memoize a value so it only updates when a dependency array changes.
- `dc.useCallback`: Memoize a function so it only is re-created when a dependency array changes.
- `dc.useEffect`: Run a specific 'side-effect' whenever a dependency array changes.
- `dc.createContext`: Create a react context which allows passing state down many layers without prop drilling.
- `dc.useContext`: Use a previously created context.
- `dc.useRef`: A state-like variable that allows directly storing a value without causing React re-renders.

Datacore also provides a few other useful hooks for specifically interacting with datacore utilities:

### `dc.useArray()`

Accepts a regular array, wraps it in a data array, executes a function on the data array, and then converts back to a normal array.
This is primarily useful for when you want to take advantage of [Data Array](data-array) utilities while otherwise using vanilla
javascript arrays for compatibility with preact/react.

```jsx
return function View() {
    const pages = dc.useQuery("@page and #book");
    const grouped = dc.useArray(pages, array => array.groupBy(book => book.value("genre")));

    return <dc.List rows={grouped} renderer={book => book.$link} />
}
```

`dc.useArray` also accepts a dependency array if you depend on state other than the array itself:

```jsx
const [searchTerm, setSearchTerm] = dc.useState("");
const pages = dc.useQuery("@page and #book");

const filteredPages = dc.useArray(
    pages,
    array => array.filter(book => book.$title.includes(searchTerm)),
    [searchTerm]);
```

## Direct Queries

The datacore API also provides several methods for directly querying the index outside of a hook. These can be called from anywhere, but note that,
because they are not hooks, they will _not_ cause your view to update if the query would update. To have your queries re-run every time the
index changes, combine it with `dc.useIndexUpdates`, which will trigger a re-render on every vault change:

```jsx
return function View() {
    // Revision will update on every index update.
    const revision = dc.useIndexUpdates();

    // Run some complex query that will be re-run on every revision update.
    const complexQuery = dc.useMemo(() => {
        const thing = dc.query(/* ... */);
        // ...
    }, [revision]);
}
```

### `dc.query()`

Execute a [query](/data/query) against the datacore index, returning a list of all matched [results](/data). Will raise an exception
if the query is malformed.

```jsx
dc.query("@page") => // list of all pages
dc.query("@page and #book and rating > 7") => // all pages tagged book with a rating higher than 7.
```

### `dc.tryQuery()`

Equivalent to `dc.query`, but returns a datacore `Result` instead of raising an exception.

```jsx
dc.tryQuery("@page") => { successful: true, value: [/* list of pages */] }
dc.tryQuery("fakefunction(@page)") => { successful: false, error: "malformed query..." }
```

### `dc.fullquery()`

Equivalent to `dc.query`, but returns several additional pieces of metadata about how long the query took to execute:

```jsx
dc.fullquery("@page") => {
    // Parsed query representation.
    query: { type: "type", type: "page" },
    // Actual results, like you would get from `dc.query`.
    results: [/* list of pages */],
    // Query runtime in seconds, accurate to the millisecond.
    duration: 0.01,
    // Index revision the query was executed against.
    revision: 317,
}
```

### `dc.tryFullQuery()`

Equivalent to `dc.fullquery`, but returns a datacore `Result` instead of raising an exception on an invalid query.

```jsx
dc.tryFullQuery("@page") => {
    successful: true,
    value: {
        // Parsed query representation.
        query: { type: "type", type: "page" },
        // Actual results, like you would get from `dc.query`.
        results: [/* list of pages */],
        // Query runtime in seconds, accurate to the millisecond.
        duration: 0.01,
        // Index revision the query was executed against.
        revision: 317,
    }
}

dc.tryFullQuery("malformed(@page)") => {
    successful: false,
    error: "malformed query ...",
}
```

## Links

Utilities for creating datacore `Link` types and normalizing paths.

### `dc.resolvePath()`

Resolves a local or absolute path to an absolute path, optionally from a given source path.

```jsx
// Can resolve by file name.
dc.resolvePath("Test") = "location/To/Test.md"
// Can resolve from an alternative source path, in case there are multiple `Test` files.
dc.resolvePath("Test", "utils/Index.md") = "utils/Test.md"
// If it cannot find the file, returns the input path unchanged.
dc.resolvePath("noexist") = "noexist"
```

### `dc.fileLink()`

Create a datacore `Link` from a path to a file. The path can be local or absolute (though it is generally
recommended to use absolute paths everywhere to avoid ambigious links). Datacore will render `Link` objects
automatically as Obsidian links, and some APIs may require `Link` objects.

```jsx
dc.fileLink("Test.md") = // Link object representing [[Test]].
```

### `dc.headerLink()`

Create a datacore `Link` pointing to a header in a file.

```jsx
dc.headerLink("Terraria.md", "Review") = // equivalent to [[Terraria#Review]].
```

### `dc.blockLink()`

Create a datacore `Link` pointing to a specific block in a file. Note that blocks can only be linked to if
they have a block ID - generally visible by looking for `^blockId` notation at the end of the block.

```jsx
dc.blockLink("Daily Thoughts.md", "38ha12d") = // equivalent to [[Daily Thoughts#^38ha12d]]
```

### `dc.parseLink()`

Parses a full link into a datacore `Link`. Throws an error if the syntax is malformed.

```jsx
dc.parseLink("[[Test]]") = // link representing [[Test]].
dc.parseLink("[malformed]") = // throws an exception
```

### `dc.tryParseLink()`

Returns a datacore `Result` containing the result of trying to parse a string link.

```jsx
dc.tryParseLink("[[Test]]") = // { successful: true, value: [[Test]] }
dc.tryParseLink("[malformed]") = // { successful: false, error: "malformed input..." }
```

## Expressions

Methods for evaluating arbitrary datacore expressions, and returning their results.

### `dc.evaluate()`

Evaluates a datacore [expression](/expressions), returning what it evaluates to. If the expression cannot be parsed
or is invalid, will raise an exception. `dc.evaluate` accepts one, two, or three arguments:

```jsx
// Single argument version takes only the expression.
dc.evaluate("1 + 2") = 3

// Two argument version allows you to provide variables.
dc.evaluate("x + y", { x: 1, y: 2 }) = 3

// Three argument version allows you to specify a source path to resolve
// links from, if you don't want to use the current file.
dc.evaluate("[[Test]].value", {}, "path/to/other/file.md") = // the value of property 'value' in [[Test]]
```

### `dc.tryEvaluate()`

Equivalent to `dc.evaluate()`, but returns a datacore `Result` type instead of just the value.

```jsx
dc.tryEvaluate("1 + 2") = { value: 3, successful: true }
dc.tryEvaluate("fakefunction(3)") = { successful: false, error: "unrecognized function..." }
```

## Type Coercion / Parsing

Parses

### `dc.coerce.string()`

Converts any other type to a string.

```jsx
dc.coerce.string(16) = "16"
dc.coerce.string(true) = "true"
```

### `dc.coerce.boolean()`

Parses `true` and `false` strings into booleans; returns undefined for most other types.

```jsx
dc.coerce.boolean(true) = true
dc.coerce.boolean("true") = true
dc.coerce.boolean("blah") = undefined
```

### `dc.coerce.number()`

Parses strings into numbers; returns undefined for most other types.

```jsx
dc.coerce.number(15) = 15
dc.coerce.number("49.2") = 49.2
dc.coerce.number("oof") = undefined
```

### `dc.coerce.date()`

Parses strings into dates; returns undefined for most other types.

```jsx
dc.coerce.date("2025-05-10") = // <DateTime representing 2025-05-10>
dc.coerce.date("2025-05-10T11:12:13") = // <DateTime representing 2025-05-10 at 11:12 (and 13 seconds)>
dc.coerce.date("random text") = undefined
```

### `dc.coerce.duration()`

Parses strings into durations; returns undefined for most other types

```jsx
dc.coerce.duration("14 hours") = // <Duration representing 14 hours>
dc.coerce.duration("30m") = // <Duration representing 30 minutes>
dc.coerce.duration("other text") = undefined
```

### `dc.coerce.link()`

Parses strings into links; returns undefined for most other types.

```jsx
dc.coerce.link("[[Test]]") = // Link to 'Test'
dc.coerce.link("![[Embed|Display]]") = // Embedded link to 'Embed' with display 'Display'.
dc.coerce.link("oof") = undefined
```

### `dc.coerce.array()`

If the input is an array, returns that array unchanged; otherwise, wraps the value in an array.

```jsx
dc.coerce.array([1, 2]) = [1, 2]
dc.coerce.array(1) = [1]
```