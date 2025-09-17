---
title: Blocks
sidebar_position: 302
---

Datacore tracks every markdown block in markdown files and in canvas files. The metadata available depends on the type of block.

## Metadata for all Blocks

| **Field** | **Description** | **Example** |
| - | - | - |
| `$type` | The _type_ of block - such as a list block or codeblock, etc. | `list` or `codeblock` or `datablock` or `paragraph` or `yaml` |
| `$ordinal` | The position of this block in the file. The first block has ordinal 0, the second 1, and so on. | Non-negative integer (`0`, `1`, etc.) |
| `$position` | The position of the block. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive. | `{ start: 0, end: 7 }` |
| `$tags` | A list of unique tags in the block. | `["#game", "#todo/revisit"]` |
| `$links` | A list of all unique links in the section. | A list of links. |
| `$link` | A Link object that links to this block, if the block has a block ID that can be linked to. Otherwise, is undefined. | `[[Dark Souls#^blockId]]` |
| `$blockId` | The unique block ID for the given block, if one is defined. | `blockId` |
| `$infields` | A list of inline fields for this block. | `{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }` |

## Inline Fields

Inline fields on blocks can be loaded using the [field syntax](fields):

```js
// In queries and expressions, you can just reference the field directly:
@block and genre = "Fantasy"
@block and row["last reviewed"] > date(now) - dur(7d)

// In javascript, use the field API:
block.value("last reviewed")
```

## Block Types

### Paragraphs (`paragraph`)

A paragraph of text; these blocks have no additional metadata.

```markdown
A contiguous set of text lines
is considered a paragraph.

An empty line splits the text up
into two separate paragraphs.
```

### YAML (`yaml`)

Used for frontmatter blocks. This data is directly stored in the page as `$frontmatter`, so this block itself has no additional metadata.

```markdown
---
key: value
key2: value2
---
```

### List Blocks (`list-block`)

Contains a list of items or task items. List blocks have the `block-list` type and can be queried by `@block-list`.

```markdown
- Item 1
- Item 2
- [ ] Task 1
- [ ] Task 2
```

| **Field** | **Description** |
| - | - |
| `$elements` | The list item elements in the list block. See below for details. |

#### List Items (`list-item`)

Datacore tracks all list items and tasks in your vault; they are available as the type `list-item` and can be queried as `@list-item`.

```markdown
- Regular list item.
- Another regular list item.
    - A sublist item.
```

| **Field** | **Description** | **Example** |
| - | - | - |
| `$type` | The _type_ of list item - either `task` or `list`. | `task` or `list` |
| `$position` | The position of the list item. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive. | `{ start: 0, end: 7 }` |
| `$line` | The line number that this list item starts on. | `7` |
| `$lineCount` | The number of lines in the list item. | `2` |
| `$tags` | A list of unique tags in the list item. | `["#game", "#todo/revisit"]` |
| `$links` | A list of all unique links in the list item. | A list of links. |
| `$infields` | A list of inline fields for this list item. | `{ "field 1": { key: "field 1", value: "value", raw: "raw unparsed value", position: ... }, ... }` |
| `$blockId` | If set, the block ID that can be used to link to this specific list item. | An Obsidian _block ID_ like `ssa82hr` |
| `$parentLine` | The line number of the parent item of this list item. For top-level list items, this will be a negative number equal to the line number of the start of the list block. | `14` or `-7` |
| `$symbol` | The list item symbol used for this list item. | `-` or `*` or `+` or `1.` |
| `$text` | The full text of the list item, not including any list markup. | `TODO: Do something. [key:: value]` |
| `$cleantext` | "Cleaned up" version of `text` which has indentation, inline fields, and id removed. | `TODO: Do something.` |
| `$elements` | A list of all sub items under this list item. | See this type. |

Like most other types, inline field values can be fetched from list items using [field syntax](fields).

#### Tasks (`task`)

Task list items have all properties of regular list items and are also considered list items; however, they have the additional `task` type can
be queried via `@task`.

```markdown
- [ ] An uncompleted task.
- [?] A questionable task.
    - [X] A completed task.
```

They also have the following additional fields:

| **Field** | **Description** | **Example** |
| - | - | - |
| `$type` | Tasks always have the type `task`. | `task` |
| `$status` | The status inside the brackets for the task. | `X` or `x` or `?` or ` ` (empty) |
| `$completed` | true if `$status` is `x` or `X`, and false otherwise. | `true` or `false` |

### Codeblocks (`codeblock`)

A markdown codeblock, which can be defined using either backticks or tab indentation. Codeblocks have the `codeblock` type
and can be queried by `@codeblock`.

~~~
```json
{ "a codeblock": "with some stuff in it" }
```
~~~

| **Field** | **Description** | **Example** |
| - | - | - |
| `$languages` | The list of languages specified for the codeblock; may be empty if no language was specified. | `["javascript", "json"]` |
| `$contentPosition` | The start and end lines of the actual code inside of the code block - this position skips any wrapping characters like backticks. Like other positions, start is inclusive and end is exclusive.  | `{ start: 4, end: 7 }` |
| `$style` | Whether the codeblock is defined by backticks (`\``) or by indentation. | `fenced` or `indent` |

### Datablocks (`datablock`)

Datablocks are specially annotated codeblocks which have been annotated with the `yaml:data` language:

~~~
```yaml:data
key: value
key2: value2
```
~~~

Datablocks can be directly searched over (using the `@datablock` query or `datablock` type) and all of their data is available as fields.

```jsx
// Fetch all datablocks which have a 'rating' field.
const datablocks = dc.query("@datablock and exists(rating)");

// Fetch data specifically from the values in the datablock.
datablocks[0].value("rating")
```

Datablocks are best used for tracking regular data - for example, an exercise block:

~~~
```yaml:data
type: exercise
date: 2025-01-10
lifts:
    squat: 240
```
~~~

Which could then be queried via:

```javascript
@datablock and type = "exercise"
```