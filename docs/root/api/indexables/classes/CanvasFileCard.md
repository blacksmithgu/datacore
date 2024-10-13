# Class: CanvasFileCard

Canvas card that is just a file embedding.

## Extends

- `BaseCanvasCard`

## Implements

- [`Indexable`](../interfaces/Indexable.md)

## Accessors

### $link

> `get` **$link**(): [`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Inherited from

`BaseCanvasCard.$link`

#### Defined in

[src/index/types/canvas.ts:139](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L139)

## Properties

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Inherited from

`BaseCanvasCard.$file`

#### Defined in

[src/index/types/canvas.ts:132](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L132)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Inherited from

`BaseCanvasCard.$id`

#### Defined in

[src/index/types/canvas.ts:128](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L128)

***

### $parent?

> `optional` **$parent**: [`Indexable`](../interfaces/Indexable.md)

The indexable object that is the parent of this object. Only set after the object is actually indexed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$parent`](../interfaces/Indexable.md#$parent)

#### Inherited from

`BaseCanvasCard.$parent`

#### Defined in

[src/index/types/canvas.ts:131](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L131)

***

### $revision?

> `optional` **$revision**: `number`

If present, the revision in the index of this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$revision`](../interfaces/Indexable.md#$revision)

#### Inherited from

`BaseCanvasCard.$revision`

#### Defined in

[src/index/types/canvas.ts:127](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L127)
