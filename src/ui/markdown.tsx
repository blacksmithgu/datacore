/** Provides core preact / rendering utilities for all view types. */
import { App, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { h, createContext, render, Fragment, RenderableProps } from "preact";
import { useContext, useEffect, useErrorBoundary, useRef } from "preact/hooks";
import { Component } from "obsidian";
import { Literal, Literals } from "expression/literal";
import React, { unmountComponentAtNode } from "preact/compat";
import { Datacore } from "index/datacore";
import { Settings } from "settings";
import { currentLocale, renderMinimalDate, renderMinimalDuration } from "expression/normalize";
import { extractImageDimensions, isImageEmbed } from "ui/media";

export const COMPONENT_CONTEXT = createContext<Component>(undefined!);
export const APP_CONTEXT = createContext<App>(undefined!);
export const DATACORE_CONTEXT = createContext<Datacore>(undefined!);
export const SETTINGS_CONTEXT = createContext<Settings>(undefined!);

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
    style?: string;
    cls?: string;
    onClick?: (e: preact.JSX.TargetedMouseEvent<HTMLElement>) => void;
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

    return <span ref={container} style={style} class={cls} onClick={onClick}></span>;
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
}: {
    value: Literal | undefined;
    sourcePath: string;
    inline?: boolean;
    depth?: number;
}) {
    const settings = useContext(SETTINGS_CONTEXT);
    const app = useContext(APP_CONTEXT);

    // Short-circuit if beyond the maximum render depth.
    if (depth >= settings.maxRecursiveRenderDepth) return <Fragment>...</Fragment>;

    if (Literals.isNull(value) || value === undefined) {
        return <Markdown content={settings.renderNullAs} sourcePath={sourcePath} />;
    } else if (Literals.isString(value)) {
        return <Markdown content={value} sourcePath={sourcePath} />;
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

        return <Markdown content={value.markdown()} sourcePath={sourcePath} />;
    } else if (Literals.isHtml(value)) {
        return <EmbedHtml element={value} />;
    } else if (Literals.isFunction(value)) {
        return <Fragment>&lt;function&gt;</Fragment>;
    } else if (Literals.isArray(value)) {
        if (!inline) {
            return (
                <ul class={"dataview dataview-ul dataview-result-list-ul"}>
                    {value.map((subvalue) => (
                        <li class="dataview-result-list-li">
                            <Lit value={subvalue} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </li>
                    ))}
                </ul>
            );
        } else {
            if (value.length == 0) return <Fragment>&lt;Empty List&gt;</Fragment>;

            return (
                <span class="dataview dataview-result-list-span">
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
                <ul class="dataview dataview-ul dataview-result-object-ul">
                    {Object.entries(value).map(([key, value]) => (
                        <li class="dataview dataview-li dataview-result-object-li">
                            {key}: <Lit value={value} sourcePath={sourcePath} inline={inline} depth={depth + 1} />
                        </li>
                    ))}
                </ul>
            );
        } else {
            if (Object.keys(value).length == 0) return <Fragment>&lt;Empty Object&gt;</Fragment>;

            return (
                <span class="dataview dataview-result-object-span">
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
export function ErrorMessage({ title, message, reset }: { title?: string; message: string; reset?: () => void }) {
    return (
        <div class="datacore-error-box">
            {title && <h2 class="datacore-error-title">{title}</h2>}
            <p class="datacore-error-message">{message}</p>
            {reset && (
                <button class="datacore-error-retry" onClick={reset}>
                    Rerun
                </button>
            )}
        </div>
    );
}

/** A simple error boundary which renders a message on failure. */
export function ErrorBoundary({ title, message, children }: RenderableProps<{ title?: string; message?: string }>) {
    const [error, resetError] = useErrorBoundary();

    if (error) {
        return <ErrorMessage title={title} message={message + "\n\n" + error} reset={resetError} />;
    }

    return <Fragment>{children}</Fragment>;
}

/** A trivial wrapper which allows a react component to live for the duration of a `MarkdownRenderChild`. */
export class ReactRenderer extends MarkdownRenderChild {
    public constructor(
        public app: App,
        public datacore: Datacore,
        public container: HTMLElement,
        public element: h.JSX.Element
    ) {
        super(container);
    }

    public onload(): void {
        // Very contextual!
        render(
            <APP_CONTEXT.Provider value={this.app}>
                <COMPONENT_CONTEXT.Provider value={this}>
                    <DATACORE_CONTEXT.Provider value={this.datacore}>
                        <SETTINGS_CONTEXT.Provider value={this.datacore.settings}>
                            {this.element}
                        </SETTINGS_CONTEXT.Provider>
                    </DATACORE_CONTEXT.Provider>
                </COMPONENT_CONTEXT.Provider>
            </APP_CONTEXT.Provider>,
            this.containerEl
        );
    }

    public onunload(): void {
        unmountComponentAtNode(this.containerEl);
    }
}
