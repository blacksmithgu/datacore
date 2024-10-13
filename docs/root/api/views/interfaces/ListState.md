# Interface: ListState\<T\>

State for a [ListView](../functions/ListView.md)

## Type Parameters

• **T**

the type of the items contained in the list

## Properties

### paging?

> `optional` **paging**: `number` \| `boolean`

Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size.

#### Defined in

[src/api/ui/views/list.tsx:29](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/list.tsx#L29)

***

### renderer()?

> `optional` **renderer**: (`element`: `T`, `index`: `number`) => `undefined` \| `null` \| `string` \| `number` \| `bigint` \| `boolean` \| `object` \| `Function` \| [`Link`](../../expressions/classes/Link.md) \| `DateTime` \| `Duration` \| [`Literal`](../../expressions/type-aliases/Literal.md)[] \| [`DataObject`](../../expressions/type-aliases/DataObject.md) \| `VNode`\<`any`\>

Custom render function to use for rendering each element. Can produce either JSX or a plain value which will be
rendered as a literal.

#### Parameters

• **element**: `T`

• **index**: `number`

#### Returns

`undefined` \| `null` \| `string` \| `number` \| `bigint` \| `boolean` \| `object` \| `Function` \| [`Link`](../../expressions/classes/Link.md) \| `DateTime` \| `Duration` \| [`Literal`](../../expressions/type-aliases/Literal.md)[] \| [`DataObject`](../../expressions/type-aliases/DataObject.md) \| `VNode`\<`any`\>

#### Defined in

[src/api/ui/views/list.tsx:35](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/list.tsx#L35)

***

### rows?

> `optional` **rows**: `T`[]

The full collection of elements in the list.

#### Defined in

[src/api/ui/views/list.tsx:26](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/list.tsx#L26)

***

### type?

> `optional` **type**: `"ordered"` \| `"unordered"` \| `"none"`

Whether the list should be ordered (ol), unordered (ul), or have no special markup (none).

Lists with no special markup just have each element rendered directly as-is without any wrapping
inside of a single div.

#### Defined in

[src/api/ui/views/list.tsx:23](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/list.tsx#L23)
