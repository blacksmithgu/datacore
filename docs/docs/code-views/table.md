---
title: Table Views (dc.Table)
sidebar_label: Table Views
sidebar_position: 300
---

Table views, available as `dc.Table`, make two dimensional tables of results. They support grouping,
paging, as well as some custom styling.

## Basic Usage (`rows` and `columns`)

Tables at a minimum need some data to show (`rows`), and the list of columns to display (`columns`).
Each column requires at a minimum a unique `id` and `value` - for example:

```jsx
const COLUMNS = [
    {
        // A unique ID which identifies this specific column.
        id: "link",
        // The value to show in the column.
        value: (row) => row.$link
    },
    { id: "Rating", value: (row) => row.value("rating") },
    { id: "Genre", value: (row) => row.value("genre") }
]

return function View() {
    // Start by fetching your data via a query.
    const data = dc.useQuery("#book and @page");

    // Pass the full data to `rows`, along with your columns.
    return <dc.Table rows={data} columns={COLUMNS} />;
}
```

## Columns

Each table column, at a minimum, requires a unique `id` field and a `value` function which
extracts the value to actually show in the table. For example, a column which displays
the genre of a row may look like:

```js
{
    id: "Genre",
    value: (row) => row.value("genre")
}
```

The `id` of a column must be a simple string; the `value` must be a simple javascript object/primitive
and should not contain any React or JSX.

### Cell Rendering (`render`)

If you do want to add special JSX or interactivity to a column, you can do so via the `render` prop:

```jsx
{
    id: "Genre",
    value: (row) => row.value("genre"),
    // Render accepts the column value and (optionally) the full row; it can produce arbitrary
    // renderable values or JSX.
    render: (value, row) => dc.fileLink(value)
}
```

### Title Rendering (`title`)

Columns will use the `id` field as the column name by default; if you want an alternative name
or would like to add JSX to the title field, you can overwrite the `title` property:

```jsx
{
    id: "Genre",
    // You can use arbitrary JSX for the title; you can also just use another string if desired.
    title: (
        <h1>Genre!</h1>
    )
    value: (row) => row.value("genre"),
}
```

### Column Width (`width`)

Columns use the default HTML sizing algorithm by default, which assigns more width to columns that have more content in them. This
tends to be an acceptable default, but you can override it if you want more consistency or customization in your table layout. Column
width can be configured by overriding the `width` property:

```jsx
{
    id: "Genre",
    width: "50%",
    value: (row) => row.value("genre"),
}
```

Columns have a few configuration options:

- **Fixed Values**: You can give fixed pixel sizes to a column by setting it's width to a number of pixels, such as `500px` or `200px`.
- **Percentages**: You can allocate a certain percent of the whole table to a column using percentages, such as `50%` or `70%`.
- **Maximum/Minimum**: You can allocate as much space as possible using `maximum`, and as little space as possible using `minimum`. These options
    will generally reduce the column to be exactly big enough to store the column and no more; in some cases, it may introduce wrapping in
    the current column or in other columns.

## Paging (`paging` / `scrollOnPaging`)

You can add paging to any table using the `paging` prop, which accepts several options.

```js
// Explicitly disable paging.
<dc.Table paging={false} ... />

// Enable paging, with the page size equal to your default page size in the Datacore settings.
<dc.Table paging={true} ... />

// Enable paging with the specific page size.
<dc.Table paging={10} ... />
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
<dc.Table scrollOnPaging={true} ... />

// Only scroll to the top of the page if the old page had at least 10 entries.
<dc.Table scrollOnPaging={10} ... />
```

## Grouping (`groupings`)

Table views automatically support rendering grouped data; grouped data can be created most easily
using [Data Array](data-array) syntax.

```jsx
const COLUMNS = [
    { id: "link", value: (row) => row.$link },
    { id: "Rating", value: (row) => row.value("rating") },
    { id: "Genre", value: (row) => row.value("genre") }
]

return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // No extra configuration is required by default to show groups.
    return <dc.Table rows={booksByGenre} columns={COLUMNS} />;
}
```

By default, grouped data will render the grouping headers using the default text renderer. If you'd
like to add embellishments, such as converting each of the 'genres' in the above examples into links,
you can use the `groupings` prop:

```jsx
const COLUMNS = [
    { id: "link", value: (row) => row.$link },
    { id: "Rating", value: (row) => row.value("rating") },
    { id: "Genre", value: (row) => row.value("genre") }
]

return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // Assigns `groupings` to render the grouping headers using custom logic.
    return <dc.Table rows={booksByGenre} columns={COLUMNS} groupings={(key) => dc.fileLink(key)} />;
}
```

You can also choose to construct an explicit `GroupingConfig` instead of passing a function:

```jsx
const LINK_GROUPING = {
    render: (key, rows) => dc.fileLink(key)
};

const COLUMNS = [
    { id: "link", value: (row) => row.$link },
    { id: "Rating", value: (row) => row.value("rating") },
    { id: "Genre", value: (row) => row.value("genre") }
]

return function View() {
    // Fetch all books and then group them by genre.
    const books = dc.useQuery("#book and @page");
    const booksByGenre = dc.useArray(books, array => array.groupBy(book => book.value("genre")));

    // Assigns `groupings` to render the grouping headers using custom logic.
    return <dc.Table rows={booksByGenre} columns={COLUMNS} groupings={LINK_GROUPING} />;
}
```

If you group multiple times, you can specify a separate rendering for each grouping level by passing an array of grouping configurations to `groupings`.

## Full Reference

The full set of available properties is provided below:

```js
export interface TableViewProps<T> {
    /** The columns to render in the table. */
    columns: TableColumn<T>[];

    /** The rows to render; may potentially be grouped or just a plain array. */
    rows: Grouping<T>;

    /** Allows for grouping header columns to be overridden with custom rendering/logic. */
    groupings?: GroupingConfig<T> | GroupingConfig<T>[] | ((key: Literal, rows: Grouping<T>) => Literal | ReactNode);

    /**
     * If set to a boolean - enables or disables paging.
     * If set to a number, paging will be enabled with the given number of rows per page.
     */
    paging?: boolean | number;

    /**
     * Whether the view will scroll to the top automatically on page changes. If true, will always scroll on page changes.
     * If a number, will scroll only if the number is greater than the current page size.
     **/
    scrollOnPaging?: boolean | number;
}

export interface TableColumn<T, V = Literal> {
    /** The unique ID of this table column; you cannot have multiple columns with the same ID in a given table. */
    id: string;

    /** The title which will display at the top of the column if present. */
    title?: string | ReactNode | (() => string | ReactNode);

    /** If present, the CSS width to apply to the column. 'minimum' will set the column size to it's smallest possible value, while 'maximum' will do the opposite. */
    width?: "minimum" | "maximum" | string;

    /** Value function which maps the row to the value being rendered. */
    value: (object: T) => V;

    /** Called to render the given column value. Can depend on both the specific value and the row object. */
    render?: (value: V, object: T) => Literal | ReactNode;
}

export interface GroupingConfig<T> {
    /** How a grouping with the given key and set of rows should be handled. */
    render?: (key: Literal, rows: Grouping<T>) => Literal | ReactNode;
}
```