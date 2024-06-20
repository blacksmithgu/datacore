/** Basic UI components that have simple Obsidian theming. */
import React from "preact/compat";

import "./basics.css";
import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

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

export function Textbox(props: { className?: string } & React.HTMLProps<HTMLInputElement>) {
    const { className, children, ...forwardingProps } = props;
    return <input className={combineClasses("dc-textbox", className)} {...forwardingProps} />;
}

export function Checkbox(
    props: {
        className?: string;
        disabled?: boolean;
        checked?: boolean;
        defaultChecked?: boolean;
        onCheckChange?: (checked: boolean) => void;
        children?: ComponentChildren;
    } & React.HTMLProps<HTMLInputElement>
) {
    const { className, disabled, defaultChecked, checked, onCheckChange, children, ...forwardingProps } = props;
    const [isChecked, setIsChecked] = useState(checked ?? defaultChecked ?? false);

    useEffect(() => {
        if (typeof checked === "boolean") setIsChecked(checked);
    }, [checked]);

    return (
        <label className={combineClasses("dc-checkbox", disabled ? "dc-checkbox-disabled" : undefined, className)}>
            <input
                type="checkbox"
                defaultChecked={defaultChecked}
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => {
                    setIsChecked(e.currentTarget.checked);
                    onCheckChange && onCheckChange(e.currentTarget.checked);
                }}
                {...forwardingProps}
            />
            {children}
        </label>
    );
}

/** Appends additional classes to a basic fixed class. */
function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}
