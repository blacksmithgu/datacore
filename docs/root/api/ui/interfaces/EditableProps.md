# Interface: EditableProps\<T\>

## Type Parameters

• **T**

the type of the value being edited

## Properties

### defaultRender?

> `optional` **defaultRender**: `VNode`\<`object`\>

Backup default renderer for this object.

#### Defined in

[src/ui/fields/editable.tsx:43](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L43)

***

### dispatch

> **dispatch**: `Dispatch`\<`EditableAction`\<`T`\>\>

Dispatcher for controlling the edit state, tracking updates, commits, and so on.

#### Defined in

[src/ui/fields/editable.tsx:47](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L47)

***

### editor

> **editor**: `ComponentChild`

Node which points to the actual editor.

#### Defined in

[src/ui/fields/editable.tsx:45](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L45)

***

### sourcePath?

> `optional` **sourcePath**: `string`

Source file from which the editable value originates.

#### Defined in

[src/ui/fields/editable.tsx:41](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L41)

***

### state

> **state**: [`EditableState`](EditableState.md)\<`T`\>

The current state of the editor.

#### Defined in

[src/ui/fields/editable.tsx:49](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/ui/fields/editable.tsx#L49)
