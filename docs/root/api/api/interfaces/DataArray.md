# Interface: DataArray\<T\>

Proxied interface which allows manipulating array-based data. All functions on a data array produce a NEW array
(i.e., the arrays are immutable).

## Type Parameters

• **T**

## Indexable

 \[`index`: `number`\]: `any`

 \[`field`: `string`\]: `any`

## Methods

### \[iterator\]()

> **\[iterator\]**(): `Iterator`\<`T`, `any`, `undefined`\>

Allow iterating directly over the array.

#### Returns

`Iterator`\<`T`, `any`, `undefined`\>

#### Defined in

[src/api/data-array.ts:128](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L128)

***

### array()

> **array**(): `T`[]

Convert this to a plain javascript array.

#### Returns

`T`[]

#### Defined in

[src/api/data-array.ts:125](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L125)

***

### chain()

> **chain**\<`U`\>(`op`: (`arr`: [`DataArray`](DataArray.md)\<`T`\>) => [`DataArray`](DataArray.md)\<`U`\>): [`DataArray`](DataArray.md)\<`U`\>

Applies the given function to the entire data array. Allows using function chaining while applying an arbitrary intermediate function.

#### Type Parameters

• **U**

#### Parameters

• **op**

#### Returns

[`DataArray`](DataArray.md)\<`U`\>

#### Defined in

[src/api/data-array.ts:30](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L30)

***

### concat()

> **concat**(`other`: `Iterable`\<`T`\>): [`DataArray`](DataArray.md)\<`T`\>

Concatenate the values in this data array with those of another iterable / data array / array.

#### Parameters

• **other**: `Iterable`\<`T`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:52](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L52)

***

### distinct()

> **distinct**\<`U`\>(`key`?: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>, `comparator`?: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>): [`DataArray`](DataArray.md)\<`T`\>

Return distinct entries. If a key is provided, then rows with distinct keys are returned.

#### Type Parameters

• **U**

#### Parameters

• **key?**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>

• **comparator?**: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:96](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L96)

***

### every()

> **every**(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): `boolean`

Return true if the predicate is true for all values.

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

`boolean`

#### Defined in

[src/api/data-array.ts:99](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L99)

***

### expand()

> **expand**(`key`: `string`): [`DataArray`](DataArray.md)\<`any`\>

Recursively expand the given key, flattening a tree structure based on the key into a flat array. Useful for handling
heirarchical data like tasks with 'subtasks'.

#### Parameters

• **key**: `string`

#### Returns

[`DataArray`](DataArray.md)\<`any`\>

#### Defined in

[src/api/data-array.ts:119](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L119)

***

### filter()

> **filter**(`predicate`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): [`DataArray`](DataArray.md)\<`T`\>

Alias for 'where' for people who want array semantics.

#### Parameters

• **predicate**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:35](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L35)

***

### find()

> **find**(`pred`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): `undefined` \| `T`

Return the first element that satisfies the given predicate.

#### Parameters

• **pred**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

`undefined` \| `T`

#### Defined in

[src/api/data-array.ts:57](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L57)

***

### findIndex()

> **findIndex**(`pred`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>, `fromIndex`?: `number`): `number`

Find the index of the first element that satisfies the given predicate. Returns -1 if nothing was found.

#### Parameters

• **pred**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

• **fromIndex?**: `number`

#### Returns

`number`

#### Defined in

[src/api/data-array.ts:59](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L59)

***

### first()

> **first**(): `T`

Return the first element in the data array. Returns undefined if the array is empty.

#### Returns

`T`

#### Defined in

[src/api/data-array.ts:106](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L106)

***

### flatMap()

