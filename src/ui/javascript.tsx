import { Lit, ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { JSX, createElement, h, isValidElement, render, Fragment } from "preact";
import { unmountComponentAtNode } from "preact/compat";
import { transform } from "sucrase";

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
        public language: "js" | "ts" | "jsx" | "tsx"
    ) {
        super(container);
    }

    public async onload() {
        this.loaded = true;

        // Attempt to parse and evaluate the script to produce either a renderable JSX object or a function.
        try {
            const primitiveScript = DatacoreJSRenderer.convert(this.script, this.language);

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
  	public static convert(script: string, language: "js" | "ts" | "jsx" | "tsx"): string {
        switch (language) {
            case "js":
                return script;
            case "jsx":
                return transform(script, { transforms: ["jsx"], jsxPragma: "h", jsxFragmentPragma: "Fragment" })
                    .code;
            case "ts":
                return transform(script, { transforms: ["typescript"] }).code;
            case "tsx":
                return transform(script, {
                    transforms: ["typescript", "jsx"],
                    jsxPragma: "h",
                    jsxFragmentPragma: "Fragment",
                }).code;
        }
    }
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

/**
 * Evaluate a script where 'this' for the script is set to the given context. Allows you to define global variables.
 */
export function evalInContext(script: string, variables: Record<string, any>): any {
    const pairs = Object.entries(variables);
    const keys = pairs.map(([key, _]) => key);
    const values = pairs.map(([_, value]) => value);

    return new Function(...keys, script)(...values);
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: string, variables: Record<string, any>): Promise<any> {
    if (script.includes("await")) {
        return evalInContext("return (async () => { " + script + " })()", variables) as Promise<any>;
    } else {
        return Promise.resolve(evalInContext(script, variables));
    }
}
