import { Fragment, VNode, h } from "preact";
import { Dispatch, Reducer, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useReducer } from "preact/compat";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useStableCallback } from "./hooks";
import { CURRENT_FILE_CONTEXT, Lit, Markdown } from "./markdown";
import { Literal } from "expression/literal";

export interface EditableState<T> {
    isEditing?: boolean;
    content: T;
    updater: (val: T) => any;
    inline?: boolean;
}

export interface EditableProps<T> {
    sourcePath?: string;
    defaultRender?: VNode;
    editor: React.ReactNode;
    state: EditableState<T>;
    dispatch: Dispatch<EditableAction<T>>;
    state: EditableState<T>;
}

export type EditableAction<T> =
    | {
          type: "commit";
          // oldValue: any,
          newValue: T;
      }
    | {
          type: "editing-toggled";
          newValue: boolean;
      }
    | {
          type: "content-changed";
          newValue: T;
      };

export function editableReducer<T>(state: EditableState<T>, action: EditableAction<T>): EditableState<T> {
    switch (action.type) {
        case "commit":
            state.updater(action.newValue);
            return { ...state, content: action.newValue };
        case "editing-toggled":
            state.updater(state.content);
            return { ...state, isEditing: action.newValue };
        case "content-changed":
            return { ...state, content: action.newValue };
        default:
            return state;
    }
    return state;
}

export function useEditableDispatch<T>(
    initial: EditableState<T> | (() => EditableState<T>)
): [EditableState<T>, Dispatch<EditableAction<T>>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), [initial]);
    return useReducer(editableReducer as Reducer<EditableState<T>, EditableAction<T>>, init, (s) => init);
}

export function cleanUpText(original: string, inline: boolean): string {
    if (typeof original === "string") {
        let ret = original
            .replace(/<div><\/div>|<br>/gim, "\n")
            .replace(/<div[^>]*>/gim, "")
            .replace(/<\/div>/gim, "")
            .replace(/&nbsp;/gim, " ");
        if (inline) ret = ret.trimEnd();
        return ret;
    }
    return original;
}

function insertBrs(original: string): string {
    if (typeof original == "string") {
        return original.replace(/\n/gm, "<br>").replace(/&nbsp;/gm, " ");
    } else {
        return original;
    }
}

export function Editable<T>({ sourcePath, defaultRender, editor, dispatch, state }: EditableProps<T>) {
    const currentRef = useRef(null);

    const element = useMemo(() => {
        if (state.isEditing) {
            return <Fragment>{editor}</Fragment>;
        } else {
            return defaultRender;
        }
    }, [state.isEditing, state.content, sourcePath, defaultRender]);
		useEffect(() => {
			dispatch({type: "content-changed", newValue: state.content})
		}, [state.content, state.isEditing])
    return (
        <span className="datacore-editable-outer" ref={currentRef}>
            {element}
        </span>
    );
}

export function TextEditable(props: EditableState<string> & { markdown?: boolean; sourcePath: string }) {
    const cfc = useContext(CURRENT_FILE_CONTEXT);
    const [state, dispatch] = useEditableDispatch<string>(() => ({
        isEditing: false,
        content: props.content,
        updater: props.updater,
        inline: props.inline ?? true,
    }));

    const text = useRef("-");
    useEffect(() => {
				text.current = props.content;
        dispatch({ type: "content-changed", newValue: props.content });
    }, [props.content]);

    const onChangeCb = useStableCallback(
        async (evt: ContentEditableEvent) => {
            text.current = insertBrs(evt.target.value);
            // await onChange(text.current)
        },
        [text.current, props.sourcePath, state.content, state.updater, state.isEditing]
    );

    const finalize = async () => {
        dispatch({
            type: "commit",
            newValue: cleanUpText(text.current, props.inline!),
        });
        dispatch({
            type: "editing-toggled",
            newValue: false,
        });
    };
    const onInput = useStableCallback(
        async (e: KeyboardEvent) => {
            if (state.inline) {
                if (e.key === "Enter") {
                    await finalize();
                }
            } else {
                if (e.key === "Escape") {
                    await finalize();
                }
            }
        },
        [text.current, props.sourcePath, state.updater, state.content, state.isEditing]
    );

    const dblClick = useStableCallback(
        (e: MouseEvent) => {
            text.current = insertBrs(text.current);
            dispatch({
                type: "editing-toggled",
                newValue: true,
            });
        },
        [text.current, props.sourcePath, state.updater, state.isEditing, state.content]
    );
    const readonlyEl = (
        <Fragment>
            {props.markdown ? (
                <Markdown
                    content={cleanUpText(text.current as string, props.inline ?? false)}
                    sourcePath={props.sourcePath || cfc}
                />
            ) : (
                <Lit inline={false} sourcePath={props.sourcePath || cfc} value={text.current as Literal} />
            )}
        </Fragment>
    );
    // }, [props.markdown, text.current, state.content, state.isEditing]);
    const editor = (
        // @ts-ignore
        <ContentEditable
            tagName="span"
            onKeyUp={onInput}
            className="datacore-editable"
            onChange={onChangeCb}
            html={text.current}
        />
    );
    //, [state.content, text.current]
    //);
    return (
        <span onDblClick={dblClick}>
            <Editable<string> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
						{/* {state.isEditing ? {editor} : readonlyEl} */}
        </span>
    );
}
