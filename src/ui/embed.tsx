import { useContext, useEffect, useRef } from "preact/hooks";
import { APP_CONTEXT, COMPONENT_CONTEXT } from "./markdown";
import { h } from "preact";

export interface EmbedProps {
	extension: string;
	originalPath: string;
	linktext: string;
}

export function Embed(props: EmbedProps) {
	const component = useContext(COMPONENT_CONTEXT);
	const app = useContext(APP_CONTEXT);
	const container = useRef<HTMLElement | null>(null);
	useEffect(() => {
		if(!container.current) return;

		container.current.innerHTML = "";

		app.embedRegistry.getEmbedCreator({extension: props.extension})({
			linktext: props.linktext,
			sourcePath: props.originalPath,
			showInline: true,
			app,
			depth: 0,
			containerEl: container.current
		})
	})
	return (<div>

	</div>)
}