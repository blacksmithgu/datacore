/**
 * @module ui
 */
import { ComponentType, Fragment, FunctionComponent, VNode } from "preact";
import { Dispatch, Reducer, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ChangeEvent, useReducer } from "preact/compat";
import Select, { ActionMeta } from "react-select";
import { useStableCallback } from "../hooks";
import { CURRENT_FILE_CONTEXT, Lit, Markdown, SETTINGS_CONTEXT } from "../markdown";
import { Literal, LiteralType, Literals } from "expression/literal";
import { DateTime } from "luxon";
import { BaseFieldProps, FieldControlProps } from "./common-props";
import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown";
import { BooleanEditable } from "./boolean-field";
import { ProgressEditable } from "./progress-field";
import { RatingEditable } from "./rating";
import { useFinalizer } from "utils/fields";

import "./fields.css";

/** Core state for tracking an editable object.
 * @group States
 * @typeParam T - the type of the value being edited
 */
export interface EditableState<T> {
    /** Whether the value is currently being edited. */
    isEditing?: boolean;
    /** The current (arbitrary) content of the editable. */
    content: T;
    /** Callback whenever the editable value is changed. */
    updater: (val: T) => unknown;
    /** Whether the editor is being rendered inline in a paragraph or not. */
    inline?: boolean;
}

/**
 * @group Props
 * @typeParam T - the type of the value being edited
 */
export interface EditableProps<T> {
    /** Source file from which the editable value originates. */
    sourcePath?: string;
    /** Backup default renderer for this object. */
    defaultRender?: VNode;
    /** Node which points to the actual editor. */
    editor: React.ReactNode;
    /** Dispatcher for controlling the edit state, tracking updates, commits, and so on. */
    dispatch: Dispatch<EditableAction<T>>;
    /** The current state of the editor. */
    state: EditableState<T>;
}

type EditableElementProps<T, P> = EditableState<T> & P;
export type EditableElement<T, P = any> = FunctionComponent<EditableElementProps<T, P> & P>;

/**
 *  Actions which update/change the state of an editable.
 *
 * @internal
 * */
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

/** Default reducer for applying actions to the editable state.
 *
 * @internal
 */
export function editableReducer<T>(
    { content, updater, ...rest }: EditableState<T>,
    action: EditableAction<T>
): EditableState<T> {
    switch (action.type) {
        case "commit":
            updater(action.newValue);
            return { ...rest, updater, content: action.newValue };
        case "editing-toggled":
            !action.newValue && updater(content);
            return { ...rest, updater, content, isEditing: action.newValue };
        case "content-changed":
            return { ...rest, updater, content: action.newValue };
        default:
            return { content, updater, ...rest };
    }
}

/** Provides state management for an editable field.
 * @internal
 */
export function useEditableDispatch<T>(
    initial: EditableState<T> | (() => EditableState<T>)
): [EditableState<T>, Dispatch<EditableAction<T>>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), [initial]);
    return useReducer(editableReducer as Reducer<EditableState<T>, EditableAction<T>>, init, (s) => init);
}
/**
 * a higher-order-component for editing fields.
 * @param props
 * @group Editable Components
 */
export function Editable<T>({ sourcePath, defaultRender, editor, dispatch, state }: EditableProps<T>) {
    const currentRef = useRef(null);

    const element = useMemo(() => {
        if (state.isEditing) {
            return editor;
        } else {
            if (defaultRender) return defaultRender;
            else return <Lit value={state.content as Literal} inline={true} sourcePath="" />;
        }
    }, [state.isEditing, state.content, sourcePath, defaultRender]);

    useEffect(() => {
        dispatch && dispatch({ type: "content-changed", newValue: state.content });
    }, [state.content, state.isEditing]);

    return (
        <span className="datacore-editable-outer" ref={currentRef}>
            {element}
        </span>
    );
}

export function ControlledEditable<T, P = unknown>({
    defaultRender,
    editor: Editor,
    onUpdate,
    content,
    props,
    sourcePath,
}: Omit<EditableProps<T>, "dispatch" | "state" | "editor"> & {
    onUpdate: (v: T) => unknown;
    content: T;
    editor: EditableElement<T, P>;
    props: P;
    sourcePath: string;
}) {
    const [state, dispatch] = useEditableDispatch<T>(() => ({
        updater: onUpdate,
        content,
        inline: false,
        isEditing: false,
    }));
    return <Editor dispatch={dispatch} {...props} {...state} />;
}

/** A single selectable value.
 */
type SelectableBase = string | number;
/** A type for either multi- or single-select values. */
type SelectableType = SelectableBase | SelectableBase[];

/** Editable which allows for selection from a list of options.
 * @group Editable Components
 */
