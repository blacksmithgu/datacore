# Class: DatacoreLocalApi

Local API provided to specific codeblocks when they are executing.

## Components

### Group()

> **Group**: (`props`: `HTMLAttributes`\<`HTMLDivElement`\> & `object`) => `Element`

Horizontal flexbox container; good for putting items together in a row.

Creates a horizontal flexbox "grouping" of elements.

#### Parameters

• **props**: `HTMLAttributes`\<`HTMLDivElement`\> & `object`

#### Returns

`Element`

#### Defined in

[src/api/local-api.tsx:211](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L211)

***

### Icon()

> **Icon**: (`props`: `object`) => `Element`

Renders an obsidian lucide icon.

A component that renders an icon

#### Parameters

• **props**

• **props.className?**: `string`

• **props.icon**: `string`

#### Returns

`Element`

#### Defined in

[src/api/local-api.tsx:295](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L295)

***

### Stack()

> **Stack**: (`props`: `HTMLAttributes`\<`HTMLDivElement`\> & `object`) => `Element`

Vertical flexbox container; good for putting items together in a column.

Creates a vertical flexbox "stack" of elements.

#### Parameters

• **props**: `HTMLAttributes`\<`HTMLDivElement`\> & `object`

#### Returns

`Element`

#### Defined in

[src/api/local-api.tsx:209](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L209)

## Accessors

### app

> `get` **app**(): `App`

Central Obsidian app object.

#### Returns

`App`

#### Defined in

[src/api/local-api.tsx:63](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L63)

***

### core

> `get` **core**(): `Datacore`

The internal plugin central datastructure.

#### Returns

`Datacore`

#### Defined in

[src/api/local-api.tsx:68](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L68)

***

### luxon

> `get` **luxon**(): `__module`

Get acess to luxon functions.

#### Returns

`__module`

#### Defined in

[src/api/local-api.tsx:53](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L53)

***

### preact

> `get` **preact**(): `__module`

Get access to preact functions.

#### Returns

`__module`

#### Defined in

[src/api/local-api.tsx:58](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L58)

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

[src/api/local-api.tsx:145](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L145)

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

[src/api/local-api.tsx:130](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L130)

***

### currentFile()

> **currentFile**(): [`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

The full markdown file metadata for the current file.

#### Returns

[`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

#### Defined in

[src/api/local-api.tsx:48](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L48)

***

### currentPath()

> **currentPath**(): `string`

The current file path for the local API.

#### Returns

`string`

#### Defined in

[src/api/local-api.tsx:43](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L43)

***

### fileLink()

> **fileLink**(`path`: `string`): [`Link`](../../expressions/classes/Link.md)

Create a file link pointing to the given path.

#### Parameters

• **path**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/local-api.tsx:120](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L120)

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

[src/api/local-api.tsx:125](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L125)

***

### parseLink()

> **parseLink**(`linktext`: `string`): [`Link`](../../expressions/classes/Link.md)

Try to parse the given link, throwing an error if it is invalid.

#### Parameters

• **linktext**: `string`

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Defined in

[src/api/local-api.tsx:135](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L135)

***

### parseQuery()

> **parseQuery**(`query`: `string` \| `IndexQuery`): `IndexQuery`

Try to parse the given query, throwing an error if it is invalid.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

`IndexQuery`

#### Defined in

[src/api/local-api.tsx:115](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L115)

***

### require()

> **require**(`path`: `string` \| [`Link`](../../expressions/classes/Link.md)): `Promise`\<`any`\>

Asynchronously load a javascript block from the given path or link; you can either load from JS/TS/JSX/TSX files
directly, or from codeblocks by loading from the section the codeblock is inside of. There are a few stipulations
to loading:
- You cannot load cyclical dependencies.
- This is similar to vanilla js `require()`, not `import ... `. Your scripts you are requiring need to explicitly
  return the things they are exporting, like the example below. The `export` keyword does not work.

```js
function MyElement() {
 ...
}

return { MyElement };
```

#### Parameters

• **path**: `string` \| [`Link`](../../expressions/classes/Link.md)

#### Returns

`Promise`\<`any`\>

#### Defined in

[src/api/local-api.tsx:92](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L92)

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

[src/api/local-api.tsx:105](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L105)

***

### tryParseLink()

> **tryParseLink**(`linktext`: `string`): [`Result`](../type-aliases/Result.md)\<[`Link`](../../expressions/classes/Link.md), `string`\>

Try to parse a link, returning a monadic success/failure result.

#### Parameters

• **linktext**: `string`

#### Returns

[`Result`](../type-aliases/Result.md)\<[`Link`](../../expressions/classes/Link.md), `string`\>

#### Defined in

[src/api/local-api.tsx:140](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L140)

***

### tryParseQuery()

> **tryParseQuery**(`query`: `string` \| `IndexQuery`): [`Result`](../type-aliases/Result.md)\<`IndexQuery`, `string`\>

