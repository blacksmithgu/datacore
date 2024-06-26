import { ComponentChildren, VNode } from "preact";
import { memo, useEffect, useMemo, useRef } from "preact/compat";
import { useControlledState, useStableCallback } from "ui/hooks";
import "./callout.css";

export interface CalloutProps {
    open: boolean;
    initialOpen?: boolean;
    children?: ComponentChildren;
    title: string | VNode;
    icon?: VNode;
    type?: string;
    collapsible?: boolean;
    onOpenChange?: (value: boolean) => void;
}

export function Callout({
    collapsible,
    open: openProp,
    initialOpen,
    onOpenChange,
    title,
    icon,
    children,
    type,
}: CalloutProps) {
    const [open, setOpen] = useControlledState(initialOpen ?? true, openProp, onOpenChange);

    const cnames = ["datacore", "callout"];
    if (collapsible) cnames.push("is-collapsible");

		let foldCnames = ["callout-fold"];
    if (!open) {
        foldCnames.push("is-collapsed");
        cnames.push("is-collapsed");
    } else {
        foldCnames.remove("is-collapsed");
        cnames.remove("is-collapsed");
    }
		const contentRef = useRef<HTMLDivElement>(null)
		let contentHeight = 0;
		useEffect(() => {
			contentRef.current && (contentRef.current.style.height = open ? contentRef.current.scrollHeight.toString() + "px" : "0")
		}, [open])
		const toggle = useStableCallback(() => {
			// @ts-ignore
			setOpen(!open)

		}, [contentHeight])	
    return (
        <div
            data-callout-metadata
            data-callout={type}
            data-callout-fold={initialOpen ? "+" : "-"}
            className={cnames.join(" ")}
        >
            <div className="callout-title" onClick={() => collapsible && toggle()}>
                {icon}
                <div className="callout-title-inner">{title}</div>
                <div className={foldCnames.join(" ")}>
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
            </div>
            <div ref={contentRef} className="callout-content">{open ? children : null}</div>
        </div>
    );
}
