---
title: Sections
sidebar_position: 301
---

Datacore tracks each section in markdown files and canvases; sections can be queried by the `@section` type.

| **Field** | **Description** | **Example** |
| - | - | - |
| `$ordinal` | The position of this section in the file. The first section has ordinal 0, then 1, and so on. | `1` |
| `$title` | The name of the section. | `Details` |
| `$name` | Alias for `$title`; gives the name of the section. | `Details` |
| `$level` | The section level (i.e., the number of `#` preceding it). | 1 - 6 |
| `$position` | The position of the section. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive. | `{ start: 0, end: 7 }` |
| `$lineCount` | The length of the section in lines. | `7` |
| `$tags` | A list of unique tags in the section. | `["#game", "#todo/revisit"]` |
| `$links` | A list of all unique links in the section. | A list of links. |
| `$link` | A Link object that links to this section. | `[[Dark Souls#Thoughts]]` |
| `$blocks` | A list of markdown blocks inside this section. See the documentation for [blocks](blocks). | See documentation. |
| `$infields` | A list of inline fields for this section. | `{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }` |
| *User Data* | Inline fields can be accessed directly on sections in a case-insensitive manner. | See below. |

## Inline Fields

Inline fields on sections can be loaded using the [field syntax](fields):

```js
// In queries and expressions, you can just reference the field directly:
@section and row["last reviewed"] > date(now) - dur(7d)

// In javascript, use the field API:
section.value("last reviewed")
```

## JSON Reference

A compact view of every piece of metadata available on a section:

```json
{
    $types: ["markdown", "section", "taggable", "linkable", "links", "fields"],
    $typename: "Section",
    $id: "<unique id>",
    $file: "<path-to-file-containing-section>",
    $infields: [
        "field 1": {
            key: "field 1",
            value: "<parsed value>",
            raw: "<raw unparsed text value>",
            position: { start: 0, end: 1 }
        },
        ...
    ],
    $ordinal: <number>,
    $title: "<section title>",
    $name: "<section title>",
    $level: "<1-6 level of section>",
    $lineCount: 1, // Number of lines in the file.
    // Start and end position of the section in lines. Start position is inclusive; end is exclusive.
    $position: { start: 0, end: 1 },
    $link: <link-to-file>, // Link object that links to this file.
    $tags: ["#tag1", "#tag2/thing"],
    $links: [ /* list of Link objects in this section. */ ],
    $blocks: [ /* list of blocks in this section. */ ],
}
```