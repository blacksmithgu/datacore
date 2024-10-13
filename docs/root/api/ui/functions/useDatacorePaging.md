# Function: useDatacorePaging()

> **useDatacorePaging**(`__namedParameters`: `object`): [`Paging`](../interfaces/Paging.md)

Central paging hook which extracts page metadata out of Datacore settings, handles page overflow, current page state, and updating the page
if the elements change. If a container is specified, also supports scrolling the container view on page changes.

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.container?**: `RefObject`\<`HTMLElement`\>

• **\_\_namedParameters.elements**: `number`

• **\_\_namedParameters.initialPage**: `number` = `0`

• **\_\_namedParameters.paging**: `undefined` \| `number` \| `boolean`

• **\_\_namedParameters.scrollOnPageChange?**: `number` \| `boolean`

## Returns

[`Paging`](../interfaces/Paging.md)

## Defined in

[src/api/ui/views/paging.tsx:196](https://github.com/blacksmithgu/datacore/blob/68b5529e5bdbcee81e7112d11ecb8c7d40cbb0f2/src/api/ui/views/paging.tsx#L196)
