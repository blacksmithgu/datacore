/** Basic UI components that have simple Obsidian theming. */
import React from "preact/compat";

import "./basics.css";
import { ComponentChildren } from "preact";

/** Various intents for buttons and other interactive elements. */
export type Intent = "error" | "warn" | "info" | "success";

export const INTENT_CLASSES: Record<Intent, string> = {
    error: "dc-intent-error",
    warn: "dc-intent-warn",
    info: "dc-intent-info",
    success: "dc-intent-success",
};

/** Wrapper for a regular HTML button with some default classes. */
export function Button(
    props: { className?: string; intent?: Intent; children: ComponentChildren } & React.HTMLProps<HTMLButtonElement>
) {
    const { className, intent, children, ...forwardingProps } = props;
    return (
        <button
            className={combineClasses("dc-button", intent ? INTENT_CLASSES[intent] : undefined, className)}
            {...forwardingProps}
        >
            {children}
        </button>
    );
}

/** Appends additional classes to  */
function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}
