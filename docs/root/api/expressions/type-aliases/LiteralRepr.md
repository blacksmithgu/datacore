# Type Alias: LiteralRepr\<T\>

> **LiteralRepr**\<`T`\>: `T` *extends* `"boolean"` ? `boolean` : `T` *extends* `"number"` ? `number` : `T` *extends* `"string"` ? `string` : `T` *extends* `"duration"` ? `Duration` : `T` *extends* `"date"` ? `DateTime` : `T` *extends* `"null"` ? `null` : `T` *extends* `"link"` ? [`Link`](../classes/Link.md) : `T` *extends* `"array"` ? [`Literal`](Literal.md)[] : `T` *extends* `"object"` ? [`DataObject`](DataObject.md) : `T` *extends* `"function"` ? `Function` : `any`

Maps the string type to it's external, API-facing representation.

## Type Parameters

• **T** *extends* [`LiteralType`](LiteralType.md)

## Defined in

[src/expression/literal.ts:39](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/expression/literal.ts#L39)
