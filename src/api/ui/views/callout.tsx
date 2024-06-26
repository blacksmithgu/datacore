import { ComponentChildren, VNode } from "preact";
import { memo } from "preact/compat";
import { useControlledState } from "ui/hooks";
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

function CalloutTitleComponent({
    onClick,
    title,
    icon,
    open,
}: {
    onClick: () => unknown;
    title: CalloutProps["title"];
    icon: CalloutProps["icon"];
    open: boolean;
}) {
    let foldCnames = ["callout-fold"];
    if (!open) foldCnames.push("is-collapsed");
    else foldCnames.remove("is-collapsed");
    return (
        <div className="callout-title" onClick={onClick}>
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
    );
}
const CalloutTitle = memo(CalloutTitleComponent);
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
    if (!open) cnames.push("is-collapsed");
    return (
        <div
            data-callout-metadata
            data-callout={type}
            data-callout-fold={initialOpen ? "+" : "-"}
            className={cnames.join(" ")}
        >
            <CalloutTitle open={open} title={title} icon={icon} onClick={() => setOpen(!open)} />
            <div className="callout-content">{open && children}</div>
        </div>
    );
}
