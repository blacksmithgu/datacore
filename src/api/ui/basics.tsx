/** Basic UI components that have simple Obsidian theming.
 * @module ui
 */
import React, { useCallback } from "preact/compat";

import { ComponentChildren } from "preact";
import { setIcon } from "obsidian";
import { useControlledState } from "ui/hooks";

import "./basics.css";

/** Various intents for buttons and other interactive elements. */
export type Intent = "error" | "warn" | "info" | "success";
type Omittable = "value" | "defaultValue"
export const INTENT_CLASSES: Record<Intent, string> = {
    error: "dc-intent-error",
    warn: "dc-intent-warn",
    info: "dc-intent-info",
    success: "dc-intent-success",
};

/** Wrapper for a regular HTML button with some default classes.
 * @group Components
 */
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

/** A simple textbox which accepts text.
 *
 * @group Components
 */
export function Textbox(props: { className?: string } & React.HTMLProps<HTMLInputElement>) {
    const { className, children, ...forwardingProps } = props;
    return (
        <input type={props.type ?? "text"} className={combineClasses("dc-textbox", className)} {...forwardingProps} />
    );
}

/** A checkbox that can be checked and unchecked.
 * @group Components
 */
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
    const {
        className,
        disabled,
        defaultChecked,
        checked: isChecked,
        onCheckChange,
        children,
        ...forwardingProps
    } = props;
    const [checked, setChecked] = useControlledState(defaultChecked ?? false, isChecked, onCheckChange);

    const onChange = useCallback((event: any) => setChecked(event.currentTarget.checked), [setChecked]);

    return (
        <label className={combineClasses("dc-checkbox", disabled ? "dc-checkbox-disabled" : undefined, className)}>
            <input
                type="checkbox"
                defaultChecked={defaultChecked}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                {...forwardingProps}
            />
            {children}
        </label>
    );
}

/** Wrapper for a slider (range input) with some default classes.
 * @group Components
 */
export function Slider(
    props: {
        className?: string;
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        defaultValue?: number;
        onValueChange?: (value: number) => void;
    } & Omit<React.HTMLProps<HTMLInputElement>, Omittable>
) {
    const { className, min = 0, max = 10, step = 1, value, defaultValue, onValueChange, ...forwardingProps } = props;
    const [slider, setSlider] = useControlledState(defaultValue ?? 0, value, onValueChange);

    const onChange = useCallback((event: any) => setSlider(event.currentTarget.value), [setSlider]);

    return (
        <input
            type="range"
            aria-label={slider.toString()}
            className={combineClasses("dc-slider", className)}
            min={min}
            max={max}
            step={step}
            value={slider}
            onChange={onChange}
            {...forwardingProps}
        />
    );
}

/** Wrapper for a switch (toggle) component with some default classes.
 * @group Components
 */
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
    const [toggled, setToggled] = useControlledState(defaultChecked ?? false, checked, onToggleChange);

    const onChange = useCallback((event: any) => setToggled(event.currentTarget.checked), [setToggled]);

    return (
        <label
            className={combineClasses(
                "dc-switch checkbox-container",
                toggled ? "is-enabled" : undefined,
                disabled ? "dc-switch-disabled" : undefined,
                className
            )}
        >
            <input
                type="checkbox"
                className="dc-switch-input"
                defaultChecked={defaultChecked}
                checked={toggled}
                disabled={disabled}
                onChange={onChange}
                {...forwardingProps}
            />
        </label>
    );
}

/** Wrapper for a select component with some default classes.
 * @group Components
 */
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
    const [selectedValue, setSelectedValue] = React.useState(value ?? defaultValue ?? "");

    React.useEffect(() => {
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
/**
 * A component that renders an icon
 * @group Components
 */
export function Icon(props: { className?: string; icon: string }) {
    const { className, icon } = props;
    const ref = React.createRef<HTMLSpanElement>();

    React.useEffect(() => {
        if (ref.current) {
            setIcon(ref.current, icon);
        }
    }, [ref]);

    return <span ref={ref} className={combineClasses("dc-icon", className)} data-icon={icon} />;
}

/**
 *  Appends additional classes to a basic fixed class.
 *
 * @group Utilities
 * */
export function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}
