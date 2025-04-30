---
title: Fields
sidebar_position: 200
---

Datacore supports loading and querying by user-provided frontmatter and inline fields, known generally as a "field".

## How Are User Fields Specified?

You can specify custom metadata in two ways:

1. **Properties**: Also known as frontmatter, you can add properties to top level pages which datacore will make available for searches and queries.
2. **Inline Fields**: You can add 'inline' metadata anywhere in the page via the `[key:: value]` syntax.

> *Note*: Properties are officially supported by Obsidian but inline fields are not; when possible, consider using properties and tags over inline fields.

## In Queries and Expressions

You can reference fields directly by name in queries and datacore expressions. This is case-insensitive.

```js
// References the 'rating' field directly.
@page and rating >= 7

// You can also reference intrinsic fields (fields prefixed with `$`):
@block and $tags.contains("#test")

// Use the implicit 'row' in order to handle fields with spaces in their names:
@section and row["last reviewed"] >= date(now) - dur(7d)
```

## In Javascript

Most datacore javascript types support the "fields" API, which is a general set of methods for accessing frontmatter and inline fields efficiently. Any datacore
type with the `fields` type (queryable as `@fields`) supports these methods for loading metadata:

| **Method** | **Explanation** | **Example**
| - | - | - |
| `fields()` | Load full metadata for all fields available on the object. Returns a list of `Field` objects, which include the original key name, value, and raw unparsed value. | See field reference below. |
| `field(name)` | Load a field by the given name in a *case insensitive* manner. | `page.field("rating") => { key: "Rating", value: 7, raw: "7" }` |
| `value(name)` | Load the value of a field by the given name in a *case insensitive* manner. `page.value("rating") => 7` |

Both user-defined fields (like a `Rating` field in the Properties block), and intrinsic fields (prefixed with a `$`) can be loaded.

## Examples

```js
// Load the 'rating' field from the current page.
dc.currentFile().value("rating")

// Get the raw, unparsed value of a field from frontmatter.
dc.currentFile().field("complex-date").raw
```


## Field Type Reference

```js
export interface Field {
    /** The canonical key name for the field (i.e., as it actually shows up in the data structure). */
    key: string;
    /** The value of the field. */
    value: Literal;
    /** The raw value of the field before parsing, if relevant. */
    raw?: string;
    /** If present, describes where the field came from in precise detail, allowing the field to be edited. */
    provenance?: Provenance;
}
```