/** Provides core preact / rendering utilities for all view types. */
import { App, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { Component } from "obsidian";
import { Literal, Literals } from "expression/literal";
import React, {
    createContext,
    CSSProperties,
    EventHandler,
    Fragment,
    MouseEvent,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Datacore } from "index/datacore";
import { Settings } from "settings";
import { currentLocale, renderMinimalDate, renderMinimalDuration } from "expression/normalize";
import { extractImageDimensions, isImageEmbed } from "ui/media";
import { useStableCallback } from "./hooks";
import { MantineProvider } from "@mantine/styles";
import { Root, createRoot } from "react-dom/client";

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
        <MantineProvider theme={{ colorScheme: "dark" }} withNormalizeCSS withGlobalStyles>
            <COMPONENT_CONTEXT.Provider value={component}>
                <APP_CONTEXT.Provider value={app}>
                    <DATACORE_CONTEXT.Provider value={datacore}>
                        <SETTINGS_CONTEXT.Provider value={settings}>{children}</SETTINGS_CONTEXT.Provider>
                    </DATACORE_CONTEXT.Provider>
                </APP_CONTEXT.Provider>
            </COMPONENT_CONTEXT.Provider>
        </MantineProvider>
    );
}

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
    onClick?: EventHandler<MouseEvent>;
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
        });
    }, [content, sourcePath, container.current]);

    return <span ref={container} style={style} className={cls} onClick={onClick}></span>;
}

/** Hacky preact component which wraps Obsidian's markdown renderer into a neat component. */
export const Markdown = React.memo(RawMarkdown);

/** Embeds an HTML element in the react DOM. */
export function RawEmbedHtml({ element }: { element: HTMLElement }) {
    const container = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!container.current) return;
        container.current.innerHTML = "";
        container.current.appendChild(element);
    }, [container.current, element]);

    return <span ref={container}></span>;
}

/** Embeds an HTML element in the react DOM. */
export const EmbedHtml = React.memo(RawEmbedHtml);

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
        }

        return <Markdown inline={inline} content={value.markdown()} sourcePath={sourcePath} />;
    } else if (Literals.isHtml(value)) {
        return <EmbedHtml element={value} />;
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
export const Lit = React.memo(RawLit);

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
    const fallbackRenderer = useCallback(
        ({ error, resetErrorBoundary }: FallbackProps) => {
            return <ErrorMessage title={title} message={message} error={"" + error} reset={resetErrorBoundary} />;
        },
        [title, message]
    );

    return <ErrorBoundary fallbackRender={fallbackRenderer}>{children}</ErrorBoundary>;
}

/** A trivial wrapper which allows a react component to live for the duration of a `MarkdownRenderChild`. */
export class ReactRenderer extends MarkdownRenderChild {
    private root: Root;

    public constructor(
        public app: App,
        public datacore: Datacore,
        public container: HTMLElement,
        public sourcePath: string,
        public element: React.ReactNode
    ) {
        super(container);
    }

    public onload(): void {
        // Very contextual!
        this.root = createRoot(this.container);
        this.root.render(
            <DatacoreContextProvider
                app={this.app}
                component={this}
                datacore={this.datacore}
                settings={this.datacore.settings}
            >
                {this.element}
            </DatacoreContextProvider>
        );
    }

    public onunload(): void {
        if (this.root) this.root.unmount();
    }
}
