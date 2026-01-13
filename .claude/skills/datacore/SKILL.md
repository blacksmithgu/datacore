---
name: datacore
description: Create Datacore views using JSX/React syntax and the dc.* API. Use when the user mentions Datacore, dc.useQuery, JSX views, or React-based vault queries. Datacore is the successor to Dataview with better performance and interactive views.
---

# Datacore Skill

This skill enables Claude Code to create valid Datacore views for dynamic, interactive content in Obsidian.

## Overview

Datacore is a work-in-progress successor to Dataview with:
- 2-10x better query and rendering performance
- React/JSX-based views with state management
- Interactive tables with live editing
- Section and block-level querying
- Flickerless updates on vault changes

## Installation

Datacore is in beta. Install via BRAT plugin using: `https://github.com/blacksmithgu/datacore`

## Basic View Structure

All Datacore views use JSX in a `datacorejsx` code block:

````markdown
```datacorejsx
return function View() {
    const pages = dc.useQuery("@page");
    return <p>You have {pages.length} pages in your vault!</p>;
}
```
````

## Query Syntax

### Type Queries

Fetch objects by type using `@type`:

| Query | Returns |
|-------|--------|
| `@file` | All files |
| `@page` | All markdown pages |
| `@section` | All markdown sections |
| `@block` | All markdown blocks |
| `@block-list` | Blocks containing lists |
| `@codeblock` | Markdown codeblocks |
| `@datablock` | Datacore yaml:data blocks |
| `@list-item` | All list items |
| `@task` | Task items (`- [ ]` format) |

### Filter Functions

```javascript
// Tags
dc.useQuery("@page and #tag")
dc.useQuery("@page and #category/subtag")

// Paths
dc.useQuery('@page and path("folder/subfolder")')

// Links
dc.useQuery("@page and connected([[Note]])")    // Links to or from
dc.useQuery("@page and linkedto([[Note]])")     // Links TO this note
dc.useQuery("@page and linkedfrom([[Note]])")   // Links FROM this note

// Field existence
dc.useQuery("@page and exists(rating)")

// Hierarchy
dc.useQuery("@section and parentof(@task)")     // Sections containing tasks
dc.useQuery("@task and childof(@section and $name = 'Daily')")
dc.useQuery("@page and subtree(@codeblock)")    // Pages with codeblocks
```

### Expressions

Filter by field values:

```javascript
dc.useQuery("@page and rating >= 9")
dc.useQuery('@page and $name != "Index"')
dc.useQuery('@page and $name.contains("Daily")')
dc.useQuery("@task and $completed = false")
dc.useQuery('@page and $tags.contains("#project")')
```

### Operators

| Operator | Description |
|----------|-------------|
| `and` | Both conditions required |
| `or` | Either condition matches |
| `!` or `not` | Negates query |

### Complex Query Examples

```javascript
// High-rated games
dc.useQuery("@page and #game and rating >= 9")

// Incomplete tasks in Daily sections
dc.useQuery('@task and $completed = false and childof(@section and $name = "Daily")')

// Projects linked to a coworker
dc.useQuery("@page and #project and linkedto([[Coworker]])")

// Pages containing Datacore code
dc.useQuery('@page and parentof(@codeblock and $languages.contains("datacorejs"))')
```

## Intrinsic Fields

All intrinsic fields are prefixed with `$`:

| Field | Type | Description |
|-------|------|-------------|
| `$name` | String | File/object name |
| `$path` | String | Full file path |
| `$file` | File | Source file reference |
| `$tags` | Array | All tags (deduplicated) |
| `$links` | Array | All links (deduplicated) |
| `$link` | Link | Link to this object |
| `$types` | Array | Object type classifications |
| `$parent` | Object | Parent object reference |
| `$sections` | Array | Child sections (for pages) |
| `$frontmatter` | Object | YAML properties |
| `$completed` | Boolean | Task completion status |
| `$scheduled` | Date | Task scheduled date |
| `$due` | Date | Task due date |

Access user-defined fields without `$` prefix:

```javascript
page.rating        // User field
page.$name         // Intrinsic field
page.value("key")  // Alternative access
```

## Query Hooks

### dc.useQuery(query, options?)

Execute a query, returns array of results:

```javascript
const pages = dc.useQuery("@page and #project");
const tasks = dc.useQuery("@task and $completed = false");
```

Options: `{ debounce: milliseconds }`

### dc.useFullQuery(query, options?)

Returns detailed result object:

```javascript
const result = dc.useFullQuery("@page");
// result.query - Parsed query
// result.results - Matched items
// result.duration - Execution time (seconds)
// result.revision - Index revision
```

### dc.useCurrentFile(options?)

Get metadata for current file:

```javascript
const file = dc.useCurrentFile();
return <p>This file: {file.$name}</p>;
```

### dc.useCurrentPath(options?)

Get path of current file:

```javascript
const path = dc.useCurrentPath();
```

### dc.useIndexUpdates(options?)

Returns current index revision (for manual refresh triggers):

```javascript
const revision = dc.useIndexUpdates();
```

## Components

### dc.List

Render a bullet list:

```javascript
return function View() {
    const pages = dc.useQuery("@page and #tag");
    return <dc.List rows={pages} renderer={page => page.$link} />;
}
```

Properties:
- `rows` - Data array
- `renderer` - Function to render each item
- `paging={true}` - Enable pagination
- `type="ordered"` - Numbered list
- `type="block"` - Block-style list

### dc.Table

Render a table:

```javascript
const COLUMNS = [
    { id: "Name", value: page => page.$link },
    { id: "Rating", value: page => page.rating },
    { id: "Tags", value: page => page.$tags.join(", ") }
];

return function View() {
    const pages = dc.useQuery("@page and #game");
    return <dc.Table columns={COLUMNS} rows={pages} />;
}
```