export function SelectableEditable({
    isEditing,
    content,
    updater,
    config,
    dispatch,
}: EditableState<SelectableType> &
    BaseFieldProps<SelectableType> & {
        dispatch: Dispatch<EditableAction<SelectableType>>;
    }) {
    const onChange = useStableCallback(
        (newValue: any, actionMeta: ActionMeta<SelectableType>) => {
            if (Array.isArray(newValue)) {
                dispatch({
                    type: "content-changed",
                    newValue: newValue.map((x) => x.value) as SelectableType,
                });
            } else {
                dispatch({
                    type: "content-changed",
                    newValue: newValue.value as SelectableType,
                });
            }
        },
        [config, content, updater, isEditing]
    );

    const editor = useMemo(() => {
        return (
            <Select
                classNamePrefix="datacore-selectable"
                onChange={onChange}
                unstyled
                isMulti={config?.multi ?? false}
                options={config?.options ?? []}
                menuPortalTarget={document.body}
                value={
                    config?.options.filter((x: any) =>
                        ((Array.isArray(content) ? content : [content]) as any[]).contains(x.value)
                    ) || []
                }
                classNames={{
                    input: (props: any) => "prompt-input",
                    valueContainer: (props: any) => "suggestion-item value-container",
                    container: (props: any) => "suggestion-container",
                    menu: (props: any) => "suggestion-content suggestion-container",
                    option: (props: any) => `suggestion-item${props.isSelected ? " is-selected" : ""}`,
                }}
            />
        );
    }, [content, updater, isEditing, config]);

    return <Editable editor={editor} dispatch={dispatch} state={{ isEditing, content, updater }} />;
}

/** Editable which allows for selecting a date.
 * @group Editable Components
 */
export function DateEditable({
    dispatch,
    sourcePath,
    ...rest
}: EditableState<DateTime | string | null> & {
    sourcePath: string;
    dispatch: Dispatch<EditableAction<DateTime | string | null>>;
}) {
    /** the extra dispatch is _just_ in case... */
    const [state, o] = useEditableDispatch<DateTime | string | null>(() => ({
        isEditing: rest.isEditing,
        content: rest.content,
        updater: rest.updater,
        inline: rest.inline ?? false,
    }));
    const settings = useContext(SETTINGS_CONTEXT);

    const onChange = (evt: ChangeEvent<HTMLInputElement>) => {
        let v = new Date(Date.parse(evt.currentTarget.value));
        dispatch({
            type: "content-changed",
            newValue: !!v ? DateTime.fromJSDate(v).toFormat(settings.defaultDateFormat) : null,
        });
        dispatch({
            type: "commit",
            newValue: !!v ? DateTime.fromJSDate(v).toFormat(settings.defaultDateFormat) : null,
        });
        o({
            type: "commit",
            newValue: !!v ? DateTime.fromJSDate(v).toFormat(settings.defaultDateFormat) : null,
        });
    };

    const jsDate = useMemo(() => {
        return state.content instanceof DateTime
            ? state.content
            : typeof state.content == "string" && !!state.content
            ? DateTime.fromJSDate(new Date(Date.parse(state.content)))
            : null;
    }, [state.content]);

    const editorNode = <input type="date" onChange={onChange} value={jsDate?.toFormat("yyyy-MM-dd")} />;
    return <Editable<DateTime | string | null> dispatch={dispatch} state={rest} editor={editorNode} />;
}

/** An editor which allows selecting a numneric value.
 * @group Editable Components
 */
export function NumberEditable(props: EditableState<number>) {
    const cfc = useContext(CURRENT_FILE_CONTEXT);

    const [state, dispatch] = useEditableDispatch<number>(() => ({
        isEditing: false,
        content: props.content,
        updater: props.updater,
        inline: true,
    }));
    const value = useRef(props.content);

    const onChangeCb = useStableCallback(
        async (evt: ChangeEvent) => {
            value.current = parseFloat((evt.currentTarget as HTMLTextAreaElement).value);
        },
        [value.current, state.content, state.updater, state.isEditing]
    );

    const finalize = useFinalizer(value.current, dispatch);
    const onInput = useStableCallback(
        async (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                await finalize();
            }
        },
        [value.current, state.updater, state.content, state.isEditing]
    );

    const dblClick = useStableCallback(
        (e: MouseEvent) => {
            dispatch({
                type: "editing-toggled",
                newValue: true,
            });
        },
        [value.current, state.updater, state.isEditing, state.content]
    );

    const readonlyEl = <Lit inline={false} sourcePath={cfc} value={value.current as Literal} />;
    const editor = <input className="datacore-editable" type="number" onChange={onChangeCb} onKeyUp={onInput} />;
    return (
        <span className="has-texteditable" onDblClick={dblClick}>
            <Editable<number> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
        </span>
    );
}

/** Editor which supports multi-line text editing; note this is a very simple input and does not support most markdown metadata.
 * @group Editable Components
 */
