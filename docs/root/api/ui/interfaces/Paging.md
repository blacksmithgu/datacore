# Interface: Paging

Provides useful metadata about paging.

## Properties

### enabled

> **enabled**: `boolean`

Whether paging is enabled.

#### Defined in

[src/api/ui/views/paging.tsx:178](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L178)

***

### page

> **page**: `number`

The current page.

#### Defined in

[src/api/ui/views/paging.tsx:182](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L182)

***

### pageSize

> **pageSize**: `number`

The size of each page.

#### Defined in

[src/api/ui/views/paging.tsx:184](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L184)

***

### scroll

> **scroll**: `boolean`

Whether the view should scroll when the page changes.

#### Defined in

[src/api/ui/views/paging.tsx:180](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L180)

***

### setPage()

> **setPage**: (`page`: `number`) => `void`

Update the current page.

#### Parameters

• **page**: `number`

#### Returns

`void`

#### Defined in

[src/api/ui/views/paging.tsx:188](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L188)

***

### totalPages

> **totalPages**: `number`

The total number of pages for this data.

#### Defined in

[src/api/ui/views/paging.tsx:186](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L186)