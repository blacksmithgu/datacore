import {
    APP_CONTEXT,
    DATACORE_CONTEXT,
    SETTINGS_CONTEXT,
    COMPONENT_CONTEXT,
    Lit,
    ErrorMessage,
    ErrorBoundary,
} from "ui/markdown";
import { MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { render, h, JSX, createElement, isValidElement } from "preact";
import { unmountComponentAtNode } from "preact/compat";

/** Renders javascript code as an inline script inside of Obsidian with access. */
export class JavascriptRenderer extends MarkdownRenderChild {
    public constructor(
        public api: DatacoreLocalApi,
        public container: HTMLElement,
        public path: string,
        public script: string
    ) {
        super(container);
    }

    public async onload() {
        // TODO: Pass the script through babel.js with commonJS presets to convert JSX.
        // Attempt to parse and evaluate the script to produce either a renderable JSX object
        // or a function.
        try {
            const renderable = await asyncEvalInContext(this.script, this.api);
            const renderableElement = makeRenderableElement(renderable, this.path);

            // Very contextual!
            render(
                <APP_CONTEXT.Provider value={this.api.app}>
                    <COMPONENT_CONTEXT.Provider value={this}>
                        <DATACORE_CONTEXT.Provider value={this.api.core}>
                            <SETTINGS_CONTEXT.Provider value={this.api.core.settings}>
                                <ErrorBoundary title="Failed To Render" message="The script failed while executing.">
                                    {renderableElement}
                                </ErrorBoundary>
                            </SETTINGS_CONTEXT.Provider>
                        </DATACORE_CONTEXT.Provider>
                    </COMPONENT_CONTEXT.Provider>
                </APP_CONTEXT.Provider>,
                this.containerEl
            );
        } catch (ex) {
            render(
                <ErrorMessage
                    title="Failed to Render"
                    message={
                        "Failed to render this datacore script. The script may be being edited, or it may have a " +
                        "bug. The provided error was:\n\n" +
                        ex
                    }
                />,
                this.containerEl
            );
        }
    }

    public onunload(): void {
        unmountComponentAtNode(this.containerEl);
    }
}

/** Make a renderable element from the returned object; if this transformation is not possible, throw an exception. */
export function makeRenderableElement(object: any, sourcePath: string): JSX.Element {
    if (typeof object === "function") {
        return createElement(object, {});
    } else if (isValidElement(object)) {
        return object;
    } else {
        return <Lit value={object} sourcePath={sourcePath} />;
    }
}

/**
 * Evaluate a script where 'this' for the script is set to the given context. Allows you to define global variables.
 */
export function evalInContext(script: string, context: any): any {
    return new Function("dc", script)(context);
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: string, context: any): Promise<any> {
    if (script.includes("await")) {
        return evalInContext("return (async () => { " + script + " })()", context) as Promise<any>;
    } else {
        return Promise.resolve(evalInContext(script, context));
    }
}
