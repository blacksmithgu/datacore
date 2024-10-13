# Interface: GroupingConfig\<T\>

Metadata for configuring how groupings in the data should be handled.

## Type Parameters

• **T**

## Properties

### render()?

> `optional` **render**: (`key`: [`Literal`](../../expressions/type-aliases/Literal.md), `rows`: [`Grouping`](../../expressions/type-aliases/Grouping.md)\<`T`\>) => [`Literal`](../../expressions/type-aliases/Literal.md) \| `VNode`\<`object`\>

How a grouping with the given key and set of rows should be handled.

#### Parameters

• **key**: [`Literal`](../../expressions/type-aliases/Literal.md)

• **rows**: [`Grouping`](../../expressions/type-aliases/Grouping.md)\<`T`\>

#### Returns

[`Literal`](../../expressions/type-aliases/Literal.md) \| `VNode`\<`object`\>

#### Defined in

[src/api/ui/views/table.tsx:41](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/table.tsx#L41)
