# Class: Link

The Obsidian 'link', used for uniquely describing a file, header, or block.

## Methods

### displayOrDefault()

> **displayOrDefault**(): `string`

Obtain the display for this link if present, or return a simple default display.

#### Returns

`string`

#### Defined in

[src/expression/link.ts:153](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L153)

***

### equals()

> **equals**(`other`: [`Link`](Link.md)): `boolean`

Checks for link equality (i.e., that the links are pointing to the same exact location).

#### Parameters

• **other**: [`Link`](Link.md)

#### Returns

`boolean`

#### Defined in

[src/expression/link.ts:106](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L106)

***

### fileName()

> **fileName**(): `string`

The stripped name of the file this link points to.

#### Returns

`string`

#### Defined in

[src/expression/link.ts:173](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L173)

***

### fromEmbed()

> **fromEmbed**(): [`Link`](Link.md)

Convert this link into a non-embedded link.

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:139](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L139)

***

### markdown()

> **markdown**(): `string`

Convert this link to markdown so it can be rendered.

#### Returns

`string`

#### Defined in

[src/expression/link.ts:144](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L144)

***

### obsidianLink()

> **obsidianLink**(): `string`

Convert the inner part of the link to something that Obsidian can open / understand.

#### Returns

`string`

#### Defined in

[src/expression/link.ts:165](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L165)

***

### toEmbed()

> **toEmbed**(): [`Link`](Link.md)

Convert this link into an embedded link.

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:134](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L134)

***

### toFile()

> **toFile**(): [`Link`](Link.md)

Convert any link into a link to its file.

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:129](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L129)

***

### toObject()

> **toObject**(): `JsonLink`

Convert this link to a raw object which is serialization-friendly.

#### Returns

`JsonLink`

#### Defined in

[src/expression/link.ts:118](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L118)

***

### toString()

> **toString**(): `string`

Convert this link to it's markdown representation.

#### Returns

`string`

#### Defined in

[src/expression/link.ts:113](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L113)

***

### withBlock()

> **withBlock**(`block`: `string`): [`Link`](Link.md)

Convert a file link into a link to a specificb lock.

#### Parameters

• **block**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:101](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L101)

***

### withDisplay()

> **withDisplay**(`display`?: `string`): [`Link`](Link.md)

Return a new link which points to the same location but with a new display value.

#### Parameters

• **display?**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:84](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L84)

***

### withEmbed()

> **withEmbed**(`embed`: `boolean`): [`Link`](Link.md)

Return a new link which has the given embedded status.

#### Parameters

• **embed**: `boolean`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:89](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L89)

***

### withHeader()

> **withHeader**(`header`: `string`): [`Link`](Link.md)

Convert a file link into a link to a specific header.

#### Parameters

• **header**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:96](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L96)

***

### withPath()

> **withPath**(`path`: `string`): [`Link`](Link.md)

Update this link with a new path.

#### Parameters

• **path**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:79](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L79)

***

### block()

> `static` **block**(`path`: `string`, `blockId`: `string`, `embed`?: `boolean`, `display`?: `string`): [`Link`](Link.md)

Create a link to a specific file and block in that file.

#### Parameters

• **path**: `string`

• **blockId**: `string`

• **embed?**: `boolean`

• **display?**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:53](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L53)

***

### file()

> `static` **file**(`path`: `string`, `embed`: `boolean`, `display`?: `string`): [`Link`](Link.md)

Create a link to a specific file.

#### Parameters

• **path**: `string`

• **embed**: `boolean` = `false`

• **display?**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:19](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L19)

***

### fromObject()

> `static` **fromObject**(`object`: `JsonLink`): [`Link`](Link.md)

Load a link from it's raw JSON representation.

#### Parameters

• **object**: `JsonLink`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:64](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L64)

***

### header()

> `static` **header**(`path`: `string`, `header`: `string`, `embed`?: `boolean`, `display`?: `string`): [`Link`](Link.md)

Create a link to a specific file and header in that file.

#### Parameters

• **path**: `string`

• **header**: `string`

• **embed?**: `boolean`

• **display?**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:41](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L41)

***

### infer()

> `static` **infer**(`linkpath`: `string`, `embed`: `boolean`, `display`?: `string`): [`Link`](Link.md)

Infer the type of the link from the full internal link path.

#### Parameters

• **linkpath**: `string`

• **embed**: `boolean` = `false`

• **display?**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:30](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L30)

***

### parseInner()

> `static` **parseInner**(`rawlink`: `string`): [`Link`](Link.md)

Create a link by parsing it's interior part (inside of the '[[]]').

#### Parameters

• **rawlink**: `string`

#### Returns

[`Link`](Link.md)

#### Defined in

[src/expression/link.ts:69](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L69)

## Properties

### display?

> `optional` **display**: `string`

The display name associated with the link.

#### Defined in

[src/expression/link.ts:10](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L10)

***

### embed

> **embed**: `boolean`

Is this link an embedded link (of form '![[hello]]')?

#### Defined in

[src/expression/link.ts:14](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L14)

***

### path

> **path**: `string`

The file path this link points to.

#### Defined in

[src/expression/link.ts:8](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L8)

***

### subpath?

> `optional` **subpath**: `string`

The block ID or header this link points to within a file, if relevant.

#### Defined in

[src/expression/link.ts:12](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L12)

***

### type

> **type**: `"file"` \| `"block"` \| `"header"`

The type of this link, which determines what 'subpath' refers to, if anything.

#### Defined in

[src/expression/link.ts:16](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/link.ts#L16)
