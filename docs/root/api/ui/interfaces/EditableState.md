# Interface: EditableState\<T\>

Core state for tracking an editable object.

## Type Parameters

• **T**

the type of the value being edited

## Properties

### content

> **content**: `T`

The current (arbitrary) content of the editable.

#### Defined in

[src/ui/fields/editable.tsx:28](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/ui/fields/editable.tsx#L28)

***

### inline?

> `optional` **inline**: `boolean`

Whether the editor is being rendered inline in a paragraph or not.

#### Defined in

[src/ui/fields/editable.tsx:32](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/ui/fields/editable.tsx#L32)

***

### isEditing?

> `optional` **isEditing**: `boolean`

Whether the value is currently being edited.

#### Defined in

[src/ui/fields/editable.tsx:26](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/ui/fields/editable.tsx#L26)

***

### updater()

> **updater**: (`val`: `T`) => `unknown`

Callback whenever the editable value is changed.

#### Parameters

• **val**: `T`

#### Returns

`unknown`

#### Defined in

[src/ui/fields/editable.tsx:30](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/ui/fields/editable.tsx#L30)
