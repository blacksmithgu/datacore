---
title: Pages
sidebar_position: 300
---

Datacore tracks all markdown pages as well as a substantial amount of metadata about them. Markdown pages can be queried by the `@page` type.

## Available Data

| **Field** | **Description** | **Example** |
| - | - | - |
| `$path` | The full path of this markdown page, relative to the Vault Root. | `games/Dark Souls.md` |
| `$ctime` | The time that the file was created in the local filesystem. | `January 1st, 2024 5:37PM` |
| `$mtime` | The time that the file was last modified in the local filesystem. | `January 1st, 2024 5:37PM` |
| `$extension` | The file extension of the file - usually going to be `md` or `markdown` for markdown. | `md` or `markdown` |
| `$size` | The total size of the file, in bytes. | `537` |
| `$position` | The 'position' of the markdown element, which for pages is just the entire size of the page. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive. | `{ start: 0, end: 7 }` |
| `$lineCount` | The total number of lines in the page. | `13` |
| `$name` | The name of the page as you would see it in Obsidian. | `Dark Souls` |
| `$link` | A Link object that links to this page. | `[[Dark Souls]]` |
| `$tags` | A list of unique tags in the file. | `["#game", "#todo/revisit"]` |
| `$sections` | A list of all of the [markdown sections](sections) in the file. An implicit section is created for the first section of the markdown file before any section headers. | See [markdown sections](sections). |
| `$frontmatter` | A list of all of the frontmatter / "Properties" fields. See the section below for details. | `{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value" }, ... }` |
| `$infields` | A list of all of inline fields. See the section below for details. | `{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }` |
| *User Data* | Frontmatter data and inline fields can be accessed directly on pages in a case-insensitive manner. | See below. |

## Frontmatter & Inline Fields

Datacore tracks frontmatter and inline fields on pages using the `$frontmatter` and `$infields` metadata properties, which are maps from (lower-case) field name
to their value. You can directly use these types if you wish, but it is generally easier to use the shorthand methods:

## In Queries / Expressions

You can reference page fields in queries and expressions directly by case-insensitive name:

```js
@page and rating >= 7
@page and row["spaced field"].contains("thing")
```

## In Javascript

In javascript, you can use the [fields API](fields) to easily access typed fields. This is case-insensitive:

```js
page.value("rating") => 7
page.value("genre") => "Fantasy"
```

## JSON Reference

A compact view of every piece of metadata available on a markdown page:

```json
{
    $types: ["file", "markdown", "page", "taggable", "linkable", "links", "fields"],
    $typename: "Page",
    $id: "<path-to-file>",
    $file: "<path-to-file>",
    $frontmatter: [
        "key 1": {
            key: "key 1",
            value: "<parsed value>",
            raw: "<raw unparsed text value>"
        },
        ...
    ],
    $infields: [
        "field 1": {
            key: "field 1",
            value: "<parsed value>",
            raw: "<raw unparsed text value>",
            position: { start: 0, end: 1 }
        },
        ...
    ],
    $path: "<path-to-file>",
    $ctime: "<unix epoch seconds when file was created>",
    $mtime: "<unix epoch seconds when file was last modified>",
    $extension: "<file extension - usually 'md'>",
    $size: "<size of file in bytes>",
    // Start and end position of the whole file in lines - this usually means start is 0 and end is the number of lines in the file + 1.
    // Start position is inclusive; end is exclusive.
    $position: { start: 0, end: 1 },
    $tags: ["#tag1", "#tag2/thing"],
    $links: [ /* list of Link objects in this page. */ ],
    $sections: [ /* list of sections in this page. */ ],

    /** Derived Fields. */
    $lineCount: 1, // Number of lines in the file.
    $name: "File Name", // Name of the file as it would show up in Obsidian.
    $link: <link-to-file>, // Link object that links to this file.
}
```