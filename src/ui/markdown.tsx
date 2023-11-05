/** Provides core preact / rendering utilities for all view types. */
import { App, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { Component } from "obsidian";
import { Link, Literal, Literals } from "expression/literal";
import { Datacore } from "index/datacore";
import { Settings } from "settings";
import { currentLocale, renderMinimalDate, renderMinimalDuration } from "utils/normalizers";
import { extractImageDimensions, isImageEmbed } from "utils/media";

import { h, createContext, Fragment, VNode, render } from "preact";
import { useContext, useMemo, useCallback, useRef, useEffect, useErrorBoundary } from "preact/hooks";
import { CSSProperties, PropsWithChildren, memo, unmountComponentAtNode } from "preact/compat";
import { Embed, EmbedProps } from "./embed";

export const COMPONENT_CONTEXT = createContext<Component>(undefined!);
export const APP_CONTEXT = createContext<App>(undefined!);
export const DATACORE_CONTEXT = createContext<Datacore>(undefined!);
export const SETTINGS_CONTEXT = createContext<Settings>(undefined!);
export const CURRENT_FILE_CONTEXT = createContext<string>(undefined!);

/** More compact provider for all of the datacore react contexts. */
export function DatacoreContextProvider({
    children,
    app,
    component,
    datacore,
    settings,
}: PropsWithChildren<{
    app: App;
    component: Component;
    datacore: Datacore;
    settings: Settings;
}>) {
    return (
        <COMPONENT_CONTEXT.Provider value={component}>
            <APP_CONTEXT.Provider value={app}>
                <DATACORE_CONTEXT.Provider value={datacore}>
                    <CURRENT_FILE_CONTEXT.Provider value={""}>
                        <SETTINGS_CONTEXT.Provider value={settings}>{children}</SETTINGS_CONTEXT.Provider>
                    </CURRENT_FILE_CONTEXT.Provider>
                </DATACORE_CONTEXT.Provider>
            </APP_CONTEXT.Provider>
        </COMPONENT_CONTEXT.Provider>
    );
}

/** Copies how an Obsidian link is rendered but is about an order of magnitude faster to render than via markdown rendering. */
export function RawLink({ link, sourcePath }: { link: Link | string; sourcePath: string }) {
    const workspace = useContext(APP_CONTEXT).workspace;
    const parsed = useMemo(() => (Literals.isLink(link) ? link : Link.infer(link)), [link]);

    const onClick = useCallback(
        (event: MouseEvent) => {
            const newtab = event.shiftKey;
            console.log(parsed.obsidianLink(), sourcePath);
            workspace.openLinkText(parsed.obsidianLink(), sourcePath, newtab);
        },
        [parsed, sourcePath]
    );

    return (
        <a
            aria-label={parsed.displayOrDefault()}
            onClick={onClick}
            className="internal-link"
            target="_blank"
            rel="noopener"
            data-tooltip-position="top"
            data-href={parsed.obsidianLink()}
        >
            {parsed.displayOrDefault()}
        </a>
    );
}

export const ObsidianLink = memo(RawLink);

/** Hacky preact component which wraps Obsidian's markdown renderer into a neat component. */
export function RawMarkdown({
    content,
    sourcePath,
    inline = true,
    style,
    cls,
    onClick,
}: {
    content: string;
    sourcePath: string;
    inline?: boolean;
    style?: CSSProperties;
    cls?: string;
    onClick?: (event: MouseEvent) => any;
}) {
    const container = useRef<HTMLElement | null>(null);
    const component = useContext(COMPONENT_CONTEXT);

    useEffect(() => {
        if (!container.current) return;

        container.current.innerHTML = "";
        MarkdownRenderer.renderMarkdown(content, container.current, sourcePath, component).then(() => {
            if (!container.current || !inline) return;

            // Unwrap any created paragraph elements if we are inline.
            let paragraph = container.current.querySelector("p");
            while (paragraph) {
                let children = paragraph.childNodes;
                paragraph.replaceWith(...Array.from(children));
                paragraph = container.current.querySelector("p");
            }
            let embed = container.current.querySelector("span.internal-embed:not(.is-loaded)");
            
            // have embeds actually load instead of displaying as plain text
            while(embed) {
                let props: EmbedProps = {
                    embedderPath: sourcePath,
                    linkText: embed.getAttribute("src") ?? "",
                    inline: true
                }
                embed.empty()
                render(<APP_CONTEXT.Provider value={app}>
                    <Embed {...props}/>
                </APP_CONTEXT.Provider>, embed)
                embed.addClass("is-loaded")
                embed = container.current.querySelector("span.internal-embed:not(.is-loaded)")
            }
        });
    }, [content, sourcePath, container.current]);

    return <span ref={container} style={style} className={cls} onClick={onClick}></span>;
}

/** Hacky preact component which wraps Obsidian's markdown renderer into a neat component. */
export const Markdown = memo(RawMarkdown);

/** Intelligently render an arbitrary literal value. */
export function RawLit({
    value,
    sourcePath,
    inline = false,
    depth = 0,
}: PropsWithChildren<{
    value: Literal | undefined;
    sourcePath: string;
    inline?: boolean;
    depth?: number;
}>) {
    const settings = useContext(SETTINGS_CONTEXT);
    const app = useContext(APP_CONTEXT);

    // Short-circuit if beyond the maximum render depth.
    if (depth >= settings.maxRecursiveRenderDepth) return <Fragment>...</Fragment>;

    if (Literals.isNull(value) || value === undefined) {
        return <Markdown inline={inline} content={settings.renderNullAs} sourcePath={sourcePath} />;
    } else if (Literals.isString(value)) {
        return <Markdown inline={inline} content={value} sourcePath={sourcePath} />;
    } else if (Literals.isNumber(value)) {
        return <Fragment>{"" + value}</Fragment>;
    } else if (Literals.isBoolean(value)) {
        return <Fragment>{"" + value}</Fragment>;
    } else if (Literals.isDate(value)) {
        return (
            <Fragment>
                {renderMinimalDate(value, settings.defaultDateFormat, settings.defaultDateTimeFormat, currentLocale())}
            </Fragment>
        );
    } else if (Literals.isDuration(value)) {
        return <Fragment>{renderMinimalDuration(value)}</Fragment>;
    } else if (Literals.isLink(value)) {
        // Special case handling of image/video/etc embeddings to bypass the Obsidian API not working.
        if (isImageEmbed(value)) {
            let realFile = app.metadataCache.getFirstLinkpathDest(value.path, sourcePath);
            if (!realFile) return <Markdown content={value.markdown()} sourcePath={sourcePath} />;

            let dimensions = extractImageDimensions(value);
            let resourcePath = app.vault.getResourcePath(realFile);

            if (dimensions && dimensions.length == 2)
                return <img alt={value.path} src={resourcePath} width={dimensions[0]} height={dimensions[1]} />;
            else if (dimensions && dimensions.length == 1)
                return <img alt={value.path} src={resourcePath} width={dimensions[0]} />;
            else return <img alt={value.path} src={resourcePath} />;
        } else if(value.embed) {
            return <Embed linkText={value.fileName()} embedderPath={sourcePath} inline={inline} />
        }

        return <ObsidianLink link={value} sourcePath={sourcePath} />;
    } else if (Literals.isFunction(value)) {
        return <Fragment>&lt;function&gt;</Fragment>;
    } else if (Literals.isArray(value)) {
        if (!inline) {
            return (
                <ul className={"dataview dataview-ul dataview-result-list-ul"}>
                    {value.map((subvalue) => (
                        <li className="dataview-result-list-li">
                            <Lit value={subvalue} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </li>
                    ))}
                </ul>
            );
        } else {
            if (value.length == 0) return <Fragment>&lt;Empty List&gt;</Fragment>;

            return (
                <span className="dataview dataview-result-list-span">
                    {value.map((subvalue, index) => (
                        <Fragment>
                            {index == 0 ? "" : ", "}
                            <Lit value={subvalue} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </Fragment>
                    ))}
                </span>
            );
        }
    } else if (Literals.isObject(value)) {
        // Don't render classes in case they have recursive references; spoopy.
        if (value?.constructor?.name && value?.constructor?.name != "Object") {
            return <Fragment>&lt;{value.constructor.name}&gt;</Fragment>;
        }

        if (!inline) {
            return (
                <ul className="dataview dataview-ul dataview-result-object-ul">
                    {Object.entries(value).map(([key, value]) => (
                        <li className="dataview dataview-li dataview-result-object-li">
                            {key}: <Lit value={value} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </li>
                    ))}
                </ul>
            );
        } else {
            if (Object.keys(value).length == 0) return <Fragment>&lt;Empty Object&gt;</Fragment>;

            return (
                <span className="dataview dataview-result-object-span">
                    {Object.entries(value).map(([key, value], index) => (
                        <Fragment>
                            {index == 0 ? "" : ", "}
                            {key}: <Lit value={value} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </Fragment>
                    ))}
                </span>
            );
        }
    }

    return <Fragment>&lt;Unrecognized: {JSON.stringify(value)}&gt;</Fragment>;
}

/** Intelligently render an arbitrary literal value. */
export const Lit = memo(RawLit);

/** Render a pretty centered error message in a box. */
export function ErrorMessage({
    title,
    message,
    error,
    reset,
}: {
    title?: string;
    message?: string;
    error?: string;
    reset?: () => void;
}) {
    return (
        <div className="datacore-error-box">
            {title && <h4 className="datacore-error-title">{title}</h4>}
            {message && <p className="datacore-error-message">{message}</p>}
            {error && <pre className="datacore-error-pre">{error}</pre>}
            {reset && (
                <button className="datacore-error-retry" onClick={reset}>
                    Rerun
                </button>
            )}
        </div>
    );
}

/** A simple error boundary which renders a message on failure. */
export function SimpleErrorBoundary({
    title,
    message,
    children,
}: PropsWithChildren<{ title?: string; message?: string }>) {
    const [error, reset] = useErrorBoundary();

    if (error) {
        return <ErrorMessage title={title} message={message} error={error.message} reset={reset} />;
    } else {
        return <Fragment>{children}</Fragment>;
    }
}

/** A trivial wrapper which allows a react component to live for the duration of a `MarkdownRenderChild`. */
export class ReactRenderer extends MarkdownRenderChild {
    public constructor(
        public app: App,
        public datacore: Datacore,
        public container: HTMLElement,
        public sourcePath: string,
        public element: VNode
    ) {
        super(container);
    }

    public onload(): void {
        render(
            <DatacoreContextProvider
                app={this.app}
                component={this}
                datacore={this.datacore}
                settings={this.datacore.settings}
            >
                {this.element}
            </DatacoreContextProvider>,
            this.container
        );
    }

    public onunload(): void {
        unmountComponentAtNode(this.container);
    }
}
