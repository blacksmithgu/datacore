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

// Utilities in the API. These are fine to expose the implementations for.
export * from "api/data-array";
export * from "api/result";