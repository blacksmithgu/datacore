import { ComponentChildren, VNode } from "preact";
import { CSSProperties, useMemo, useRef, useState } from "preact/compat";

export interface CalloutProps {
    open: boolean;
    children?: ComponentChildren;
    title: string | VNode;
    icon?: VNode;
    type?: string;
    collapsible?: boolean;
}

function CalloutContent({
    style,
    children,
    open,
}: {
    style?: { [k in keyof CSSProperties]: string };
    children: ComponentChildren;
    open: boolean;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    let styles: CSSProperties = {
        ...style,
        transition: "all 0.16s ease",
        height: ref.current?.scrollHeight || 0,
        overflowY: "clip",
    };
    if (!open) styles.height = 0;
    else styles.height = ref.current?.scrollHeight;
    return (
        <div ref={ref} className="callout-content" style={styles}>
            {children}
        </div>
    );
}
export function Callout({ collapsible, open: openProp, title, icon, children, type }: CalloutProps) {
    const [open, setOpen] = useState(openProp);

    const titleEl = useMemo(() => {
        let foldCnames = ["callout-fold"];
        if (!open) foldCnames.push("is-collapsed");
        return (
            <div className="callout-title" onClick={() => setOpen(!open)}>
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
    }, [open]);
    const cnames = ["callout"];
    if (collapsible) cnames.push("is-collapsible");
    if (!open) cnames.push("is-collapsed");
    return (
        <div
            data-callout-metadata
            data-callout={type}
            data-callout-fold={openProp ? "+" : "-"}
            className={cnames.join(" ")}
        >
            {titleEl}
            <CalloutContent open={open}>{children}</CalloutContent>
        </div>
    );
}
