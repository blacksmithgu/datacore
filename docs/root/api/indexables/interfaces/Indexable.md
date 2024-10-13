# Interface: Indexable

Any indexable field, which must have a few index-relevant properties.

## Properties

### $file?

> `optional` **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Defined in

[src/index/types/indexable.ts:22](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L22)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Defined in

[src/index/types/indexable.ts:14](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L14)

***

### $parent?

> `optional` **$parent**: [`Indexable`](Indexable.md)

The indexable object that is the parent of this object. Only set after the object is actually indexed.

#### Defined in

[src/index/types/indexable.ts:18](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L18)

***

### $revision?

> `optional` **$revision**: `number`

If present, the revision in the index of this object.

#### Defined in

[src/index/types/indexable.ts:20](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L20)

***

### $typename

> **$typename**: `string`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Defined in

[src/index/types/indexable.ts:12](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L12)

***

### $types

> **$types**: `string`[]

The object types that this indexable is.

#### Defined in

[src/index/types/indexable.ts:10](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/indexable.ts#L10)
