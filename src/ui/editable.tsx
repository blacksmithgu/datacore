import { Fragment, VNode, h } from "preact";
import { useContext, useMemo, useRef, useState } from "preact/hooks";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useStableCallback } from "./hooks";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, Lit, Markdown } from "./markdown";
import { Literal } from "expression/literal";


export interface EditableProps {
	content: Literal;
	sourcePath?: string;
	onChange?: (val: Literal) => any;
	inline?: boolean;
	defaultRender?: VNode;
}

export function cleanUpText(original: string): string {
	return original.replace(/<div><\/div>|<br>/gm, "\n")
	.replace(/<div[^>]*>/gm, "")
	.replace(/<\/div>/gm, "")
}

export function Editable({
	content, sourcePath, onChange = (e: Literal) => e, inline = true,
	defaultRender
}: EditableProps) {
	const cfc = useContext(CURRENT_FILE_CONTEXT);
	const app = useContext(APP_CONTEXT)
	const [editing, setIsEditing] = useState(false);
	const currentRef = useRef(null);
	
	const text = useRef(content);

	const onChangeCb = useStableCallback(async (evt: ContentEditableEvent) => {
		text.current = evt.target.value;
		await onChange(text.current)
	}, [text.current, content, sourcePath, onChange]);

	const onInput = useStableCallback((e: KeyboardEvent) => {
		if(inline) {
			if(e.key === "Enter") {
				if(typeof text.current === "string") onChange(text.current.trimEnd());
				else onChange(text.current);
				setIsEditing(false);
			}
		} else {
			if( e.key === "Escape") {
				text.current = cleanUpText(text.current as string)
				if(inline) {
					text.current = text.current.trimEnd()
				}
				onChange(text.current);
				setIsEditing(false);
			}
		}
		
	}, [text.current, content, sourcePath, onChange])

	const element = useMemo(() => {
		if(editing) {
			// @ts-ignore preact is weird!!!!! :/
			return <ContentEditable onBlur={() => setIsEditing(false)} tagName="span" onKeyUp={onInput} className="datacore-editable" onChange={onChangeCb} html={content} />		
		} else {
			return defaultRender ? <Fragment>{defaultRender}</Fragment> : <Lit value={text.current} sourcePath={sourcePath || cfc} />
		}
	}, [editing, content, sourcePath])
	const dblClick = useStableCallback((e: MouseEvent) => {
		text.current = (text.current?.toString())?.replace(/\n/gm, "<br>")!
		setIsEditing(true)
	}, [text.current, content, sourcePath, onChange, editing])
	// let b =
	return <span ref={currentRef} onDblClick={dblClick}>
		{element}
		{/* @ts-ignore */}
	</span>
}