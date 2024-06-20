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
    return (
        <input type={props.type ?? "text"} className={combineClasses("dc-textbox", className)} {...forwardingProps} />
    );
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

/** Wrapper for a slider (range input) with some default classes. */
export function Slider(
    props: {
        className?: string;
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        defaultValue?: number;
        onValueChange?: (value: number) => void;
    } & React.HTMLProps<HTMLInputElement>
) {
    const { className, min = 0, max = 10, step = 1, value, defaultValue, onValueChange, ...forwardingProps } = props;
    const [sliderValue, setSliderValue] = useState(value ?? defaultValue ?? 0);

    useEffect(() => {
        if (typeof value === "number") setSliderValue(value);
    }, [value]);

    return (
        <input
            type="range"
            aria-label={sliderValue.toString()}
            className={combineClasses("dc-slider", className)}
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(e) => {
                setSliderValue(Number(e.currentTarget.value));
                onValueChange && onValueChange(Number(e.currentTarget.value));
            }}
            {...forwardingProps}
        />
    );
}

/** Wrapper for a switch (toggle) component with some default classes. */
export function Switch(
    props: {
        className?: string;
        disabled?: boolean;
        checked?: boolean;
        defaultChecked?: boolean;
        onToggleChange?: (checked: boolean) => void;
    } & React.HTMLProps<HTMLInputElement>
) {
    const { className, disabled, defaultChecked, checked, onToggleChange, ...forwardingProps } = props;
    const [isToggled, setIsToggled] = useState(checked ?? defaultChecked ?? false);

    useEffect(() => {
        if (typeof checked === "boolean") setIsToggled(checked);
    }, [checked]);

    return (
        <label
            className={combineClasses(
                "dc-switch checkbox-container",
                isToggled ? "is-enabled" : undefined,
                disabled ? "dc-switch-disabled" : undefined,
                className
            )}
        >
            <input
                type="checkbox"
                className="dc-switch-input"
                defaultChecked={defaultChecked}
                checked={isToggled}
                disabled={disabled}
                onChange={(e) => {
                    setIsToggled(e.currentTarget.checked);
                    onToggleChange && onToggleChange(e.currentTarget.checked);
                }}
                {...forwardingProps}
            />
        </label>
    );
}

/** Wrapper for a select component with some default classes. */
export function VanillaSelect(
    props: {
        className?: string;
        options: { value: string; label: string }[];
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
    } & React.HTMLProps<HTMLSelectElement>
) {
    const { className, options = [], value, defaultValue, onValueChange, ...forwardingProps } = props;
    const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? "");

    useEffect(() => {
        if (typeof value === "string") setSelectedValue(value);
    }, [value]);

    return (
        <select
            className={combineClasses("dc-select dropdown", className)}
            value={selectedValue}
            onChange={(e) => {
                setSelectedValue(e.currentTarget.value);
                onValueChange && onValueChange(e.currentTarget.value);
            }}
            {...forwardingProps}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

/** Appends additional classes to a basic fixed class. */
function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}
