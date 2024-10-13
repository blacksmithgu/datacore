# indexables

## Index

### Classes

- [Canvas](classes/Canvas.md)
- [CanvasFileCard](classes/CanvasFileCard.md)
- [CanvasTextCard](classes/CanvasTextCard.md)
- [GenericFile](classes/GenericFile.md)
- [MarkdownBlock](classes/MarkdownBlock.md)
- [MarkdownCodeblock](classes/MarkdownCodeblock.md)
- [MarkdownDatablock](classes/MarkdownDatablock.md)
- [MarkdownListBlock](classes/MarkdownListBlock.md)
- [MarkdownListItem](classes/MarkdownListItem.md)
- [MarkdownPage](classes/MarkdownPage.md)
- [MarkdownTaskItem](classes/MarkdownTaskItem.md)

### Interfaces

- [File](interfaces/File.md)
- [FrontmatterEntry](interfaces/FrontmatterEntry.md)
- [Indexable](interfaces/Indexable.md)
- [Linkable](interfaces/Linkable.md)
- [Linkbearing](interfaces/Linkbearing.md)
- [Taggable](interfaces/Taggable.md)

### Type Aliases

- [CanvasCard](type-aliases/CanvasCard.md)
- [LinkNormalizer](type-aliases/LinkNormalizer.md)
- [YamlLiteral](type-aliases/YamlLiteral.md)

## FILE\_TYPE

> `const` **FILE\_TYPE**: `"file"` = `"file"`

General metadata for any file.

### Defined in

[src/index/types/indexable.ts:36](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/indexable.ts#L36)

***

## INDEXABLE\_EXTENSIONS

> `const` **INDEXABLE\_EXTENSIONS**: `Set`\<`string`\>

All supported extensions. This should probably become a dynamic lookup table and not just
a fixed list at some point, especially if we add the ability to turn indexing on/off.

### Defined in

[src/index/types/indexable.ts:77](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/indexable.ts#L77)

***

## LINKABLE\_TYPE

> `const` **LINKABLE\_TYPE**: `"linkable"` = `"linkable"`

Metadata for objects which support linking.

### Defined in

[src/index/types/indexable.ts:26](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/indexable.ts#L26)

***

## LINKBEARING\_TYPE

> `const` **LINKBEARING\_TYPE**: `"links"` = `"links"`

Metadata for objects which can link to other things.

### Defined in

[src/index/types/indexable.ts:64](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/indexable.ts#L64)

***

## TAGGABLE\_TYPE

> `const` **TAGGABLE\_TYPE**: `"taggable"` = `"taggable"`

Metadata for taggable objects.

### Defined in

[src/index/types/indexable.ts:54](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/index/types/indexable.ts#L54)
