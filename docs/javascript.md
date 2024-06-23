# Javascript Support

Datacore supports Javascript, JSX, Typescript, and TSX. To add code to a page, use an embedded
codeblock with the language `datacorejs`, `datacorejsx`, `datacorets`, or `datacoretsx` respectively.
Datacore also has a plugin API available via the global `window.datacore`.

## DatacoreJS Codeblocks

Datacore javascript codeblocks execute JS scripts to produce embedded tables, lists, and so on. These
views can be fully interactive with buttons, time-base elements, and custom CSS. They use `preact`
(essentially a smaller variant of `React`) for rendering. The most basic codeblock looks like so:

~~~
```datacorejsx
return function View() {
    return <p>Hello!</p>;
}
```
~~~

Codeblocks should be annotated with `datacorejsx` to use JSX, and they should return a React Component
(the `return function View()` in the example), which will be rendered.

> **Note: React Components**
> 
> React components are not covered in great depth here - we recommend reading up on how React works
> using the very excellent React documentation. The core idea is simply that components are declarative
> - they return the full HTML that should be rendered, and React then intelligently renders only
> the parts which changed and only calls the function when state changes somewhere.

Codeblocks have access to the `dc` global variable, which provides a very rich API for querying state
via React Hooks.

### Fetching Data

The most fundamental hook for fetching data is `dc.useQuery()` - this accepts a Datacore query and produces an array of matching objects, like so:

```jsx
return function View() {
    const games = dc.useQuery("#game and @page and rating > 7");
    return <p>You have written about {games.length} games!</p>;
}
```

If you only want the metadata for a specific file, you can use `dc.useFile()` or `dc.useCurrentFile()`:

```jsx
return function View() {
    // Returns full page metadata for the current file, and updates the view whenever the current
    // file changes.
    const current = dc.useCurrentFile();

    // Returns file metadata for a file at a specific path.
    const other = dc.useFile("secret/data.md");

    return <p>You are on {current.$path}; you are loading from {other.$path}.</p>;
}
```

### Processing your Data

Datacore queries always produce lists of matching objects. You should maximize putting logic into
the query for performance reasons, but you may want to do grouping, flattening, complex filtering,
or other logic before rendering. If so, you should generally use React memoization to do this:

```jsx
return function View() {
    // Fetch all pages tagged #game.
    const games = dc.useQuery("#game and @page");

    // We want to manually construct a histogram of games by the rating we gave them.
    const ratingBuckets = dc.useMemo(() => {
        const ratings = {};
        for (const game in games) {
            if (!game.value("rating")) continue;

            // Convert all ratings to strings since who knows what people put in metadata these days.
            const rating = game.value("rating") + "";
            ratings[rating] = (ratings[rating] ?? 0) + 1;
        }

        return ratings;
    }, [games]);

    // Then show those buckets!
    return (
        <ul>
            {["1", "2", "3", "4", "5"].map(rating => (
                <li>{rating}: {ratingBuckets[rating] ?? 0} entries.</li>
            ))}
        </ul>
    );
}
```

### Displaying Your Data

To display your data, you can output arbitrary HTML using the Javascript JSX syntax (also covered
in the React documentation).