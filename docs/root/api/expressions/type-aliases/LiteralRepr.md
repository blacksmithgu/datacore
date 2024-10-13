# Type Alias: LiteralRepr\<T\>

> **LiteralRepr**\<`T`\>: `T` *extends* `"boolean"` ? `boolean` : `T` *extends* `"number"` ? `number` : `T` *extends* `"string"` ? `string` : `T` *extends* `"duration"` ? `Duration` : `T` *extends* `"date"` ? `DateTime` : `T` *extends* `"null"` ? `null` : `T` *extends* `"link"` ? [`Link`](../classes/Link.md) : `T` *extends* `"array"` ? [`Literal`](Literal.md)[] : `T` *extends* `"object"` ? [`DataObject`](DataObject.md) : `T` *extends* `"function"` ? `Function` : `any`

Maps the string type to it's external, API-facing representation.

## Type Parameters

• **T** *extends* [`LiteralType`](LiteralType.md)

## Defined in

[src/expression/literal.ts:39](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/expression/literal.ts#L39)
