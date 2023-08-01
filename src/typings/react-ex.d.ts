import { JSX } from "preact";
import { JSXInternal } from "preact/src/jsx";
/** Additional react types for preact to work with mantine and other libraries. */
export declare namespace React {
    export type ComponentPropsWithoutRef<T extends keyof JSX.IntrinsicElements> = JSXInternal.IntrinsicElements[T];
}