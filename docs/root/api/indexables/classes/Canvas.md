# Class: Canvas

A canvas file, consisting of a set of canvas cards.

## Implements

- [`Linkable`](../interfaces/Linkable.md)
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

[src/index/types/canvas.ts:42](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L42)

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

[src/index/types/canvas.ts:46](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L46)

***

### $link

> `get` **$link**(): [`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Returns

[`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Implementation of

[`File`](../interfaces/File.md).[`$link`](../interfaces/File.md#$link)

#### Defined in

[src/index/types/canvas.ts:50](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L50)

***

### fields

> `get` **fields**(): `Field`[]

Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/canvas.ts:65](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L65)

## Methods

### field()

> **field**(`key`: `string`): `undefined` \| `Field`

Fetch a field with the given name if it is present on this object.

#### Parameters

• **key**: `string`

#### Returns

`undefined` \| `Field`

#### Implementation of

`Fieldbearing.field`

#### Defined in

[src/index/types/canvas.ts:69](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L69)

## Properties

### $ctime

> **$ctime**: `DateTime`

Obsidian-provided date this page was created.

#### Implementation of

[`File`](../interfaces/File.md).[`$ctime`](../interfaces/File.md#$ctime)

#### Defined in

[src/index/types/canvas.ts:37](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L37)

***

### $extension

> **$extension**: `string` = `"canvas"`

The extension of the file.

#### Implementation of

[`File`](../interfaces/File.md).[`$extension`](../interfaces/File.md#$extension)

#### Defined in

[src/index/types/canvas.ts:40](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L40)

***

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

The links in this file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Defined in

[src/index/types/canvas.ts:58](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L58)

***

### $mtime

> **$mtime**: `DateTime`

Obsidian-provided date this page was modified.

#### Implementation of

[`File`](../interfaces/File.md).[`$mtime`](../interfaces/File.md#$mtime)

#### Defined in

[src/index/types/canvas.ts:38](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L38)

***

### $path

> **$path**: `string`

The path this file exists at.

#### Implementation of

[`File`](../interfaces/File.md).[`$path`](../interfaces/File.md#$path)

#### Defined in

[src/index/types/canvas.ts:54](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L54)

***

### $size

> **$size**: `number` = `0`

Obsidian-provided size of this page in bytes.

#### Implementation of

[`File`](../interfaces/File.md).[`$size`](../interfaces/File.md#$size)

#### Defined in

[src/index/types/canvas.ts:56](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L56)

***

### $tags

> **$tags**: `string`[]

The exact tags on this object. (#a/b/c or #foo/bar).

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Defined in

[src/index/types/canvas.ts:57](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L57)

***

### $typename

> **$typename**: `string` = `"Canvas"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Defined in

[src/index/types/canvas.ts:35](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L35)

***

### $types

> **$types**: `string`[] = `Canvas.TYPES`

The object types that this indexable is.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$types`](../interfaces/Indexable.md#$types)

#### Defined in

[src/index/types/canvas.ts:34](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/canvas.ts#L34)
