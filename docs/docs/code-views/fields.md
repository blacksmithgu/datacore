---
title: Fields
sidebar_position: 300
---

Most datacore types support the "fields" API, which is a general set of methods for accessing frontmatter and inline fields efficiently. Any datacore
type with the `fields` type (queryable as `@fields`) supports these methods for loading metadata:

| **Method** | **Explanation** | **Example**
| - | - | - |
| `fields()` | Load full metadata for all fields available on the object. Returns a list of `Field` objects, which include the original key name, value, and raw unparsed value. | See field reference below. |
| `field(name)` | Load a field by the given name in a *case insensitive* manner. | `page.field("rating") => { key: "Rating", value: 7, raw: "7" }` |
| `value(name)` | Load the value of a field by the given name in a *case insensitive* manner. `page.value("rating") => 7` |

Both user-defined fields (like a `Rating` field in the Properties block), and intrinsic fields (prefixed with a `$`) can be loaded.

## Examples

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