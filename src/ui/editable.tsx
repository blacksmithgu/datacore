import { Fragment, VNode, h } from "preact";
import { Dispatch, Reducer, useContext, useMemo, useReducer, useRef, useState } from "preact/hooks";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useStableCallback } from "./hooks";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, Lit, Markdown } from "./markdown";
import { Literal } from "expression/literal";
import { JSXInternal } from "preact/src/jsx";

export interface EditableState<T> {
    isEditing?: boolean;
    content: T;
    onChange: (val: T) => any;
    inline?: boolean;
}

export interface EditableProps<T> {
    sourcePath?: string;
    defaultRender?: VNode;
    editor: React.ReactNode;
    state: EditableState<T>;
    dispatch: Dispatch<EditableAction<T>>;
}

export type EditableAction<T> = {
          type: "change";
          // oldValue: any,
          newValue: T;
      }
    | {
          type: "editing-toggled";
          newValue: boolean;
      };

export function editableReducer<T>(state: EditableState<T>, action: EditableAction<T>): EditableState<T> {
    switch (action.type) {
        case "change":
            state.onChange(action.newValue);
            return {...state, content: action.newValue};
        case "editing-toggled":
            state.onChange(state.content);
            return { ...state, isEditing: action.newValue };
    }
}

export function useEditableDispatch<T>(
    initial: EditableState<T> | (() => EditableState<T>)
): [EditableState<T>, Dispatch<EditableAction<T>>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), []);
    return useReducer(editableReducer as Reducer<EditableState<T>, EditableAction<T>>, init);
}

export function cleanUpText<T>(original: T, inline: boolean): string | T {
    if (typeof original === "string") {
        let ret = original
            .replace(/<div><\/div>|<br>/gim, "\n")
            .replace(/<div[^>]*>/gmi, "")
            .replace(/<\/div>/gmi, "")
            .replace(/&nbsp;/gmi, " ");
        if (inline) ret = ret.trimEnd();
        return ret;
    }
    return original;
}

function insertBrs<T>(original: T): string | T {
    if (typeof original == "string") {
        return original.replace(/\n/gm, "<br>").replace(/&nbsp;/gm, " ");
    } else {
        return original;
    }
}

export function Editable<T>({ state, sourcePath, defaultRender, editor }: EditableProps<T>) {
    const currentRef = useRef(null);

    const element = useMemo(() => {
        if (state.isEditing) {
            return <Fragment>{editor}</Fragment>;
        } else {
            return defaultRender;
        }
    }, [state.isEditing, state.content, sourcePath, defaultRender]);
    return (
        <span className="datacore-editable-outer" ref={currentRef}>
            {element}
        </span>
    );
}

export function TextEditable(props: EditableState<string> & { markdown?: boolean; sourcePath: string }) {
    const [state, dispatch] = useEditableDispatch<string>(() => ({
        isEditing: false,
        content: props.content,
        onChange: props.onChange,
        inline: props.inline ?? true,
    }));
    const cfc = useContext(CURRENT_FILE_CONTEXT);
    const text = useRef(state.content);
    const onChangeCb = useStableCallback(
        async (evt: ContentEditableEvent) => {
            text.current = insertBrs(evt.target.value);
            // await onChange(text.current)
        },
        [text.current, state.content, props.sourcePath, state.onChange, state.isEditing]
    );

    const finalize = async () => {
				dispatch({
					type: "change",
					newValue: cleanUpText(text.current, state.inline!)
				})
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
        [text.current, state.content, state.isEditing, props.sourcePath, state.onChange]
    );

    const dblClick = useStableCallback(
        (e: MouseEvent) => {
            text.current = insertBrs(text.current);
            dispatch({
                type: "editing-toggled",
                newValue: true,
            });
        },
        [text.current, state.content, props.sourcePath, state.onChange, state.isEditing]
    );
    const readonlyEl = useMemo(() => {
        return (
            <Fragment>
                {props.markdown ? (
                    <Markdown content={cleanUpText(text.current as string, state.inline ?? false)} sourcePath={props.sourcePath || cfc} />
                ) : (
                    <Lit inline={false} sourcePath={props.sourcePath || cfc} value={text.current as Literal} />
                )}
            </Fragment>
        );
    }, [props.markdown, text.current, state.isEditing]);
    const editor = useMemo(
			() => (
				// @ts-ignore
            <ContentEditable
                tagName="span"
                onKeyUp={onInput}
                className="datacore-editable"
                onChange={onChangeCb}
                html={text.current}
            />
        ),
        [state.content, text.current]
    );
    return (
        <span onDblClick={dblClick}>
            <Editable<string> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
        </span>
    );
}

