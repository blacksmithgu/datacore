import { DatacoreLocalApi } from "api/local-api";
import { MarkdownRenderChild } from "obsidian";
import { asyncEvalInContext } from "api/utils";

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
			// i'll change this i promise xD
			console.error(e)
			this.containerEl.innerHTML = "either you fucked up or i fucked up. check the console.";

		}
	}
}