import { useContext, useEffect, useMemo, useRef } from "preact/hooks";
import { APP_CONTEXT, COMPONENT_CONTEXT } from "./markdown";
import { h } from "preact";
import { Link } from "expression/link";

/** Properties for rendering an Obsidian embed. */
export interface EmbedProps {
    /** The link that is being embedded. */
    link: Link;
    /** Whether the embed should be shown inline with less padding. */
    inline: boolean;
    /** The path which the link will be resolved relative to. */
    sourcePath: string;
}

/** Renders an embed in the canonical Obsidian style. */
export function Embed({ link, inline, sourcePath }: EmbedProps) {
    const app = useContext(APP_CONTEXT);
    const component = useContext(COMPONENT_CONTEXT);
    const container = useRef<HTMLDivElement | null>(null);
    const linkedFile = useMemo(() => app.metadataCache.getFirstLinkpathDest(link.path, sourcePath), [link.path, sourcePath]);

    useEffect(() => {
        if (!container.current) return;

        container.current.innerHTML = "";

        const creator = app.embedRegistry.getEmbedCreator(linkedFile!);
        let embedComponent = new creator(
            {
                linktext: link.path,
                sourcePath: linkedFile?.path!,
                showInline: inline,
                app,
                depth: 0,
                containerEl: container.current,
                displayMode: true,
            },
            linkedFile!,
            link.subpath
        );

        component.addChild(embedComponent);
        embedComponent.loadFile(linkedFile!);

        return () => component.removeChild(embedComponent);
    }, [container.current, link.path, link.subpath]);

    return <div className="dc-embed" ref={container}></div>;
}
