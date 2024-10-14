/**
 * @module views
*/
import { VNode } from "preact";
import { PropsWithChildren } from "preact/compat";
import { useControlledState } from "ui/hooks";

import "./callout.css";
import { combineClasses } from "../basics";

/** General properties for configuring a callout.
 * @group Props
 */
export interface CalloutProps {
    /** Title of the callout. */
    title: string | VNode;
    /** Arbitrary icon to show at the left side of the title in the callout. */
    icon?: VNode;
    /** The type of the callout. */
    type?: string;
    /** Whether the callout is collapsible (defaults to true). */
    collapsible?: boolean;

    /** Controlled prop for setting whether the callout is open. */
    open: boolean;
    /** Whether the callout is initially open if uncontrolled. */
    initialOpen?: boolean;
    /** Called whenever the open state of the callout changes due to user action. */
    onOpenChange?: (value: boolean) => void;
}

/** Splits on `|<stuff>`. */
const METADATA_SPLIT_REGEX = /\|(.*)/s;

/**
 * @group Components
 * @param props {@inheritDoc CalloutProps}
 */
export function Callout({
    collapsible = true,
    open: openProp,
    initialOpen,
    onOpenChange,
    title,
    icon,
    children,
    type,
}: PropsWithChildren<CalloutProps>) {
    const [open, setOpen] = useControlledState(initialOpen ?? true, openProp, onOpenChange);

    return (
        <div
            data-callout-metadata={type?.split(METADATA_SPLIT_REGEX)?.[1]}
            data-callout={type?.split(METADATA_SPLIT_REGEX)?.[0]}
            data-callout-fold={open ? "+" : "-"}
            className={combineClasses("datacore", "callout", collapsible ? "is-collapsible" : undefined)}
        >
            <div className="callout-title" onClick={() => collapsible && setOpen(!open)}>
                {icon && <div className="callout-icon">{icon}</div>}
                <div className="callout-title-inner">{title}</div>
                {collapsible && (
                    <div className={combineClasses("callout-fold", !open ? "is-collapsed" : undefined)}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="svg-icon lucide-chevron-down"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                )}
            </div>
            {open && <div className="callout-content">{children}</div>}
        </div>
    );
}
