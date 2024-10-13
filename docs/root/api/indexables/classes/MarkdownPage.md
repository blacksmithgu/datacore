# Class: MarkdownPage

A markdown file in the vault; the source of most metadata.

## Implements

- [`File`](../interfaces/File.md)
- [`Linkbearing`](../interfaces/Linkbearing.md)
- [`Taggable`](../interfaces/Taggable.md)
- [`Indexable`](../interfaces/Indexable.md)
- `Fieldbearing`

## Accessors

### $file

> `get` **$file**(): `string`

The file that this indexable was derived from, if file-backed.

#### Returns

`string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Defined in

[src/index/types/markdown.ts:49](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L49)

***

### $id

> `get` **$id**(): `string`

The unique index ID for this object.

#### Returns

`string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Defined in

[src/index/types/markdown.ts:45](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L45)

***

### $lineCount

> `get` **$lineCount**(): `number`

Return the number of lines in the document.

#### Returns

`number`

#### Defined in

[src/index/types/markdown.ts:106](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L106)

***

### $link

> `get` **$link**(): [`Link`](../../expressions/classes/Link.md)

A link to this file.

#### Returns

[`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Implementation of

[`File`](../interfaces/File.md).[`$link`](../interfaces/File.md#$link)

#### Defined in

[src/index/types/markdown.ts:116](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L116)

***

### $name

> `get` **$name**(): `string`

The name of the file.

#### Returns

`string`

#### Defined in

[src/index/types/markdown.ts:111](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L111)

***

### fields

> `get` **fields**(): `Field`[]

All of the indexed fields in this object.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/markdown.ts:121](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L121)

## Methods

### field()

> **field**(`key`: `string`): `undefined` \| `Field`

Get the full field definition for the given field.

#### Parameters

• **key**: `string`

#### Returns

`undefined` \| `Field`

#### Implementation of

`Fieldbearing.field`

#### Defined in

[src/index/types/markdown.ts:126](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L126)

***

### json()

> **json**(): `JsonMarkdownPage`

Convert this page into it's partial representation for saving.

#### Returns

`JsonMarkdownPage`

#### Defined in

[src/index/types/markdown.ts:136](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L136)

***

### value()

> **value**(`key`: `string`): `undefined` \| [`Literal`](../../expressions/type-aliases/Literal.md)

Get the value for the given field.

#### Parameters

• **key**: `string`

#### Returns

`undefined` \| [`Literal`](../../expressions/type-aliases/Literal.md)

#### Defined in

[src/index/types/markdown.ts:131](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L131)

***

### from()

> `static` **from**(`raw`: `JsonMarkdownPage`, `normalizer`: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md)): [`MarkdownPage`](MarkdownPage.md)

Create a markdown file from the given raw values.

#### Parameters

• **raw**: `JsonMarkdownPage`

• **normalizer**: [`LinkNormalizer`](../type-aliases/LinkNormalizer.md) = `NOOP_NORMALIZER`

#### Returns

[`MarkdownPage`](MarkdownPage.md)

#### Defined in

[src/index/types/markdown.ts:81](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L81)

## Properties

### $ctime

> **$ctime**: `DateTime`

Obsidian-provided date this page was created.

#### Implementation of

[`File`](../interfaces/File.md).[`$ctime`](../interfaces/File.md#$ctime)

#### Defined in

[src/index/types/markdown.ts:61](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L61)

***

### $extension

> **$extension**: `string`

The extension; for markdown files, almost always '.md'.

#### Implementation of

[`File`](../interfaces/File.md).[`$extension`](../interfaces/File.md#$extension)

#### Defined in

[src/index/types/markdown.ts:65](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L65)

***

### $frontmatter?

> `optional` **$frontmatter**: `Record`\<`string`, [`FrontmatterEntry`](../interfaces/FrontmatterEntry.md)\>

Frontmatter values in the file, if present. Maps lower case frontmatter key -> entry.

#### Defined in

[src/index/types/markdown.ts:54](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L54)

***

### $infields

> **$infields**: `Record`\<`string`, `InlineField`\>

Map of all distinct inline fields in the document. Maps lower case key name -> full metadata.

#### Defined in

[src/index/types/markdown.ts:56](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L56)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

All links in the file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Defined in

[src/index/types/markdown.ts:73](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L73)

***

### $mtime

> **$mtime**: `DateTime`

Obsidian-provided date this page was modified.

#### Implementation of

[`File`](../interfaces/File.md).[`$mtime`](../interfaces/File.md#$mtime)

#### Defined in

[src/index/types/markdown.ts:63](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L63)

***

### $path

> **$path**: `string`

The path this file exists at.

#### Implementation of

[`File`](../interfaces/File.md).[`$path`](../interfaces/File.md#$path)

#### Defined in

[src/index/types/markdown.ts:59](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L59)

***

### $position

> **$position**: `LineSpan`

The full extent of the file (start 0, end the number of lines in the file.)

#### Defined in

[src/index/types/markdown.ts:69](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L69)

***

### $sections

> **$sections**: `MarkdownSection`[] = `[]`

All child markdown sections of this markdown file. The initial section before any content is special and is
named with the title of the file.

#### Defined in

[src/index/types/markdown.ts:78](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L78)

***

### $size

> **$size**: `number` = `0`

Obsidian-provided size of this page in bytes.

#### Implementation of

[`File`](../interfaces/File.md).[`$size`](../interfaces/File.md#$size)

#### Defined in

[src/index/types/markdown.ts:67](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L67)

***

### $tags

> **$tags**: `string`[]

The exact tags in the file.

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Defined in

[src/index/types/markdown.ts:71](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L71)

***

### $typename

> **$typename**: `string` = `"Page"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Defined in

[src/index/types/markdown.ts:42](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L42)

***

### $types

> **$types**: `string`[] = `MarkdownPage.TYPES`

The object types that this indexable is.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$types`](../interfaces/Indexable.md#$types)

#### Defined in

[src/index/types/markdown.ts:41](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L41)

***

### TYPES

> `static` **TYPES**: `string`[]

All of the types that a markdown file is.

#### Defined in

[src/index/types/markdown.ts:38](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L38)
