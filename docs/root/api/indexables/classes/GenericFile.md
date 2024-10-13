# Class: GenericFile

Datacore representation of a generic file with no additional parsing.

## Implements

- [`File`](../interfaces/File.md)
- [`Indexable`](../interfaces/Indexable.md)
- `Fieldbearing`
- [`Linkable`](../interfaces/Linkable.md)

## Accessors

### $file

> `get` **$file**(): `string`

The file for the file is the file.

#### Returns

`string`

The file that this indexable was derived from, if file-backed.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$file`](../interfaces/Indexable.md#$file)

#### Defined in

[src/index/types/files.ts:56](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L56)

***

### $id

> `get` **$id**(): `string`

Unique ID for this object.

#### Returns

`string`

The unique index ID for this object.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$id`](../interfaces/Indexable.md#$id)

#### Defined in

[src/index/types/files.ts:51](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L51)

***

### $link

> `get` **$link**(): [`Link`](../../expressions/classes/Link.md)

A link to the file.

#### Returns

[`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Implementation of

[`Linkable`](../interfaces/Linkable.md).[`$link`](../interfaces/Linkable.md#$link)

#### Defined in

[src/index/types/files.ts:61](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L61)

***

### fields

> `get` **fields**(): `Field`[]

Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/files.ts:37](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L37)

## Methods

### field()

> **field**(`key`: `string`): `Field`

Fetch a field with the given name if it is present on this object.

#### Parameters

• **key**: `string`

#### Returns

`Field`

#### Implementation of

`Fieldbearing.field`

#### Defined in

[src/index/types/files.ts:41](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L41)

***

### value()

> **value**(`key`: `string`): `undefined` \| [`Literal`](../../expressions/type-aliases/Literal.md)

Get the value for the given field.

#### Parameters

• **key**: `string`

#### Returns

`undefined` \| [`Literal`](../../expressions/type-aliases/Literal.md)

#### Defined in

[src/index/types/files.ts:46](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L46)

## Properties

### $ctime

> **$ctime**: `DateTime`

Obsidian-provided date this page was created.

#### Implementation of

[`File`](../interfaces/File.md).[`$ctime`](../interfaces/File.md#$ctime)

#### Defined in

[src/index/types/files.ts:19](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L19)

***

### $extension

> **$extension**: `string`

The extension of the file.

#### Implementation of

[`File`](../interfaces/File.md).[`$extension`](../interfaces/File.md#$extension)

#### Defined in

[src/index/types/files.ts:25](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L25)

***

### $mtime

> **$mtime**: `DateTime`

Obsidian-provided date this page was modified.

#### Implementation of

[`File`](../interfaces/File.md).[`$mtime`](../interfaces/File.md#$mtime)

#### Defined in

[src/index/types/files.ts:21](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L21)

***

### $path

> **$path**: `string`

The path this file exists at.

#### Implementation of

[`File`](../interfaces/File.md).[`$path`](../interfaces/File.md#$path)

#### Defined in

[src/index/types/files.ts:17](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L17)

***

### $size

> **$size**: `number`

Obsidian-provided size of this page in bytes.

#### Implementation of

[`File`](../interfaces/File.md).[`$size`](../interfaces/File.md#$size)

#### Defined in

[src/index/types/files.ts:23](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L23)

***

### $typename

> **$typename**: `string` = `"File"`

Textual description of the object, such as `Page` or `Section`. Used in visualizations.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$typename`](../interfaces/Indexable.md#$typename)

#### Defined in

[src/index/types/files.ts:15](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L15)

***

### $types

> **$types**: `string`[] = `GenericFile.TYPES`

The object types that this indexable is.

#### Implementation of

[`Indexable`](../interfaces/Indexable.md).[`$types`](../interfaces/Indexable.md#$types)

#### Defined in

[src/index/types/files.ts:14](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/files.ts#L14)