### dc.Card

Render a card:

```javascript
<dc.Card title="Title" content="Content" footer="Footer" />
```

### dc.Callout

Render an Obsidian callout:

```javascript
<dc.Callout title="Note" type="info" collapsible={true} open={true}>
    Content here
</dc.Callout>
```

### dc.Markdown

Render markdown content:

```javascript
<dc.Markdown content={`
# Header
Some **bold** text
`} />
```

### dc.embed

Use as renderer to embed note contents:

```javascript
<dc.List rows={pages} renderer={dc.embed} />
```

## React Hooks

Datacore forwards standard React hooks:

```javascript
dc.useState(initialValue)
dc.useReducer(reducer, initialState)
dc.useMemo(callback, deps)
dc.useCallback(callback, deps)
dc.useEffect(callback, deps)
dc.useRef(initialValue)
dc.createContext(defaultValue)
dc.useContext(context)
```

### dc.useArray(array, callback, deps?)

Transform arrays with chained operations:

```javascript
const sorted = dc.useArray(pages, arr =>
    arr.sort(p => p.$name)
);

const filtered = dc.useArray(pages, arr =>
    arr.filter(p => p.rating > 5).sort(p => p.rating, "desc")
);
```

## Direct Query Methods

For non-reactive queries:

```javascript
dc.query("@page")           // Returns array, throws on error
dc.tryQuery("@page")        // Returns { successful, value?, error? }
dc.fullquery("@page")       // Returns detailed result object
dc.tryFullQuery("@page")    // Safe version with Result type
```

## Link Utilities

```javascript
dc.resolvePath("note.md", sourcePath)    // Resolve to absolute path
dc.fileLink("path/to/file.md")           // Create file link
dc.headerLink("file.md", "Header")       // Link to header
dc.blockLink("file.md", "blockid")       // Link to block
dc.parseLink("[[Note]]")                 // Parse link string
dc.tryParseLink("[[Note]]")              // Safe parsing
```

## Expression Evaluation

```javascript
dc.evaluate("rating >= 5", { rating: 7 })
dc.tryEvaluate("$name.contains('Daily')", variables)
```

## Type Coercion

```javascript
dc.coerce.string(value)     // To string
dc.coerce.boolean(value)    // Parse "true"/"false"
dc.coerce.number(value)     // Parse number
dc.coerce.date(value)       // Parse ISO date
dc.coerce.duration(value)   // Parse "14 hours", "30m"
dc.coerce.link(value)       // Parse link syntax
dc.coerce.array(value)      // Wrap non-arrays
```

## Complete Examples

### Project Dashboard

````markdown
```datacorejsx
const COLUMNS = [
    { id: "Project", value: p => p.$link },
    { id: "Status", value: p => p.status || "—" },
    { id: "Priority", value: p => p.priority || "—" },
    { id: "Due", value: p => p.due || "—" }
];

return function View() {
    const projects = dc.useQuery("@page and #project");
    const sorted = dc.useArray(projects, arr =>
        arr.sort(p => p.priority, "desc")
    );
    return <dc.Table columns={COLUMNS} rows={sorted} />;
}
```
````

### Task List with Filtering

````markdown
```datacorejsx
return function View() {
    const [showCompleted, setShowCompleted] = dc.useState(false);

    const query = showCompleted
        ? "@task"
        : "@task and $completed = false";

    const tasks = dc.useQuery(query);

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={e => setShowCompleted(e.target.checked)}
                />
                Show completed
            </label>
            <dc.List rows={tasks} renderer={t => t.$link} />
        </div>
    );
}
```
````

### Daily Note Tasks

````markdown
```datacorejsx
return function View() {
    const file = dc.useCurrentFile();
    const tasks = dc.useQuery(`
        @task
        and $completed = false
        and childof(@page and $path = "${file.$path}")
    `);

    return tasks.length > 0 ? (
        <dc.Callout title="Tasks" type="todo">
            <dc.List rows={tasks} renderer={t => t.text} />
        </dc.Callout>
    ) : <p>No tasks!</p>;
}
```
````

### Search Interface

````markdown
```datacorejsx
return function View() {
    const [filter, setFilter] = dc.useState("");

    const pages = dc.useQuery("@page");
    const filtered = dc.useArray(pages, arr =>
        arr.filter(p =>
            p.$name.toLowerCase().includes(filter.toLowerCase())
        )
    );

    return (
        <div>
            <input
                type="text"
                placeholder="Search..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
            />
            <dc.List rows={filtered.slice(0, 20)} renderer={p => p.$link} />
        </div>
    );
}
```
````

### Tag Cloud

````markdown
```datacorejsx
return function View() {
    const pages = dc.useQuery("@page");

    const tagCounts = dc.useMemo(() => {
        const counts = {};
        pages.forEach(p => {
            (p.$tags || []).forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    }, [pages]);

    return (
        <p>
            {tagCounts.map(([tag, count]) =>
                `${tag} (${count})`
            ).join(" | ")}
        </p>
    );
}
```
````

## Differences from Dataview

| Aspect | Dataview | Datacore |
|--------|----------|----------|
| Query language | DQL (SQL-like) | JSX/JavaScript |
| Views | Static renders | React components |
| State | None | `dc.useState`, etc. |
| Interactivity | Read-only | Live editing |
| Performance | Good | 2-10x faster |
| Granularity | Page-level | Section/block level |

## References

- [Datacore Documentation](https://blacksmithgu.github.io/datacore/)
- [Datacore GitHub](https://github.com/blacksmithgu/datacore)
- [Getting Started Guide](https://obsidian.rocks/getting-started-with-datacore/)
