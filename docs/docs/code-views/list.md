---
title: List Views (dc.List)
sidebar_label: List Views
sidebar_position: 200
---

List views, available as `dc.List`, generate pageable lists of results. They support grouping, heirarchies, paging, and several view modes. They come in three varieties:

- **Unordered** (`unordered`): A bullet-point style list.
- **Ordered** (`ordered`): A numbered list of items.
- **Block**: (`block`): A list with no additional formatting - just shows elements in a vertical list of 'blocks'.

## Quickstart

Most common usages of lists will use `rows` and `renderer`:

```jsx
return function View() {
    // Start by fetching your data via a query.
    const data = dc.useQuery("#book and @page");

    // Pass the full data to `rows`, and specify what to show in the list via `renderer`:
    return <dc.List rows={data} renderer={book => book.$link} />;
}
```

Lists are also commonly used for rendering embeds:

```jsx
return function View() {
    const data = dc.useQuery("#important-note and @block");

    // Uses `dc.embed` to render an embed of all of the given blocks, with paging for performnace.
    return <dc.List rows={data} paging={true} renderer={dc.embed} />;
}
```

For the full set of available options, read on.

## Basic Usage (`rows`)

The list view is available in the local API as `dc.List`; it at a minimum requires a list of elements to show (`rows`):

```js
const ITEMS = ["First", "Second", "Third"];

return function View() {
    return <dc.List rows={ITEMS} />;
}
```

Which will produce a simple list like so:

- First
- Second
- Third

## List Types (`type`)

You can control which of the list types you want via the `type` property.

```js
const ITEMS = ["First", "Second", "Third"];

return function View() {
    return <dc.List type="ordered" rows={ITEMS} />;
}
```

The three options available are:

- **Unordered** (`unordered`): A bullet-point style list. This is the default.
- **Ordered** (`ordered`): A numbered list of items. Numbering starts at 1 and increments.
- **Block**: (`block`): A list with no additional formatting - just shows elements in a vertical list of 'blocks'.
    - Block formatting is best for embeds or other use cases where you do not want visible formatting from a regular list.

## Specifying How To Render Data (`renderer`)

When working with queries and any other non-trivial object, you will likely want to specify exactly what to render and how. This can be done via the `renderer` prop, which accepts a function that maps
each row to the value or JSX to render.

```jsx
return function View() {
    // This will give back a set of MarkdownPage objects, which are not useful to render on their own.
    const books = dc.useQuery("#book and @page");

    // Render books by rendering their links.
    return <dc.List rows={books} renderer={book => book.$link} />;
}
```

Some built-in rendering functions already exist, such as `dc.embed`, which renders embeds of files
automatically:

```jsx
return function View() {
    // Fetch all blocks referencing a specific tag.
    const notes = dc.useQuery("#life-notes and @block");

    // Render the notes as embeds in block format for minimal formatting.
    return <dc.List type="block" rows={notes} renderer={dc.embed} />;
}
```

## Paging (`paging`)

You can add paging to any list using the `paging` prop, which accepts several options.

```js
// Explicitly disable paging.
<dc.List paging={false} ... />

// Enable paging, with the page size equal to your default page size in the Datacore settings.
<dc.List paging={true} ... />

// Enable paging with the specific page size.
<dc.List paging={10} ... />
```

If `paging` is not specified, it defaults to whatever your default paging configuration is in
the Datacore settings.

### Scroll on Page (`scrollOnPaging`)

By default, changing the page will retain the current scroll position, meaning you will continue
to look at your current page position when you change pages. For large pages, this can mean
needing to manually scroll back to the top of the table after each page; this can instead
happen automatically by setting `scrollOnPaging`:

```js
// Always scroll to the top of the view when the page changes.
<dc.List scrollOnPaging={true} ... />

// Only scroll to the top of the page if the old page had at least 10 entries.
<dc.List scrollOnPaging={10} ... />
```

## Grouping (`groupings`)

List views automatically support rendering grouped data; grouped data can be created most easily
using [Data Array](data-array) syntax.

```jsx
return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // No extra configuration is required by default to show groups.
    return <dc.List rows={booksByGenre} renderer={book => book.$link} />;
}
```

