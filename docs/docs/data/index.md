---
title: Metadata
sidebar_label: Metadata
sidebar_position: 300
---
Datacore is a *metadata* index - it stores information about every page, section, block, list item, canvas file, and other file in your vault
in an internal database which can be quickly searched for generating nice-looking views. You access this metadata using the [query language](query.md),
and then compile it into useful views using the [embedded views](code-views/index.md).

## What Does Metadata Look Like?

Every single thing that datacore tracks has a large list of *metadata* - for example, the simple markdown page below:

```md
---
length: 35 hours
rating: 10
time-played: 2013-06-10
---
# Dark Souls

#game, #game/hard

The game that eventually lead to [[Dark Souls 2]] and [[Elden Ring]]!
```

Will look like the following in Datacore:

```js
{
    $name: "Dark Souls",
    $path: "games/Dark Souls.md",
    $tags: ["#game", "#game/hard"],
    $links: [{ path: "games/Dark Souls 2.md" }, { path: "games/Elden Ring.md" }],
    $types: ["page", "markdown", "file", "taggable", "linkable"],
    $frontmatter: {
        "length": "35 hours",
        "rating": 10,
        "time-played": "2013-06-10"
    },
    /** ... many more fields ... */
},
```

Most fields in the metadata start with a dollar sign (`$`), meaning they are *intrinsic* - automatically provided by Obsidian and Datacore.
This includes things like a files path, tags and links in the file, titles, sections, and so on. Explicit properties you put in your `Properties`
block or via inline fields are *user* metadata - `length`, `rating`, and `time-played` in the example above.

When writing queries against this metadata, you can reference fields directly by name - so `$path` to reference the intrinsic file path, or
`length` to reference your user-defined property `length`.

> **Aside: Why the dollar sign?**
> 
> Datacore prepends all of it's intrinsic fields with dollar signs to differentiate them from user metadata. This allows for someone to have a
> property named `path` for example, separate from `$path`.

## What Is Available?

The data available depends on the specific type. The sections below describe metadata that is generally available for everything - for specific types,
you can look at it's corresponding metadata reference page.

### Object Types (`$types`)

All datacore objects have multiple 'types', which describe what they are.

- Markdown Pages, for example, have the types `page`, as well as the type `markdown` to denote that they came from a markdown page.
- Sections have the type `section`, as well as the type `markdown`.
- Tasks have the types `task` and `list-item`, as well as `markdown`.

When writing queries, you can filter results by their type (using the `@type` [query](query.md)), allowing you to limit results just
down to pages, or sections, or tasks, for example.

### Parent & Children (`$parent`)

The datacore index is heirarchical - each page has a list of sections; each section has a list of blocks; and blocks may have list items,
tasks, or other sub-items inside of them. If you look at a full page object, for example, you can see the full list of sections as
`$sections`. Similarly, for a given section, you can find it's parent page using `$parent`.

### Tags (`$tags`)

Generally, everything taggable has the `$tags` field, which is an exact list of the (de-duplicated) tags in the document.

### Links (`$links`)

Similarly, everything you can put links has the `$links` field, which is an exact list of every link that the object links to. The links
stored here are automatically deduplicated, so you even if you link to a given document many times it will only show up once.

### File (`$file`) / Path (`$path`)

All objects are tagged with the file path (`$file`) that they came from. For objects that _are_ files, like markdown pages, images, or canvas files,
this data is also available as `$path`.