import { DatacoreLocalApi } from "api/local-api";
import { MarkdownRenderChild } from "obsidian";
import { asyncEvalInContext } from "api/utils";
import { DatacoreContextProvider, ReactRenderer } from "./markdown";
import { VNode, h } from "preact";

export class DatacoreJSRenderer extends MarkdownRenderChild {
	static PRE: string = "const datacore = this; const dc = this;"
	constructor(
		public api: DatacoreLocalApi,
		public script: string, 
		public container: HTMLElement, 
		public origin: string
	) {
		super(container);

	}
	async onload() {
		this.containerEl.innerHTML = "";
		try {
			await asyncEvalInContext(DatacoreJSRenderer.PRE + "\n" + this.script, this.api)
		} catch(e) {
			console.error(e)
			this.containerEl.innerHTML = `<pre>${e}
${e.stack}
</pre>`;

		}
	}
}