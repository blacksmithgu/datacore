import { DatacoreLocalApi } from "api/local-api";
import { MarkdownRenderChild } from "obsidian";
import { asyncEvalInContext } from "api/utils";
import { ReactRenderer } from "./markdown";
import { VNode } from "preact";

export class DatacoreJSRenderer extends ReactRenderer {
	static PRE: string = "const datacore = this; const dc = this;"
	constructor(
		public api: DatacoreLocalApi,
		public script: string, 
		public container: HTMLElement, 
		public origin: string
	) {
		super(api.core.app, api.core, container, origin, api.preact.h("div", {}) as VNode<{}>);

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