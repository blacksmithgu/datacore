# Interface: FrontmatterEntry

An entry in the frontmatter; includes the raw value, parsed value, and raw key (before lower-casing).

## Properties

### key

> **key**: `string`

The actual string in frontmatter with exact casing.

#### Defined in

[src/index/types/markdown.ts:709](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L709)

***

### raw

> **raw**: `string`

The raw value of the frontmatter entry before parsing; generally a string or number.

#### Defined in

[src/index/types/markdown.ts:713](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L713)

***

### value

> **value**: [`Literal`](../../expressions/type-aliases/Literal.md)

The parsed value of the frontmatter entry (date, duration, etc.).

#### Defined in

[src/index/types/markdown.ts:711](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/index/types/markdown.ts#L711)
