# Interface: VanillaColumn\<T, V\>

A simple column definition which allows for custom renderers and titles.

## Type Parameters

• **T**

the type of each row

• **V** = [`Literal`](../../expressions/type-aliases/Literal.md)

the type of the value in this column

## Properties

### id

> **id**: `string`

The unique ID of this table column; you cannot have multiple columns with the same ID in a given table.

#### Defined in

[src/api/ui/views/table.tsx:21](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L21)

***

### render()?

> `optional` **render**: (`value`: `V`, `object`: `T`) => [`Literal`](../../expressions/type-aliases/Literal.md) \| `VNode`\<`object`\>

Called to render the given column value. Can depend on both the specific value and the row object.

#### Parameters

• **value**: `V`

• **object**: `T`

#### Returns

[`Literal`](../../expressions/type-aliases/Literal.md) \| `VNode`\<`object`\>

#### Defined in

[src/api/ui/views/table.tsx:33](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L33)

***

### title?

> `optional` **title**: `string` \| `VNode`\<`object`\> \| () => `string` \| `VNode`\<`object`\>

The title which will display at the top of the column if present.

#### Defined in

[src/api/ui/views/table.tsx:24](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L24)

***

### value()

> **value**: (`object`: `T`) => `V`

Value function which maps the row to the value being rendered.

#### Parameters

• **object**: `T`

#### Returns

`V`

#### Defined in

[src/api/ui/views/table.tsx:30](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L30)

***

### width?

> `optional` **width**: `string`

If present, the CSS width to apply to the column. 'minimum' will set the column size to it's smallest possible value, while 'maximum' will do the opposite.

#### Defined in

[src/api/ui/views/table.tsx:27](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L27)