Try to parse the given query, returning a monadic success/failure result.

#### Parameters

• **query**: `string` \| `IndexQuery`

#### Returns

[`Result`](../type-aliases/Result.md)\<`IndexQuery`, `string`\>

#### Defined in

[src/api/local-api.tsx:110](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L110)

***

### useArray()

> **useArray**\<`T`, `U`\>(`input`: `T`[] \| [`DataArray`](../interfaces/DataArray.md)\<`T`\>, `process`: (`data`: [`DataArray`](../interfaces/DataArray.md)\<`T`\>) => [`DataArray`](../interfaces/DataArray.md)\<`U`\>, `deps`?: `any`[]): `U`[]

Memoize the input automatically and process it using a DataArray; returns a vanilla array back.

#### Type Parameters

• **T**

• **U**

#### Parameters

• **input**: `T`[] \| [`DataArray`](../interfaces/DataArray.md)\<`T`\>

• **process**

• **deps?**: `any`[]

#### Returns

`U`[]

#### Defined in

[src/api/local-api.tsx:165](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L165)

***

### useCurrentFile()

> **useCurrentFile**(`settings`?: `object`): [`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

Use the file metadata for the current file. Automatically updates the view when the current file metadata changes.

#### Parameters

• **settings?**

• **settings.debounce?**: `number`

#### Returns

[`MarkdownPage`](../../indexables/classes/MarkdownPage.md)

#### Defined in

[src/api/local-api.tsx:170](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L170)

***

### useCurrentPath()

> **useCurrentPath**(`settings`?: `object`): `string`

Use the current path. Automatically updates the view if the path changes (though that would be weird).

#### Parameters

• **settings?**

• **settings.debounce?**: `number`

#### Returns

`string`

#### Defined in

[src/api/local-api.tsx:175](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L175)

***

### useFile()

> **useFile**(`path`: `string`, `settings`?: `object`): `undefined` \| [`Indexable`](../../indexables/interfaces/Indexable.md)

Use the file metadata for a specific file. Automatically updates the view when the file changes.

#### Parameters

• **path**: `string`

• **settings?**

• **settings.debounce?**: `number`

#### Returns

`undefined` \| [`Indexable`](../../indexables/interfaces/Indexable.md)

#### Defined in

[src/api/local-api.tsx:181](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L181)

***

### useFullQuery()

> **useFullQuery**(`query`: `string` \| `IndexQuery`, `settings`?: `object`): `SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>

Run a query, automatically re-running it whenever the vault changes. Returns more information about the query
execution, such as index revision and total search duration.

#### Parameters

• **query**: `string` \| `IndexQuery`

• **settings?**

• **settings.debounce?**: `number`

#### Returns

`SearchResult`\<[`Indexable`](../../indexables/interfaces/Indexable.md)\>

#### Defined in

[src/api/local-api.tsx:194](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L194)

***

### useIndexUpdates()

> **useIndexUpdates**(`settings`?: `object`): `number`

Automatically refresh the view whenever the index updates; returns the latest index revision ID.

#### Parameters

• **settings?**

• **settings.debounce?**: `number`

#### Returns

`number`

#### Defined in

[src/api/local-api.tsx:186](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L186)

***

### useQuery()

> **useQuery**(`query`: `string` \| `IndexQuery`, `settings`?: `object`): [`Indexable`](../../indexables/interfaces/Indexable.md)[]

Run a query, automatically re-running it whenever the vault changes.

#### Parameters

• **query**: `string` \| `IndexQuery`

• **settings?**

• **settings.debounce?**: `number`

#### Returns

[`Indexable`](../../indexables/interfaces/Indexable.md)[]

#### Defined in

[src/api/local-api.tsx:199](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L199)

## Properties

### coerce

> **coerce**: *typeof* `Coerce` = `Coerce`

Utilities for coercing types into one specific type for easier programming.

#### Defined in

[src/api/local-api.tsx:102](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L102)

***

### Link

> **Link**: `object` = `ObsidianLink`

Renders an obsidian-style link directly and more effieicntly than rendering markdown.

#### Defined in

[src/api/local-api.tsx:246](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L246)

***

### LinkEmbed

> **LinkEmbed**: `any`

Create a vanilla Obsidian embed for the given link.

#### Defined in

[src/api/local-api.tsx:249](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L249)

***

### Literal

> **Literal**: `any`

Renders a literal value in a pretty way that respects settings.

#### Defined in

[src/api/local-api.tsx:214](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L214)

***

### Markdown

> **Markdown**: `any`

Renders markdown using the Obsidian markdown renderer, optionally attaching additional styles.

#### Defined in

[src/api/local-api.tsx:220](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L220)

***

### SpanEmbed

> **SpanEmbed**: `any`

Create an explicit 'span' embed which extracts a span of lines from a markdown file.

#### Defined in

[src/api/local-api.tsx:270](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/local-api.tsx#L270)
