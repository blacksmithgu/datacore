# Roadmap

The full span of functionality that Datacore will eventually encompass.

## Views

Views in Datacore are editable and no longer use the Dataview Query Language. You can still write complex-looking
statements / columns using the Dataview Expression Language (a subset of the query language which supports math,
string operations, list operations, and so on).

- [X] **Table**: The standard columnar table view.
- [X] **List**: The standard list view, which just lists elements.
- [ ] **Embed List**: A special list which just renders a list of embedded pages 
- [ ] **Card**: A card-based view which supports a title and card content.
- [ ] **Grouped**: A special view which allows for splitting query results into subgroups, and render a separate
  table / list / card view for each group.

Each view will have the following general functionality:

- [ ] **Adding / Removing Fields**: You can easily add/remove fields. Autocompletion is supported.
- [ ] **Picking How Fields Render**: You can either render field values directly, or choose how to render them (as
  progress, as stars/ratings, as one of a fixed set of values, etc.).
- [ ] **Sorting by Expression / Field**: You can sort on arbitrary fields.
- [ ] **Filter by Expression / Field**: You can filter on arbitrary fields.
- [ ] **Inline Editing**: Fields can be directly edited by clicking on them; most editing is just textual inline
  editing, though ratings / dropdowns will have special behavior.
- [X] **Pagination**: For performance reasons, all views are paginated (configurable to 10, 20, 50, 100, 250 or a custom
  granularity).
- [X] **Live Reloading**: Views automatically update whenever the result of their query changes.
- [ ] **Embed Support**: Most views should play nice with embeds (images, PDFs, other markdown files).
- [ ] **Add New Element**: Views will support adding new pages automatically via a template; this template can be
  configured or use an existing Obsidian template file.

Additionally, there is potential for a few extra nice features:

- [X] **View Pages**: Special page types which are just Datacore views and which can be put into the side bar or as
  regular pages.

## Data Input

Obsidian has some native support for editing metadata at the page level, and has recommended that Datacore move
away from inline fields (since they are much more bespoke). Inline fields will still be supported for users who prefer
it, but the following ways to add metadata will be added:

- [X] **Inline YAML**: You will be able to place YAML objects anywhere in the document and mark it `inline` to have it
  add additional metadata to the page / section.
- [X] **Inline Objects**: You will be able to define YAML codeblocks as "objects", which are searchable independent of
  the page they are on (for example, "exercise" objects).
- [X] **Sections**: Sections can be treated as objects and are directly queryable.
- [X] **Tasks**: Tasks can be directly queried and are more performant; metadata can be added using the Task plugin
  emoji or inline fields.

## Comprehensibility

Dataview can be very frustrating to debug if it fails or lags; some new features are being added to make things more
clear.

- [X] **Auto-limit**: Queries will autromatically be limited to the top 50/100 results to prevent serious rendering
  lagging. Rendering large objects (such as markdown pages) will show abbreviated views that are much more performant.
- [X] **Query Time**: All views will have timing information showing total time it took to query, render, and update.
- [X] **Indexing Activity**: A new indicator on the bottom of the screen will show how indexing is going visually and
  average index time per file.
- [ ] **Log**: Datacore will log any actions it takes (re-renders, indexes) with timing information for debugging. This
  data will be available in a simple log view which supports redacting file names for safely posting to support forums.

## Indexing

The kind of metadata that Datacore will index.

- [X] **Markdown Pages**: As expected. Should index sections, tasks, frontmatter, inline fields, and so on.
- [X] **Inline Fields**: Inline fields will be opt-in instead of on by default, so performance sensitive vaults can opt
  for inline YAML blocks or frontmatter instead, which are faster to parse.
- [X] **Sections**: Every section in markdown pages will be parsed, including the implicit "root" section (the first
  part of the page before any section headers).
- [X] **Tasks**: Tasks inside markdown pages will be parsed, along with various metadata from the **Tasks** plugin.
- [ ] **Canvas Files**: Canvas files will be indexed; each text node will be available to load, as well as all linked
  pages inside of the file.
- [ ] **Images**: Basic metadata - name, dimensions, format.
- [ ] **Videos**: Basic metadata - name, dimensions, format.
- [ ] **PDF Files**: Basic metadata - name, pages, format.

## Javascript API

- [X] **React-based Views**: Javascript swaps to using React for views, which eliminates the "flickering" during
  re-renders, and also allows for access to Datacore visual components.
- [X] **Index Queries**: Skip the "query rendering" step and directly access the backing database, which allows for much
  faster queries in exchange for less flexibility.
- [ ] **Script Imports**: Support `require()` inside of codeblocks; note that this will generally only works for scripts
  inside of the vault.

## Technical

Background pre-requisites; this is generally not user facing.

- [X] **Rate-limiting Background Importer**. Allow specifying a rate at which new files should be ingested, as well as
  how long in between consecutive file updates. Starting a vault with Datacore should introduce NO lag (by slowing down
  throttling).
    - This can generally be computed by estimating how long the average file import takes (potentially correlated with
      file length), and then scheduling file imports to reduce expected CPU time to X%.
- [ ] **Performance Controls**: Support choosing which files to index, what file types to index, and what subfeatures to
  index all to speed up performance.
    - All of these features will have timings which indicate how long they take, on average.
- [X] **Throttle Controls**: Set a percent allowance of how much CPU to use up for all Datacore tasks.
- [X] **File-based Persistence**: IndexedDB appears to have hard metadata limits and does not work for large vaults
  (where caching is most desparately needed). An alternative multi-file database (of sorted JSON documents), like LowDB
  or LevelDB, will work better.
- [X] **Rendering Ratelimiting**: Datacore should never crash Obsidian due to rendering a huge query. All queries have
  implicit limits which must be EXPLICITLY turned off. Renders automatically pause after 10 seconds pass.
- [ ] **NPM Publishing**: Publish the library and indexer to npm; other plugins can directly depend on it without
  requiring users to install Datacore itself.

## In What Order Will This Be Done?

Technical tasks will be completed first as they are generally required to implement everything else. Frontend
improvements take priority over extra features; Datacore is principally concerned with feeling like a natural experience
inside of Obsidian, closer to Notion tables.