import { Lit, ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { JSX, createElement, h, isValidElement, render } from "preact";
import React from "preact/compat";
import { unmountComponentAtNode } from "preact/compat";

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
        public script: string
    ) {
        super(container);
    }

    public async onload() {
        this.loaded = true;

        // Attempt to parse and evaluate the script to produce either a renderable JSX object or a function.
        try {
            const renderable = await asyncEvalInContext(this.script, this.api);
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
            render(<ErrorMessage message="Failed to render the datacore script." error={"" + ex} />, this.container);
        }
    }

    public onunload(): void {
        if (this.loaded) unmountComponentAtNode(this.container);
        this.loaded = false;
    }
}

/** Make a renderable element from the returned object; if this transformation is not possible, throw an exception. */
export function makeRenderableElement(object: any, sourcePath: string): JSX.Element {
    if (typeof object === "function") {
        return createElement(object, {});
		}
		else if(Array.isArray(object)) {
			return createElement("div", {}, (object as any[]).map(x => makeRenderableElement(x, sourcePath)))
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
    return new Function("dc", "React", script)(context, React);
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: string, context: any): Promise<any> {
    if (script.includes("await")) {
        return evalInContext("return (async () => { " + script + " })()", context) as Promise<any>;
    } else {
        return await Promise.resolve(evalInContext(script, context));
    }
}
