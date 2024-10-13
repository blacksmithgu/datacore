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

[src/ui/fields/editable.tsx:28](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L28)

***

### inline?

> `optional` **inline**: `boolean`

Whether the editor is being rendered inline in a paragraph or not.

#### Defined in

[src/ui/fields/editable.tsx:32](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L32)

***

### isEditing?

> `optional` **isEditing**: `boolean`

Whether the value is currently being edited.

#### Defined in

[src/ui/fields/editable.tsx:26](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L26)

***

### updater()

> **updater**: (`val`: `T`) => `unknown`

Callback whenever the editable value is changed.

#### Parameters

• **val**: `T`

#### Returns

`unknown`

#### Defined in

[src/ui/fields/editable.tsx:30](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L30)
