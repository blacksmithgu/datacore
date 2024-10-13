# Class: MarkdownDatablock

A data-annotated YAML codeblock.

## Extends

- [`MarkdownBlock`](MarkdownBlock.md)

## Implements

- [`Indexable`](../interfaces/Indexable.md)
- `Fieldbearing`
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

[src/index/types/markdown.ts:313](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L313)

***

### fields

> `get` **fields**(): `Field`[]

All of the indexed fields in this object.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Overrides

[`MarkdownBlock`](MarkdownBlock.md).[`fields`](MarkdownBlock.md#fields)

#### Defined in

[src/index/types/markdown.ts:502](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L502)

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

#### Overrides

[`MarkdownBlock`](MarkdownBlock.md).[`field`](MarkdownBlock.md#field)

#### Defined in

[src/index/types/markdown.ts:507](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L507)

***

### readableId()

> `static` **readableId**(`file`: `string`, `line`: `number`): `string`

Generate a readable ID for this block using the ordinal of the block.

#### Parameters

• **file**: `string`

• **line**: `number`

#### Returns

`string`

#### Overrides

[`MarkdownBlock`](MarkdownBlock.md).[`readableId`](MarkdownBlock.md#readableid)

#### Defined in

[src/index/types/markdown.ts:521](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L521)

## Properties

### $blockId?

> `optional` **$blockId**: `string`

If present, the distinct block ID for this block.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$blockId`](MarkdownBlock.md#$blockid)

#### Defined in

[src/index/types/markdown.ts:282](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L282)

***

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$file`](MarkdownBlock.md#$file)

#### Defined in

[src/index/types/markdown.ts:269](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L269)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$id`](MarkdownBlock.md#$id)

#### Defined in

[src/index/types/markdown.ts:268](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L268)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document, from key name -> metadata.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$infields`](MarkdownBlock.md#$infields)

#### Defined in

[src/index/types/markdown.ts:280](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L280)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$links`](MarkdownBlock.md#$links)

#### Defined in

[src/index/types/markdown.ts:278](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L278)

***

### $ordinal

> **$ordinal**: `number`

The index of this block in the file.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$ordinal`](MarkdownBlock.md#$ordinal)

#### Defined in

[src/index/types/markdown.ts:272](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L272)

***

### $position

> **$position**: `LineSpan`

The position/extent of the block.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$position`](MarkdownBlock.md#$position)

#### Defined in

[src/index/types/markdown.ts:274](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L274)

***

### $tags

> **$tags**: `string`[]

All tags on the block.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$tags`](MarkdownBlock.md#$tags)

#### Defined in

[src/index/types/markdown.ts:276](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L276)

***

### $type

> **$type**: `string`

The type of block - paragraph, list, and so on.

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$type`](MarkdownBlock.md#$type)

#### Defined in

[src/index/types/markdown.ts:284](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L284)

***

### $typename

> **$typename**: `string` = `"Block"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Inherited from

[`MarkdownBlock`](MarkdownBlock.md).[`$typename`](MarkdownBlock.md#$typename)

#### Defined in

[src/index/types/markdown.ts:267](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/markdown.ts#L267)
