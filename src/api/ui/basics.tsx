/** Basic UI components that have simple Obsidian theming. */
import React, { TargetedEvent, useCallback } from "preact/compat";

import { ComponentChildren } from "preact";
import { setIcon } from "obsidian";
import { useControlledState } from "ui/hooks";

import "./basics.css";

/** @public Various intents for buttons and other interactive elements. */
export type Intent = "error" | "warn" | "info" | "success";

/** @internal CSS classes for each level of intent. */
export const INTENT_CLASSES: Record<Intent, string> = {
    error: "dc-intent-error",
    warn: "dc-intent-warn",
    info: "dc-intent-info",
    success: "dc-intent-success",
};

/** @public Wrapper for a regular HTML button with some default classes. */
export function Button(
    props: { className?: string; intent?: Intent; children: ComponentChildren } & React.ComponentProps<"button">
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

/** @public A simple textbox which accepts text. */
export function Textbox(props: React.ComponentProps<"input"> & { className?: string }) {
    const { className, children, ...forwardingProps } = props;
    return (
        <input type={props.type ?? "text"} className={combineClasses("dc-textbox", className)} {...forwardingProps} />
    );
}

/** @public A checkbox that can be checked and unchecked. */
export function Checkbox(
    props: {
        className?: string;
        disabled?: boolean;
        checked?: boolean;
        defaultChecked?: boolean;
        onCheckChange?: (checked: boolean) => void;
        children?: ComponentChildren;
    } & React.ComponentProps<"input">
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

    const onChange = useCallback(
        (event: TargetedEvent<HTMLInputElement>) => setChecked(event.currentTarget.checked),
        [setChecked]
    );

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

/** @public Wrapper for a slider (range input) with some default classes. */
export function Slider(
    props: {
        className?: string;
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        defaultValue?: number;
        onValueChange?: (value: number) => void;
    } & React.ComponentProps<"input">
) {
    const { className, min = 0, max = 10, step = 1, value, defaultValue, onValueChange, ...forwardingProps } = props;
    const [slider, setSlider] = useControlledState(defaultValue ?? 0, value, onValueChange);

    const onChange = useCallback(
        (event: TargetedEvent<HTMLInputElement>) => setSlider(parseInt(event.currentTarget.value)),
        [setSlider]
    );

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

/** @public Wrapper for a switch (toggle) component with some default classes. */
export function Switch(
    props: {
        className?: string;
        disabled?: boolean;
        checked?: boolean;
        defaultChecked?: boolean;
        onToggleChange?: (checked: boolean) => void;
    } & React.ComponentProps<"input">
) {
    const { className, disabled, defaultChecked, checked, onToggleChange, ...forwardingProps } = props;
    const [toggled, setToggled] = useControlledState(defaultChecked ?? false, checked, onToggleChange);

    const onChange = useCallback(
        (event: TargetedEvent<HTMLInputElement>) => setToggled(event.currentTarget.checked),
        [setToggled]
    );

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

/** @public Wrapper for a select component with some default classes. */
export function VanillaSelect(
    props: {
        className?: string;
        options: { value: string; label: string }[];
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
    } & React.ComponentProps<"select">
) {
    const { className, options = [], value, defaultValue, onValueChange, ...forwardingProps } = props;
    const [selectedValue, setSelectedValue] = useControlledState(defaultValue ?? "", value, onValueChange);

    return (
        <select
            className={combineClasses("dc-select dropdown", className)}
            value={selectedValue}
            onChange={(e) => {
                setSelectedValue(e.currentTarget.value);
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

/** @public A component that renders an SVG icon. */
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

/** @internal Appends additional classes to a basic fixed class. */
export function combineClasses(fixed: string, ...rest: (string | undefined)[]) {
    const nonempty = rest.filter((c) => c !== undefined);
    if (nonempty.length === 0) return fixed;

    return [fixed, ...nonempty].join(" ");
}
