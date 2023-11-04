import { Lit, ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { JSX, createElement, h, isValidElement, render } from "preact";
import React from "preact/compat";
import { unmountComponentAtNode } from "preact/compat";
// import * as babel from "@babel/standalone";
// import { Root, createRoot } from "preact/compat";
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
					// Using babel in this one place adds about 5mb to the js bundle (from 500kb -> 5.7mb)! This noticably
					// increases plugin load time and so it may be worth going for simpler alternatives.
					/* const jsx = babel.transform(this.script, {
							plugins: [["transform-react-jsx", { pragma: "h" }]],
							parserOpts: {
									allowAwaitOutsideFunction: true,
									allowImportExportEverywhere: true,
									allowSuperOutsideMethod: true,
									allowReturnOutsideFunction: true,
							},
					}).code!; */

					const renderable = await asyncEvalInContext(this.script, this.api);
					if (!this.loaded) return;

					const renderableElement = makeRenderableElement(renderable, this.path);

					// Very contextual!
					render(
							<DatacoreContextProvider
									app={this.api.app}
									component={this}
									datacore={this.api.core}
									settings={this.api.core.settings}
							>
									<CURRENT_FILE_CONTEXT.Provider value={this.path}>
											<SimpleErrorBoundary message="The script failed while executing.">
													{renderableElement}
											</SimpleErrorBoundary>
									</CURRENT_FILE_CONTEXT.Provider>
							</DatacoreContextProvider>,
							this.container
					);
			} catch (ex) {
					render(
							<ErrorMessage
									message="Failed to render this datacore script. The script may be being edited, or it may have a bug."
									error={"" + ex}
							/>,
							this.container
					);
			}
	}

	public onunload(): void {
			unmountComponentAtNode(this.container)
			this.loaded = false;
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
	return new Function("dc", "React", script)(context, React);
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