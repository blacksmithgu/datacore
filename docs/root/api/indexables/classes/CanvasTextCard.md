# Class: CanvasTextCard

Canvas card with markdown text in it.

## Extends

- `BaseCanvasCard`

## Implements

- [`Linkbearing`](../interfaces/Linkbearing.md)
- [`Taggable`](../interfaces/Taggable.md)
- [`Indexable`](../interfaces/Indexable.md)
- `Fieldbearing`

## Accessors

### $link

> `get` **$link**(): [`Link`](../../expressions/classes/Link.md)

A link to this linkable object.

#### Returns

[`Link`](../../expressions/classes/Link.md)

#### Inherited from

`BaseCanvasCard.$link`

#### Defined in

[src/index/types/canvas.ts:139](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/canvas.ts#L139)

***

### fields

> `get` **fields**(): `Field`[]

Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations.

#### Returns

`Field`[]

#### Implementation of

`Fieldbearing.fields`

#### Defined in

[src/index/types/canvas.ts:181](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/canvas.ts#L181)

## Methods

### field()

> **field**(`key`: `string`): `undefined` \| `Field`

Fetch a field with the given name if it is present on this object.

#### Parameters

• **key**: `string`

#### Returns

`undefined` \| `Field`

#### Implementation of

`Fieldbearing.field`

#### Defined in

[src/index/types/canvas.ts:185](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/canvas.ts#L185)

## Properties

### $links

> **$links**: [`Link`](../../expressions/classes/Link.md)[]

The links in this file.

#### Implementation of

[`Linkbearing`](../interfaces/Linkbearing.md).[`$links`](../interfaces/Linkbearing.md#$links)

#### Defined in

[src/index/types/canvas.ts:166](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/canvas.ts#L166)

***

### $tags

> **$tags**: `string`[]

The exact tags on this object. (#a/b/c or #foo/bar).

#### Implementation of

[`Taggable`](../interfaces/Taggable.md).[`$tags`](../interfaces/Taggable.md#$tags)

#### Defined in

[src/index/types/canvas.ts:167](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/canvas.ts#L167)