By default, grouped data will render the grouping headers using the default text renderer. If you'd
like to add embellishments, such as converting each of the 'genres' in the above examples into links,
you can use the `groupings` prop:

```jsx
return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // Render each grouping key as a file link instead of just text.
    return <dc.List rows={booksByGenre} renderer={book => book.$link} groupings={(key) => dc.fileLink(key)} />;
}
```

You can also choose to construct an explicit `GroupingConfig` instead of passing a function:

```jsx
const LINK_GROUPING = {
    render: (key, rows) => dc.fileLink(key)
};

return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // Render each grouping key as a file link instead of just text.
    return <dc.List rows={booksByGenre} renderer={book => book.$link} groupings={LINK_GROUPING} />;
}
```

If you group multiple times, you can specify a separate rendering for each grouping level by passing an array of grouping configurations to `groupings`.

## Heirarchies (`childSource` / `maxChildDepth`)

Lists can recursively contain sublists to create full heirarchies of entries. By default, datacore
will look for the `$children` and `children` properties on rows to determine sublists to render.
For example, this will produce a nested list of two top level items (`Hello` and `Goodbye`), each with three subitems.

```jsx
const DATA = [
    {
        title: "Hello",
        children: [
            { title: "One" },
            { title: "Two" },
            { title: "Three" }
        ]
    },
    {
        title: "Goodbye",
        children: [
            { title: "Four" },
            { title: "Five" },
            { title: "Six" }
        ]
    }
];

return function View() {
    return <dc.List rows={DATA} renderer={item => item.title} />;
}
```

If you want to use another field instead, you can override the `childSource` property to provide
either a different property, list of properties, or even an arbitrary function:

```jsx
return function View() {
    // Provide an alternative property to use.
    return <dc.List rows={...} childSource={"items"} ... />;
    // Provide a list of alternative properties.
    return <dc.List rows={...} childSource={["items", "things"]} ... />;
    // Provide an arbitrary function.
    return <dc.List rows={...} childSource={item => item.value("doodads")} ... />;
}
```

You can also control the maximum depth of children to show via `maxChildDepth`; this defaults to
a small constant (less than 20) by default.

```jsx
return function View() {
    // Show only at most two levels of children.
    return <dc.List rows={...} childSource={"items"} maxChildDepth={2} ... />;
}
```

Children and grouping can be combined to create very interesting views, such as this one which
dynamically generates a list of books as well as all pages/sections immediately linking to that book:

```jsx
// Finds all things linked to book that themselves can be linked to.
function findLinked(book) {
	return dc.query(`[[${book.$path}]] and $types.econtains("linkable")`);
}

return function View() {
    // Groups both by 
    const books = dc.useQuery("@page and #book");
    const groupedBooks = dc.useArray(books, array => array.groupBy(book => book.value("genre") ?? "No Genre"));

    return <dc.List rows={groupedBooks} renderer={(book) => book.$link} maxChildDepth={1} childSource={findLinked} />;
}
```

## Full Reference

The full set of available properties is provided below:

```js
export interface ListState<T> {
    /**
     * Whether the list should be ordered, unordered, or block.
     *
     * Block lists do not use an actual list element and instead just render a series of contiguous
     * div elements with no other annotations.
     */
    type?: "ordered" | "unordered" | "block";

    /** The full collection of elements in the list. */
    rows: Grouping<T>;

    /** Allows for grouping header lines to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | VNode);

    /**
     * Custom render function to use for rendering each leaf element. Can produce either JSX or a plain value which will be
     * rendered as a literal.
     */
    renderer?: (row: T) => React.ReactNode | Literal;

    /** Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size. */
    paging?: boolean | number;

    /**
     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.
     * If a number, will scroll only if the number is greater than the current page size.
     **/
    scrollOnPaging?: boolean | number;

    /** Maximum level of children that will be rendered; a level of 0 means no children expansion will occur. */
    maxChildDepth?: number;

    /**
     * Property name, list of property names, or function to be applied to obtain children for a given entry.
     * Defaults to the `$children` and `children` props.
     *
     * If null, child extraction is disabled and no children will be fetched. If undefined, uses the default.
     */
    childSource?: null | string | string[] | ((row: T) => T[]);
}

export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be rendered. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | VNode;
}
```