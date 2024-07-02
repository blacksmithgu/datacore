import { Lit, ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { JSX, createElement, h, isValidElement, render, Fragment } from "preact";
import { unmountComponentAtNode } from "preact/compat";
import { ScriptLanguage, asyncEvalInContext, transpile } from "utils/javascript";

/**
 * Renders a script by executing it and handing it the appropriate React context to execute
 * automatically.
 */
export class DatacoreJSRenderer extends MarkdownRenderChild {
    private loaded: boolean = false;

    public constructor(
        public api: DatacoreLocalApi,
        public container: HTMLElement,
        public path: string,
        public script: string,
        public language: ScriptLanguage
    ) {
        super(container);
    }

    public async onload() {
        this.loaded = true;

        // Attempt to parse and evaluate the script to produce either a renderable JSX object or a function.
        try {
            const primitiveScript = transpile(this.script, this.language);

            const renderable = await asyncEvalInContext(primitiveScript, {
                dc: this.api,
                h: h,
                Fragment: Fragment,
            });

            // Early return in case state changes during the async call above.
            if (!this.loaded) return;

            const renderableElement = makeRenderableElement(renderable, this.path);
            render(
                <DatacoreContextProvider
                    app={this.api.app}
                    component={this}
                    datacore={this.api.core}
                    settings={this.api.core.settings}
                >
                    <CURRENT_FILE_CONTEXT.Provider value={this.path}>
                        <SimpleErrorBoundary message="The datacore script failed to execute.">
                            {renderableElement}
                        </SimpleErrorBoundary>
                    </CURRENT_FILE_CONTEXT.Provider>
                </DatacoreContextProvider>,
                this.container
            );
        } catch (ex) {
            console.error(ex);
            render(
                <ErrorMessage message="Datacore failed to render the code block." error={"" + ex} />,
                this.container
            );
        }
    }

    public onunload(): void {
        if (this.loaded) unmountComponentAtNode(this.container);
        this.loaded = false;
    }

    /** Attempts to convert the script in the given language to plain javascript; will throw an Error on failure. */
}

/** Make a renderable element from the returned object; if this transformation is not possible, throw an exception. */
export function makeRenderableElement(object: any, sourcePath: string): JSX.Element {
    if (typeof object === "function") {
        return createElement(object, {});
    } else if (Array.isArray(object)) {
        return createElement(
            "div",
            {},
            (object as any[]).map((x) => makeRenderableElement(x, sourcePath))
        );
    } else if (isValidElement(object)) {
        return object;
    } else {
        return <Lit value={object} sourcePath={sourcePath} />;
    }
}
