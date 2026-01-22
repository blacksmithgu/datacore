/** Library entrypoint for datacore. */

// User facing API types. Only expose types since people should be
// calling the API and not using the internals directly.
export type { DatacoreApi } from "api/api";
export type { DatacoreLocalApi } from "api/local-api";
export type { default as DatacorePlugin } from "main";
export type { Settings } from "settings";

// General data types.
export { Link } from "expression/link";
export * from "expression/literal";
export * from "expression/field";

// Index types.
export type { Datacore } from "index/datacore";
export type { Datastore } from "index/datastore";

export type * from "index/types/indexable";
export type * from "index/types/markdown";
export type * from "index/types/index-query";
export type * from "index/types/files";
export type * from "index/types/canvas";

export { InlineField } from "index/import/inline-field";
export { SearchResult } from "index/datastore";

export { CardPos, CardDimensions } from "index/types/json/canvas";

// Expressions and functional types.
export type * from "expression/expression";

// Preact component types.
export type * from "api/ui/basics";
export type { Stack, Group } from "api/ui/layout";
export type { Callout, CalloutProps } from "api/ui/views/callout";
export type { Card, CardProps } from "api/ui/views/cards";
export type { ListViewType, ListViewProps, ListView } from "api/ui/views/list";
export type { TableColumn, TableViewProps, TableView } from "api/ui/views/table";
export type { Lit, Markdown } from "ui/markdown";

// Utilities in the API. These are fine to expose the implementations for.
export * from "api/data-array";
export * from "api/result";
