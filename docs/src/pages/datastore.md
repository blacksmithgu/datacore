# The Datastore

The database for Datacore is colluquially called the "datastore"; it is an in-memory inverted index over
all of the files in your Obsidian vault. It tracks every single block, section, link, tag, and piece
of frontmatter in every file, and supports quick searches for any of this kind of metadata. Specifically, the following kind of searches are fast:

- **Specific Pages**: Datacore supports looking up metadata for specific files instantly.
- **Specific Types**: Datacore can find all objects of a specific type - like all "pages", all pdf files, all images, all sections, etc.
- **Specific Links and Tags**: Datacore tracks every exact location that any link or tag has been referenced, and can produce their usages quickly.
- **Pages Containing Specific Fields**: Datacore knows where every definition of every field exists,
so it can instantly return pages which contain a key like "status" or "last read".
- **Some Specific Metadata**: Datacore optimizes a few specific fields, like task `completed`, to be
very fast.
- **Parent/Child Relationships**: Given a page, you can instantly load all of it's sections; or given a section, you can instantly load it's parent page.

Datacore can execute arbitrary queries outside of this, but writing your queries on these "fast" queries
will ensure smoother performance.

## Data Queries

Datacore comes with a query language which can be used to filter down the set of result objects. Queries
produce sets of results - sections, blocks, pages, etc. They can be combined with `and` and `or`.

### Example Queries

Find all pages tagged game which have a `rating` of 9 or above:

```
@page and #game and rating >= 9
```

### Basic Query Types

##### `@type`

You can fetch all objects of a specific type (section, page, etc) using a `@type` query. To fetch
all pages, use `@page`; to fetch all blocks, use `@block`. The full set of currently supported types
is below:

- `@file`: All files.
- `@page`: All markdown pages.
- `@section`: All markdown sections in markdown pages.
- `@block`: All markdown blocks in markdown pages.
- `@block-list`: All markdown blocks that contain lists in them.
- `@codeblock`: All markdown codeblocks.
- `@datablock`: All datacore 'datablocks', which are special codeblocks annotated with `yaml:data`.
- `@list-item`: All list items in markdown pages.
- `@task`: All task items (of the form `- [ ]`).

Type queries are usually combined with other queries to filter to specific types - for example,
`@section and #tag` will return sections tagged with `#tag`.

##### `#tag`

You can fetch all objects tagged with a given tag using `#tag` - for example, `#game` or `#philosophy/natural`. 

##### `linked()`

You can fetch objects that link TO or link FROM a given page. To find all pages that link TO a document,
use `linkedto([[link]])`; to find pages that link FROM a document, use `linkedfrom([[link]])`. If you
want all links regardless of direction, just use `linked([[link]])`.

##### `path()`

You can fetch all objects at the given path/folder in your vault using `path("path/to/folder")`. To
fetch all files in your `Games` folder, for example, use `path("Games")`.

##### `exists()`

You can fetch all objects which have a specific metadata field defined with `exists`. For example,
`exists(rating)` will return all pages which have `rating` defined.

##### Expressions

You can execute arbitrary expressions

##### `parentof()`

Datacore supports searching for the *parents* of certain objects - for example, if you want to find
all pages that contain json codeblocks. This is implemented via `parentof()`, which takes a query that
matches objects and instead matches all parents of those objects. For example, if `#pizza` would match a collection of blocks and sections, `parentof(#pizza)` would match the sections and pages that contain those blocks/sections.

`parentof()` is best described via examples:

```js
// Find all pages that contain datacore codeblocks.
@page and parentof(@codeblock and $languages.contains("datacorejs"))
```

By default, `parentof()` is exclusive, meaning it will only return the parents of the input query; if
you want to also return the matches of the input query, use `supertree()`:

```js
// Return all of the parent sections/pages of codeblocks.
parentof(@codeblock)
// Return the parent sections and pages of codeblocks, and the codeblocks themselves.
supertree(@codeblock)
```

##### `childof()`

The complementary operation to `parentof()`; given an input query, produces all of the children of
the matching objects. `@page` produces all pages; `childof(@page)` produces all sections, blocks, list items, and so on.

Like `parentof()`, `childof()` is exclusive by default and will not return matches from the input query.
If you want to also get matches from the input query, use `subtree()`.

```js
// Return all sections, blocks, etc that are children of markdown pages.
childof(@page)
// Return page objects and all of the sections, blocks, etc in them.
subtree(@page)
```

### Query Combinators

You can combine queries with the standard suite of operations.

#### `and`

You can combine two queries with `and`: `@block and #book` matches all `@blocks` tagged `#book`. Queries
combined with `and` only return results that match both subqueries.

#### `or`

Queries combined with `or` match objects that match either or both of the subqueries: `@block or #book`
matches all `@blocks`, all objects tagged `#block`, and blocks tagged `#book`.

#### Negation

You can negate a query with `!`: negated queries match everything that the original query does not match. So `!#book` matches every object that is NOT tagged `#book`.

Negated queries can be slow since they can produce an enormous number of results - to keep performance
up, make sure to keep your query specific - for example, instead of `!#book`, use `!#book and @block`.