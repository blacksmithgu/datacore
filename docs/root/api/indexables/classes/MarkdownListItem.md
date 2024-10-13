# Class: MarkdownListItem

A specific list item in a list.

## Extended by

- [`MarkdownTaskItem`](MarkdownTaskItem.md)

## Implements

- [`Indexable`](../interfaces/Indexable.md)
- [`Linkbearing`](../interfaces/Linkbearing.md)
- [`Taggable`](../interfaces/Taggable.md)
- `Fieldbearing`

## Accessors

### $cleantext

> `get` **$cleantext**(): `string`

Cleaned text that is garaunteed to be non-null and has indenation and inline fields removed.

#### Returns

`string`

#### Defined in

[src/index/types/markdown.ts:609](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L609)

***

### $line

> `get` **$line**(): `number`

Get the line that this list item starts on.

#### Returns

`number`

#### Defined in

[src/index/types/markdown.ts:599](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L599)

***

### $lineCount

> `get` **$lineCount**(): `number`

The number of lines in this list item.

#### Returns

`number`

#### Defined in

[src/index/types/markdown.ts:604](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L604)

***

### fields

> `get` **fields**(): `Field`[]

All of the indexed fields in this object.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/markdown.ts:622](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L622)

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

[src/index/types/markdown.ts:627](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L627)

***

### from()

> `static` **from**(`object`: `JsonMarkdownListItem`, `file`: `string`, `normalizer`: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md)): [`MarkdownListItem`](MarkdownListItem.md)

Create a list item from a serialized object.

#### Parameters

• **object**: `JsonMarkdownListItem`

• **file**: `string`

• **normalizer**: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md) = `NOOP_NORMALIZER`

#### Returns

[`MarkdownListItem`](MarkdownListItem.md)

#### Defined in

[src/index/types/markdown.ts:570](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L570)

***

### readableId()

> `static` **readableId**(`file`: `string`, `line`: `number`): `string`

Generate a readable ID for this item using the line number.

#### Parameters

• **file**: `string`

• **line**: `number`

#### Returns

`string`

#### Defined in

[src/index/types/markdown.ts:656](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L656)

## Properties

### $blockId?

> `optional` **$blockId**: `string`

The block ID of this list item if present.

#### Defined in

[src/index/types/markdown.ts:553](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L553)

***

### $elements

> **$elements**: [`MarkdownListItem`](MarkdownListItem.md)[]

Child elements of this list item.

#### Defined in

[src/index/types/markdown.ts:543](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L543)

***

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Defined in

[src/index/types/markdown.ts:538](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L538)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Defined in

[src/index/types/markdown.ts:537](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L537)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document, from key name -> metadata.

#### Defined in

[src/index/types/markdown.ts:549](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L549)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Defined in

[src/index/types/markdown.ts:551](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L551)

***

### $parentLine

> **$parentLine**: `number`

The line number of the parent of this list item.
If a positive number, then this list element is a child
of the list element at that line.

If a negative number, then this list element is a root element
of a list starting at that line (negated). I.e., -7 means
this is a root element of the list starting at line 7.

#### Defined in

[src/index/types/markdown.ts:563](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L563)

***

### $position

> **$position**: `LineSpan`

The position of the list item in the file.

#### Defined in

[src/index/types/markdown.ts:541](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L541)

***

### $symbol?

> `optional` **$symbol**: `string`

The marker used to start the list item (such as - or + or *). On a malformed task, may be undefined.

#### Defined in

[src/index/types/markdown.ts:565](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L565)

***

### $tags

> **$tags**: `string`[]

Exact tags on this list item.

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Defined in

[src/index/types/markdown.ts:547](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L547)

***

### $text?

> `optional` **$text**: `string`

The text contents of the list item.

#### Defined in

[src/index/types/markdown.ts:567](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L567)

***

### $type

> **$type**: `string`

The type of list item that this element is.

#### Defined in

[src/index/types/markdown.ts:545](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L545)

***

### $typename

> **$typename**: `string` = `"List Item"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Defined in

[src/index/types/markdown.ts:536](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L536)

***

### $types

> **$types**: `string`[] = `MarkdownListItem.TYPES`

The object types that this indexable is.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$types`](../interfaces/Indexable.md#$types)

#### Defined in

[src/index/types/markdown.ts:535](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L535)
