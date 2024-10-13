# Class: MarkdownTaskItem

A specific task inside of a markdown list.

## Extends

- [`MarkdownListItem`](MarkdownListItem.md)

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

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$cleantext`](MarkdownListItem.md#$cleantext)

#### Defined in

[src/index/types/markdown.ts:609](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L609)

***

### $completed

> `get` **$completed**(): `boolean`

Determine if the given task is completed.

#### Returns

`boolean`

#### Defined in

[src/index/types/markdown.ts:701](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L701)

***

### $line

> `get` **$line**(): `number`

Get the line that this list item starts on.

#### Returns

`number`

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$line`](MarkdownListItem.md#$line)

#### Defined in

[src/index/types/markdown.ts:599](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L599)

***

### $lineCount

> `get` **$lineCount**(): `number`

The number of lines in this list item.

#### Returns

`number`

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$lineCount`](MarkdownListItem.md#$linecount)

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

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`fields`](MarkdownListItem.md#fields)

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

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`field`](MarkdownListItem.md#field)

#### Defined in

[src/index/types/markdown.ts:627](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L627)

***

### from()

> `static` **from**(`object`: `JsonMarkdownTaskItem`, `file`: `string`, `normalizer`: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md)): [`MarkdownTaskItem`](MarkdownTaskItem.md)

Create a list item from a serialized object.

#### Parameters

• **object**: `JsonMarkdownTaskItem`

• **file**: `string`

• **normalizer**: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md)

#### Returns

[`MarkdownTaskItem`](MarkdownTaskItem.md)

#### Overrides

[`MarkdownListItem`](MarkdownListItem.md).[`from`](MarkdownListItem.md#from)

#### Defined in

[src/index/types/markdown.ts:671](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L671)

***

### readableId()

> `static` **readableId**(`file`: `string`, `line`: `number`): `string`

Generate a readable ID for this item using the line number.

#### Parameters

• **file**: `string`

• **line**: `number`

#### Returns

`string`

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`readableId`](MarkdownListItem.md#readableid)

#### Defined in

[src/index/types/markdown.ts:656](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L656)

## Properties

### $blockId?

> `optional` **$blockId**: `string`

The block ID of this list item if present.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$blockId`](MarkdownListItem.md#$blockid)

#### Defined in

[src/index/types/markdown.ts:553](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L553)

***

### $elements

> **$elements**: [`MarkdownListItem`](MarkdownListItem.md)[]

Child elements of this list item.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$elements`](MarkdownListItem.md#$elements)

#### Defined in

[src/index/types/markdown.ts:543](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L543)

***

### $file

> **$file**: `string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$file`](MarkdownListItem.md#$file)

#### Defined in

[src/index/types/markdown.ts:538](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L538)

***

### $id

> **$id**: `string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$id`](MarkdownListItem.md#$id)

#### Defined in

[src/index/types/markdown.ts:537](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L537)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document, from key name -> metadata.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$infields`](MarkdownListItem.md#$infields)

#### Defined in

[src/index/types/markdown.ts:549](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L549)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$links`](MarkdownListItem.md#$links)

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

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$parentLine`](MarkdownListItem.md#$parentline)

#### Defined in

[src/index/types/markdown.ts:563](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L563)

***

### $position

> **$position**: `LineSpan`

The position of the list item in the file.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$position`](MarkdownListItem.md#$position)

#### Defined in

[src/index/types/markdown.ts:541](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L541)

***

### $status

> **$status**: `string`

The text inside of the task item.

#### Defined in

[src/index/types/markdown.ts:669](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L669)

***

### $symbol?

> `optional` **$symbol**: `string`

The marker used to start the list item (such as - or + or *). On a malformed task, may be undefined.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$symbol`](MarkdownListItem.md#$symbol)

#### Defined in

[src/index/types/markdown.ts:565](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L565)

***

### $tags

> **$tags**: `string`[]

Exact tags on this list item.

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$tags`](MarkdownListItem.md#$tags)

#### Defined in

[src/index/types/markdown.ts:547](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L547)

***

### $text?

> `optional` **$text**: `string`

The text contents of the list item.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$text`](MarkdownListItem.md#$text)

#### Defined in

[src/index/types/markdown.ts:567](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L567)

***

### $type

> **$type**: `string`

The type of list item that this element is.

#### Inherited from

[`MarkdownListItem`](MarkdownListItem.md).[`$type`](MarkdownListItem.md#$type)

#### Defined in

[src/index/types/markdown.ts:545](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L545)
