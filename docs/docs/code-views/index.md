---
title: Javascript Views
sidebar_label: Javascript Views
sidebar_position: 400
---

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
(the `return function View()` in the example), which will be rendered. Codeblocks have access to the `dc` global variable,
which provides a very rich API for querying state via React Hooks.

> **Note: React Components**
> 
> React components are not covered in great depth here - we recommend reading up on how React works
> using the very excellent [React documentation](https://react.dev/learn).
> The core idea is simply that components are declarative - they return the full HTML that should be rendered,
> and React then intelligently renders only
> the parts which changed and only calls the function when state changes somewhere.

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

> **Note: When Does My View Update?**
>
> Datacore uses React Hooks to automatically update views. Most datacore hooks like `dc.useCurrentFile()`
> and `dc.useQuery()` internally set up event listeners for when the datacore index changes. When it does,
> they update some internal state which causes your view to automatically re-render. This is similar
> to how the React `useState` hook will cause your view to re-render if you update the state!
>
> For more advanced users, note that this means you can directly control when things re-render if
> you wish, by directly using load apis like `dc.query()` and manually reacting to index updates -
> either by subscribing to the event or using the low level `dc.useIndexUpdates()` hook to just
> trigger on every index update.

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
        for (const game of games) {
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
            {Object.keys(ratingBuckets).map(rating => (
                <li>Rating {rating}: {ratingBuckets[rating] ?? 0} entries.</li>
            ))}
        </ul>
    );
}
```

### Displaying Your Data

To display your data, you can output arbitrary HTML using the Javascript JSX syntax (also covered
in the React documentation). For example, to render some paragraphs:

```jsx
return function View() {
    return <div>
        <p>Hello!</p>
        <p>Goodbye!</p>
    </div>;
}
```

Injecting data into JSX views is done via `{}` interpolation; for example:

```jsx
return function View() {
    const data = dc.useCurrentFile();

    return <p>The file you are on is "{data.$path}".</p>;
}
```

You can run arbitrary javascript inside interpolated blocks:

```jsx
return function View() {
    const data = dc.useCurrentFile();

    return <p>The first character is {data.$name.substring(0, 1)}!</p>
}
```

You can even `map` over arrays to allow for creating lists and so on:

```jsx
return function View() {
    const data = [1, 2, 3, 4];

    return <ol>
        {data.map(index => (
            <li>{index}</li>
        ))}
    </ol>;
}
```

## Splitting Up Complex Views

For large views, you can split up large blocks of complicated JSX into separate functions.

```jsx
function ListItem({ text }) {
    return <li>Some text: {text}</li>;
}

return function View() {
    return <ul>
        <ListItem text="text!" />
        <ListItem text="more text!" />
        <ListItem text="even more text!" />
    </ul>;
}
```

## Sharing Code

You can split code up into common snippets that can then be imported by other scripts using `dc.require`. Common snippets can either be placed directly into `js/ts` files in your vault, OR they
can be placed into codeblocks and imported by the name of the section the codeblock is in. For example,
in file `scripts/lists.md`:

~~~markdown
# ListItem

```jsx
function ListItem({ text }) {
    return <li>Some text: {text}</li>;
}

// The return is important here - dc.require literally calls this code as a function and yields
// whatever this codeblock returns. If you are used to 'import'-style includes in modern ECMAScript,
// this may look a bit weird.
return { ListItem };
```
~~~

Then, from another script elsewhere:

```jsx
const { ListItem } = await dc.require(dc.headerLink("scripts/lists.md", "ListItem"));

return function View() {
    return <ListItem text="whoa!" />;
}
```