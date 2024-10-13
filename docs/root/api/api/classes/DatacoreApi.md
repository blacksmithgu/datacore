# Class: DatacoreApi

Exterally visible API for datacore.

## Accessors

### app

> `get` **app**(): `App`

Central Obsidian app object.

#### Returns

`App`

#### Defined in

[src/api/api.ts:38](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L38)

***

### luxon

> `get` **luxon**(): `__module`

Get acess to luxon functions.

#### Returns

`__module`

#### Defined in

[src/api/api.ts:28](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L28)

***

### preact

> `get` **preact**(): `__module`

Get access to preact functions.

#### Returns

`__module`

#### Defined in

[src/api/api.ts:33](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L33)

## Methods

### array()

> **array**\<`T`\>(`input`: `T`[] \| [`DataArray`](../interfaces/DataArray.md)\<`T`\>): [`DataArray`](../interfaces/DataArray.md)\<`T`\>

Create a data array from a regular array.

#### Type Parameters

• **T**

#### Parameters

• **input**: `T`[] \| [`DataArray`](../interfaces/DataArray.md)\<`T`\>

#### Returns

[`DataArray`](../interfaces/DataArray.md)\<`T`\>

#### Defined in

[src/api/api.ts:144](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L144)

***

### blockLink()

> **blockLink**(`path`: `string`, `block`: `string`): [`Link`](../../expressions/classes/Link.md)

Create a link to a block with the given path and block ID.

#### Parameters

• **path**: `string`

• **block**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/api.ts:126](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L126)

***

### executeJs()

> **executeJs**(`source`: `string`, `container`: `HTMLElement`, `component`: `Component` \| `MarkdownPostProcessorContext`, `sourcePath`: `string`): `MarkdownRenderChild`

Run the given DatacoreJS script, rendering it into the given container. This function
will return quickly; actual rendering is done asynchronously in the background.

Returns a markdown render child representing the rendered object.

#### Parameters

• **source**: `string`

• **container**: `HTMLElement`

• **component**: `Component` \| `MarkdownPostProcessorContext`

• **sourcePath**: `string`

#### Returns

`MarkdownRenderChild`

#### Defined in

[src/api/api.ts:158](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L158)

***

### executeJsx()

> **executeJsx**(`source`: `string`, `container`: `HTMLElement`, `component`: `Component` \| `MarkdownPostProcessorContext`, `sourcePath`: `string`): `MarkdownRenderChild`

Similar to `executeJs`, but for JSX scripts. If you are unsure if your input will be JS
or JSX, use this one, as it also supports regular javascript (albeit at at a mild performance
hit to rendering).

#### Parameters

• **source**: `string`

• **container**: `HTMLElement`

• **component**: `Component` \| `MarkdownPostProcessorContext`

• **sourcePath**: `string`

#### Returns

`MarkdownRenderChild`

#### Defined in

[src/api/api.ts:172](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L172)

***

### executeTs()

> **executeTs**(`source`: `string`, `container`: `HTMLElement`, `component`: `Component` \| `MarkdownPostProcessorContext`, `sourcePath`: `string`): `MarkdownRenderChild`

Similar to `executeJs`, but for TypeScript scripts. Use the TSX variant for TSX supprot.

#### Parameters

• **source**: `string`

• **container**: `HTMLElement`

• **component**: `Component` \| `MarkdownPostProcessorContext`

• **sourcePath**: `string`

#### Returns

`MarkdownRenderChild`

#### Defined in

[src/api/api.ts:184](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L184)

***

### executeTsx()

> **executeTsx**(`source`: `string`, `container`: `HTMLElement`, `component`: `Component` \| `MarkdownPostProcessorContext`, `sourcePath`: `string`): `MarkdownRenderChild`

Similar to `executeTs`, but for TSX scripts. If you are unsure if your input will be TS
or TSX, use this one, as it also supports regular javascript (albeit at at a mild performance
hit to rendering).

This generally will also work if you are unsure if your input is javascript or typescript,
though beware there are a few niche cases where javascript and typescript diverge in syntax.

#### Parameters

• **source**: `string`

• **container**: `HTMLElement`

• **component**: `Component` \| `MarkdownPostProcessorContext`

• **sourcePath**: `string`

#### Returns

`MarkdownRenderChild`

#### Defined in

[src/api/api.ts:201](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L201)

***

### fileLink()

> **fileLink**(`path`: `string`): [`Link`](../../expressions/classes/Link.md)

Create a file link pointing to the given path.

