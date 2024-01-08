import { useContext, useEffect, useRef } from "preact/hooks";
import { APP_CONTEXT } from "./markdown";
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
    const container = useRef<HTMLDivElement | null>(null);

    const linkedFile = app.metadataCache.getFirstLinkpathDest(link.path, sourcePath);
    useEffect(() => {
        if (!container.current) return;

        container.current.innerHTML = "";

        // @ts-ignore
        let creator = app.embedRegistry.getEmbedCreator(linkedFile!);
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
        embedComponent.load();
        embedComponent.loadFile(linkedFile!);
    }, [container.current, link.path, link.subpath]);

    return <div className="datacore datacore-embed" ref={container}></div>;
}
