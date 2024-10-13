# Class: MarkdownListBlock

Special block for markdown lists (of either plain list entries or tasks).

## Extends

- [`MarkdownBlock`](MarkdownBlock.md)

## Implements

- [`Taggable`](../interfaces/Taggable.md)
- [`Linkbearing`](../interfaces/Linkbearing.md)

## Accessors

### $link

> `get` **$link**(): `undefined` \| [`Link`](../../expressions/classes/Link.md)

If this block has a block ID, the link to this block.

#### Returns

`undefined` \| [`Link`](../../expressions/classes/Link.md)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$link`](MarkdownBlock.md#$link)

#### Defined in

[src/index/types/markdown.ts:313](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L313)

***

### fields

> `get` **fields**(): `Field`[]

All of the indexed fields in this object.

#### Returns

`Field`[]

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`fields`](MarkdownBlock.md#fields)

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

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`field`](MarkdownBlock.md#field)

#### Defined in

[src/index/types/markdown.ts:324](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L324)

***

### from()

> `static` **from**(`object`: `JsonMarkdownListBlock`, `file`: `string`, `normalizer`: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md)): [`MarkdownListBlock`](MarkdownListBlock.md)

Create a list block from a serialized value.

#### Parameters

• **object**: `JsonMarkdownListBlock`

• **file**: `string`

• **normalizer**: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md) = `NOOP_NORMALIZER`

#### Returns

[`MarkdownListBlock`](MarkdownListBlock.md)

#### Overrides

`MarkdownBlock.from`

#### Defined in

[src/index/types/markdown.ts:366](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L366)

***

### readableId()

> `static` **readableId**(`file`: `string`, `ordinal`: `number`): `string`

Generate a readable ID for this block using the ordinal of the block.

#### Parameters

• **file**: `string`

• **ordinal**: `number`

#### Returns

`string`

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`readableId`](MarkdownBlock.md#readableid)

#### Defined in

[src/index/types/markdown.ts:350](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L350)

## Properties

### $blockId?

> `optional` **$blockId**: `string`

If present, the distinct block ID for this block.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$blockId`](MarkdownBlock.md#$blockid)

#### Defined in

[src/index/types/markdown.ts:282](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L282)

***

### $elements

> **$elements**: [`MarkdownListItem`](MarkdownListItem.md)[]

The list items inside of this block.

#### Defined in

[src/index/types/markdown.ts:363](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L363)

***

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$file`](MarkdownBlock.md#$file)

#### Defined in

[src/index/types/markdown.ts:269](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L269)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$id`](MarkdownBlock.md#$id)

#### Defined in

[src/index/types/markdown.ts:268](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L268)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document, from key name -> metadata.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$infields`](MarkdownBlock.md#$infields)

#### Defined in

[src/index/types/markdown.ts:280](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L280)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$links`](MarkdownBlock.md#$links)

#### Defined in

[src/index/types/markdown.ts:278](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L278)

***

### $ordinal

> **$ordinal**: `number`

The index of this block in the file.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$ordinal`](MarkdownBlock.md#$ordinal)

#### Defined in

[src/index/types/markdown.ts:272](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L272)

***

### $position

> **$position**: `LineSpan`

The position/extent of the block.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$position`](MarkdownBlock.md#$position)

#### Defined in

[src/index/types/markdown.ts:274](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L274)

***

### $tags

> **$tags**: `string`[]

All tags on the block.

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$tags`](MarkdownBlock.md#$tags)

#### Defined in

[src/index/types/markdown.ts:276](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L276)

***

### $type

> **$type**: `string`

The type of block - paragraph, list, and so on.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$type`](MarkdownBlock.md#$type)

#### Defined in

[src/index/types/markdown.ts:284](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L284)