#### Parameters

• **path**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/api.ts:116](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L116)

***

### fullquery()

> **fullquery**(`query`: `string` \| `IndexQuery`): `SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>

Execute a textual or typed index query, returning results plus performance metadata.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

`SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>

#### Defined in

[src/api/api.ts:73](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L73)

***

### headerLink()

> **headerLink**(`path`: `string`, `header`: `string`): [`Link`](../../expressions/classes/Link.md)

Create a link to a header with the given name.

#### Parameters

• **path**: `string`

• **header**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/api.ts:121](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L121)

***

### local()

> **local**(`path`: `string`): [`DatacoreLocalApi`](DatacoreLocalApi.md)

Construct a local API for the file at the given path.

#### Parameters

• **path**: `string`

#### Returns

[`DatacoreLocalApi`](DatacoreLocalApi.md)

#### Defined in

[src/api/api.ts:47](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L47)

***

### page()

> **page**(`path`: `string` \| [`Link`](../../expressions/classes/Link.md)): `undefined` \| [`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

Load a markdown file by full path or link.

#### Parameters

• **path**: `string` \| [`Link`](../../expressions/classes/Link.md)

#### Returns

`undefined` \| [`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

#### Defined in

[src/api/api.ts:56](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L56)

***

### parseLink()

> **parseLink**(`linktext`: `string`): [`Link`](../../expressions/classes/Link.md)

Try to parse the given link, throwing an error if it is invalid.

#### Parameters

• **linktext**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/api.ts:131](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L131)

***

### parseQuery()

> **parseQuery**(`query`: `string` \| `IndexQuery`): `IndexQuery`

Try to parse the given query, throwing an error if it is invalid.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

`IndexQuery`

#### Defined in

[src/api/api.ts:111](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L111)

***

### query()

> **query**(`query`: `string` \| `IndexQuery`): [`Indexable`](../../indexables/interfaces/Indexable.md)[]

Execute a textual or typed index query, returning all results.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

[`Indexable`](../../indexables/interfaces/Indexable.md)[]

#### Defined in

[src/api/api.ts:63](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L63)

***

### resolvePath()

> **resolvePath**(`path`: `string` \| [`Link`](../../expressions/classes/Link.md), `sourcePath`?: `string`): `string`

Resolve a local or absolute path or link to an absolute path.

#### Parameters

• **path**: `string` \| [`Link`](../../expressions/classes/Link.md)

• **sourcePath?**: `string`

#### Returns

`string`

#### Defined in

[src/api/api.ts:91](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L91)

***

### tryFullQuery()

> **tryFullQuery**(`query`: `string` \| `IndexQuery`): [`Result`](../type-aliases/Result.md)\<`SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>, `string`\>

Execute a textual or typed index query, returning results plus performance metadata.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

[`Result`](../type-aliases/Result.md)\<`SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>, `string`\>

#### Defined in

[src/api/api.ts:78](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L78)

***

### tryParseLink()

> **tryParseLink**(`linktext`: `string`): [`Result`](../type-aliases/Result.md)\<[`Link`](../../expressions/classes/Link.md), `string`\>

Try to parse a link, returning a monadic success/failure result.

#### Parameters

• **linktext**: `string`

#### Returns

[`Result`](../type-aliases/Result.md)\<[`Link`](../../expressions/classes/Link.md), `string`\>

#### Defined in

[src/api/api.ts:136](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L136)

***

### tryParseQuery()

> **tryParseQuery**(`query`: `string` \| `IndexQuery`): [`Result`](../type-aliases/Result.md)\<`IndexQuery`, `string`\>

Try to parse the given query, returning a monadic success/failure result.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

[`Result`](../type-aliases/Result.md)\<`IndexQuery`, `string`\>

#### Defined in

[src/api/api.ts:102](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L102)

***

### tryQuery()

> **tryQuery**(`query`: `string` \| `IndexQuery`): [`Result`](../type-aliases/Result.md)\<[`Indexable`](../../indexables/interfaces/Indexable.md)[], `string`\>

Execute a textual or typed index query, returning all results.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

[`Result`](../type-aliases/Result.md)\<[`Indexable`](../../indexables/interfaces/Indexable.md)[], `string`\>

#### Defined in

[src/api/api.ts:68](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L68)

## Properties

### coerce

> **coerce**: *typeof* `Coerce` = `Coerce`

Utilities for coercing types into one specific type for easier programming.

#### Defined in

[src/api/api.ts:88](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/api.ts#L88)