> **flatMap**\<`U`\>(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`[]\>): [`DataArray`](DataArray.md)\<`U`\>

Map elements in the data array by applying a function to each, then flatten the results to produce a new array.

#### Type Parameters

• **U**

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`[]\>

#### Returns

[`DataArray`](DataArray.md)\<`U`\>

#### Defined in

[src/api/data-array.ts:40](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L40)

***

### forEach()

> **forEach**(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `void`\>): `void`

Run a lambda on each element in the array.

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `void`\>

#### Returns

`void`

#### Defined in

[src/api/data-array.ts:122](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L122)

***

### groupBy()

> **groupBy**\<`U`\>(`key`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>, `comparator`?: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>): [`DataArray`](DataArray.md)\<`object`\>

Return an array where elements are grouped by the given key; the resulting array will have objects of the form 
`{ key: \<key value\>, rows: DataArray }`.

#### Type Parameters

• **U**

#### Parameters

• **key**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>

• **comparator?**: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>

#### Returns

[`DataArray`](DataArray.md)\<`object`\>

##### key

> **key**: `U`

##### rows

> **rows**: `T`[]

#### Defined in

[src/api/data-array.ts:85](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L85)

***

### groupIn()

> **groupIn**\<`U`\>(`key`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<[`LowestKey`](../type-aliases/LowestKey.md)\<`T`\>, `U`\>, `comparator`?: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>): [`DataArray`](DataArray.md)\<[`Ingrouped`](../type-aliases/Ingrouped.md)\<`U`, `T`\>\>

If the array is not grouped, groups it as `groupBy` does; otherwise, groups the elements inside each current
group. This allows for top-down recursive grouping which may be easier than bottom-up grouping.

#### Type Parameters

• **U**

#### Parameters

• **key**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<[`LowestKey`](../type-aliases/LowestKey.md)\<`T`\>, `U`\>

• **comparator?**: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>

#### Returns

[`DataArray`](DataArray.md)\<[`Ingrouped`](../type-aliases/Ingrouped.md)\<`U`, `T`\>\>

#### Defined in

[src/api/data-array.ts:91](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L91)

***

### includes()

> **includes**(`element`: `T`): `boolean`

Returns true if the array contains the given element, and false otherwise.

#### Parameters

• **element**: `T`

#### Returns

`boolean`

#### Defined in

[src/api/data-array.ts:61](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L61)

***

### indexOf()

> **indexOf**(`element`: `T`, `fromIndex`?: `number`): `number`

Return the first index of the given (optionally starting the search)

#### Parameters

• **element**: `T`

• **fromIndex?**: `number`

#### Returns

`number`

#### Defined in

[src/api/data-array.ts:55](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L55)

***

### into()

> **into**(`key`: `string`): [`DataArray`](DataArray.md)\<`any`\>

Map every element in this data array to the given key; unlike to(), does not flatten the result.

#### Parameters

• **key**: `string`

#### Returns

[`DataArray`](DataArray.md)\<`any`\>

#### Defined in

[src/api/data-array.ts:113](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L113)

***

### join()

> **join**(`sep`?: `string`): `string`

Return a string obtained by converting each element in the array to a string, and joining it with the
given separator (which defaults to ', ').

#### Parameters

• **sep?**: `string`

#### Returns

`string`

#### Defined in

[src/api/data-array.ts:67](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L67)

***

### last()

> **last**(): `T`

Return the last element in the data array. Returns undefined if the array is empty.

#### Returns

`T`

#### Defined in

[src/api/data-array.ts:108](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L108)

***

### limit()

> **limit**(`count`: `number`): [`DataArray`](DataArray.md)\<`T`\>

Limit the total number of entries in the array to the given value.

#### Parameters

• **count**: `number`

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:45](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L45)

***

### map()

> **map**\<`U`\>(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>): [`DataArray`](DataArray.md)\<`U`\>

Map elements in the data array by applying a function to each.

#### Type Parameters

• **U**

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>

#### Returns

[`DataArray`](DataArray.md)\<`U`\>

#### Defined in

[src/api/data-array.ts:38](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L38)

***

### mutate()

> **mutate**(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `void`\>): [`DataArray`](DataArray.md)\<`T`\>

Mutably change each value in the array, returning the same array which you can further chain off of.

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `void`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:42](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L42)

***

### none()

> **none**(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): `boolean`

Return true if the predicate is FALSE for all values.

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

`boolean`

#### Defined in

[src/api/data-array.ts:103](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L103)

***

### slice()

> **slice**(`start`?: `number`, `end`?: `number`): [`DataArray`](DataArray.md)\<`T`\>

Take a slice of the array. If `start` is undefined, it is assumed to be 0; if `end` is undefined, it is assumbed
to be the end of the array.

#### Parameters

• **start?**: `number`

• **end?**: `number`

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:50](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L50)

***

### some()

> **some**(`f`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): `boolean`

Return true if the predicate is true for at least one value.

#### Parameters

• **f**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

`boolean`

#### Defined in

[src/api/data-array.ts:101](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L101)

***

### sort()

> **sort**\<`U`\>(`key`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>, `direction`?: `"asc"` \| `"desc"`, `comparator`?: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>): [`DataArray`](DataArray.md)\<`T`\>

Return a sorted array sorted by the given key; an optional comparator can be provided, which will
be used to compare the keys in leiu of the default dataview comparator.

#### Type Parameters

• **U**

#### Parameters

• **key**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `U`\>

• **direction?**: `"asc"` \| `"desc"`

• **comparator?**: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:73](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L73)

***

### sortInPlace()

> **sortInPlace**\<`U`\>(`key`: (`v`: `T`) => `U`, `direction`?: `"asc"` \| `"desc"`, `comparator`?: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>): [`DataArray`](DataArray.md)\<`T`\>

Mutably modify the current array with an in place sort; this is less flexible than a regular sort in exchange
for being a little more performant. Only use this is performance is a serious consideration.

#### Type Parameters

• **U**

#### Parameters

• **key**

• **direction?**: `"asc"` \| `"desc"`

• **comparator?**: [`ArrayComparator`](../type-aliases/ArrayComparator.md)\<`U`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:79](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L79)

***

### to()

> **to**(`key`: `string`): [`DataArray`](DataArray.md)\<`any`\>

Map every element in this data array to the given key, and then flatten it.

#### Parameters

• **key**: `string`

#### Returns

[`DataArray`](DataArray.md)\<`any`\>

#### Defined in

[src/api/data-array.ts:111](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L111)

***

### where()

> **where**(`predicate`: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>): [`DataArray`](DataArray.md)\<`T`\>

Filter the data array down to just elements which match the given predicate.

#### Parameters

• **predicate**: [`ArrayFunc`](../type-aliases/ArrayFunc.md)\<`T`, `boolean`\>

#### Returns

[`DataArray`](DataArray.md)\<`T`\>

#### Defined in

[src/api/data-array.ts:33](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L33)

## Properties

### length

> **length**: `number`

The total number of elements in the array.

#### Defined in

[src/api/data-array.ts:27](https://github.com/GamerGirlandCo/datacore/blob/7f32893e5430e552f1b1164e828ac7a411d6e24f/src/api/data-array.ts#L27)
