# Class: MarkdownBlock

Base class for all markdown blocks.

## Extended by

- [`MarkdownListBlock`](MarkdownListBlock.md)
- [`MarkdownCodeblock`](MarkdownCodeblock.md)
- [`MarkdownDatablock`](MarkdownDatablock.md)

## Implements

- [`Indexable`](../interfaces/Indexable.md)
- [`Linkbearing`](../interfaces/Linkbearing.md)
- [`Taggable`](../interfaces/Taggable.md)
- `Fieldbearing`

## Accessors

### $link

> `get` **$link**(): `undefined` \| [`Link`](../../expressions/classes/Link.md)

If this block has a block ID, the link to this block.

#### Returns

`undefined` \| [`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/index/types/markdown.ts:313](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L313)

***

### fields

> `get` **fields**(): `Field`[]

All of the indexed fields in this object.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/markdown.ts:319](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L319)

## Methods

### field()

> **field**(`key`: `string`): `Field`

Fetch a specific field by key.

#### Parameters

• **key**: `string`

#### Returns

`Field`

#### Implementation of

`Fieldbearing.field`

#### Defined in

[src/index/types/markdown.ts:324](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L324)

***

### readableId()

> `static` **readableId**(`file`: `string`, `ordinal`: `number`): `string`

Generate a readable ID for this block using the ordinal of the block.

#### Parameters

• **file**: `string`

• **ordinal**: `number`

#### Returns

`string`

#### Defined in

[src/index/types/markdown.ts:350](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L350)

## Properties

### $blockId?

> `optional` **$blockId**: `string`

If present, the distinct block ID for this block.

#### Defined in

[src/index/types/markdown.ts:282](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L282)

***

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Defined in

[src/index/types/markdown.ts:269](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L269)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Defined in

[src/index/types/markdown.ts:268](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L268)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document, from key name -> metadata.

#### Defined in

[src/index/types/markdown.ts:280](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L280)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Defined in

[src/index/types/markdown.ts:278](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L278)

***

### $ordinal

> **$ordinal**: `number`

The index of this block in the file.

#### Defined in

[src/index/types/markdown.ts:272](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L272)

***

### $position

> **$position**: `LineSpan`

The position/extent of the block.

#### Defined in

[src/index/types/markdown.ts:274](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L274)

***

### $tags

> **$tags**: `string`[]

All tags on the block.

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Defined in

[src/index/types/markdown.ts:276](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L276)

***

### $type

> **$type**: `string`

The type of block - paragraph, list, and so on.

#### Defined in

[src/index/types/markdown.ts:284](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L284)

***

### $typename

> **$typename**: `string` = `"Block"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Defined in

[src/index/types/markdown.ts:267](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L267)

***

### $types

> **$types**: `string`[] = `MarkdownBlock.TYPES`

The object types that this indexable is.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$types`](../interfaces/Indexable.md#$types)

#### Defined in

[src/index/types/markdown.ts:266](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L266)
