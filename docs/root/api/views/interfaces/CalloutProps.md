# Interface: CalloutProps

General properties for configuring a callout.

## Properties

### collapsible?

> `optional` **collapsible**: `boolean`

Whether the callout is collapsible (defaults to true).

#### Defined in

[src/api/ui/views/callout.tsx:22](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L22)

***

### icon?

> `optional` **icon**: `VNode`\<`object`\>

Arbitrary icon to show at the left side of the title in the callout.

#### Defined in

[src/api/ui/views/callout.tsx:18](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L18)

***

### initialOpen?

> `optional` **initialOpen**: `boolean`

Whether the callout is initially open if uncontrolled.

#### Defined in

[src/api/ui/views/callout.tsx:27](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L27)

***

### onOpenChange()?

> `optional` **onOpenChange**: (`value`: `boolean`) => `void`

Called whenever the open state of the callout changes due to user action.

#### Parameters

• **value**: `boolean`

#### Returns

`void`

#### Defined in

[src/api/ui/views/callout.tsx:29](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L29)

***

### open

> **open**: `boolean`

Controlled prop for setting whether the callout is open.

#### Defined in

[src/api/ui/views/callout.tsx:25](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L25)

***

### title

> **title**: `string` \| `VNode`\<`object`\>

Title of the callout.

#### Defined in

[src/api/ui/views/callout.tsx:16](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L16)

***

### type?

> `optional` **type**: `string`

The type of the callout.

#### Defined in

[src/api/ui/views/callout.tsx:20](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/ui/views/callout.tsx#L20)