export function TextEditable(props: EditableState<string> & { markdown?: boolean; sourcePath: string }) {
    const cfc = useContext(CURRENT_FILE_CONTEXT);
    const [state, dispatch] = useEditableDispatch<string>(() => ({
        isEditing: props.isEditing,
        content: props.content,
        updater: props.updater,
        inline: props.inline ?? false,
    }));

    const text = useRef("-");
    useEffect(() => {
        text.current = state.content;
        dispatch({ type: "content-changed", newValue: state.content });
    }, [props.content, state.content]);

    const finalize = useFinalizer(state.content, dispatch);
    const onInput = useStableCallback(
        async (e: KeyboardEvent) => {
            if (props.inline) {
                if (e.key === "Enter") {
                    await finalize();
                }
            } else {
                if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    await finalize();
                }
            }
        },
        [text.current, props.sourcePath, state.updater, state.content, state.isEditing]
    );

    const dblClick = useStableCallback(
        (e: MouseEvent) => {
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
                <Markdown content={text.current as string} sourcePath={props.sourcePath || cfc} inline={false} />
            ) : (
                <Lit inline={false} sourcePath={props.sourcePath || cfc} value={text.current as Literal} />
            )}
        </Fragment>
    );
    const editor = (
        <UncontrolledTextEditable onInput={onInput} inline={props.inline} dispatch={dispatch} text={text.current} />
    );
    return (
        <span className="has-texteditable" onDblClick={dblClick}>
            <Editable<string> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
        </span>
    );
}

export function UncontrolledTextEditable({
    inline,
    text,
    dispatch,
    onInput,
}: {
    inline?: boolean;
    text: string;
    dispatch?: Dispatch<EditableAction<string>>;
    onInput?: (e: KeyboardEvent) => unknown;
}) {
    const [txt, setText] = useState(text);
    useEffect(() => {
        dispatch && dispatch({ newValue: txt, type: "content-changed" });
    }, [txt]);
    const onChangeCb = useStableCallback(
        async (evt: ChangeEvent) => {
            setText((evt.currentTarget as HTMLTextAreaElement).value);
        },
        [text, dispatch]
    );

    return !inline ? (
        <textarea className="datacore-editable" onChange={onChangeCb} onKeyUp={onInput}>
            {txt}
        </textarea>
    ) : (
        <input className="datacore-editable" type="text" onChange={onChangeCb} onKeyUp={onInput} />
    );
}
/** An editable list of items.
 *
 * @group Editable Components
 */
export function EditableListField({
    props,
    field,
    parent,
    type,
    dispatch,
    renderAs,
    config,
}: { props: EditableState<Literal> } & FieldControlProps<Literal> & {
        parent: MarkdownTaskItem | MarkdownListItem;
        type: LiteralType;
        dispatch: Dispatch<EditableAction<Literal>>;
    }) {
    const subEditor = useMemo(() => {
        switch (renderAs) {
            case "progress":
                return type == "number" ? (
                    <ProgressEditable
                        dispatch={dispatch}
                        isEditing={props.isEditing}
                        content={props.content as number}
                        updater={props.updater}
                        max={config?.max || 100}
                        sourcePath={parent.$file}
                        step={config?.step || 0.1}
                        min={config?.min || 0}
                    />
                ) : null;
            case "rating":
                return (
                    <RatingEditable
                        field={field}
                        file={parent.$file}
                        type={type}
                        config={config}
                        value={props.content as string | number}
                        updater={props.updater}
                    />
                );
            case "select":
                return (
                    <SelectableEditable
                        isEditing={props.isEditing}
                        dispatch={dispatch}
                        config={config}
                        updater={props.updater}
                        type={type}
                        content={props.content as SelectableType}
                    />
                );
            default:
                return null;
        }
    }, [parent, field, props.content, props.content, props, config, renderAs]);
    const editor = useMemo(() => {
        switch (type) {
            case "date":
                return (
                    <DateEditable
                        dispatch={dispatch}
                        sourcePath={parent.$file}
                        isEditing={props.isEditing}
                        content={props.content as DateTime}
                        updater={props.updater as (val: string | DateTime | null) => any}
                    />
                );
            case "boolean":
                return (
                    <BooleanEditable
                        updater={props.updater}
                        type={type}
                        value={props.content as boolean}
                        field={field}
                        file={parent.$file}
                    />
                );
            case "string":
                return (
                    <>
                        {subEditor ?? (
                            <TextEditable
                                sourcePath={parent.$file}
                                isEditing={false}
                                content={props.content as string}
                                updater={props.updater as (val: string) => unknown}
                            />
                        )}
                    </>
                );
            case "number":
                return <>{subEditor ?? <NumberEditable content={props.content as number} updater={props.updater} />}</>;
            default:
                return (
                    <TextEditable
                        sourcePath={parent.$file}
                        isEditing={props.isEditing}
                        content={Literals.toString(props.content)}
                        updater={props.updater as (val: string) => unknown}
                    />
                );
        }
    }, [parent, field, props.content, props.content, props, config, renderAs, subEditor]);

    const dblclick = useStableCallback(
        (evt: MouseEvent) => {
            evt.stopPropagation();
            dispatch({ type: "editing-toggled", newValue: !props.isEditing });
        },
        [props.isEditing]
    );

    return (
        <div className="datacore-field">
            <span className="field-title" onDblClick={dblclick}>
                {field.key}
            </span>
            <span className="field-value" tabIndex={0}>
                {editor}
            </span>
        </div>
    );
}
