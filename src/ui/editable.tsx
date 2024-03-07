import { Fragment, VNode } from "preact";
import { Dispatch, Reducer, useContext, useEffect, useMemo, useRef } from "preact/hooks";
import { ChangeEvent, useReducer } from "preact/compat";
import { useStableCallback } from "./hooks";
import { CURRENT_FILE_CONTEXT, Lit, Markdown } from "./markdown";
import { Literal, LiteralType, Literals } from "expression/literal";
import DatePicker from "react-date-picker";
import { Value as DPickerValue } from "react-date-picker/dist/cjs/shared/types";
import { DateTime } from "luxon";
import { FieldControlProps } from "./fields/common-props";
import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown/markdown";
import { BooleanField } from "./fields/boolean-field";
import { ProgressEditable } from "./fields/progress-field";
import { Rating } from "./fields/rating";

export interface EditableState<T> {
  isEditing?: boolean;
  content: T;
  updater: (val: T) => unknown;
  inline?: boolean;
}

export interface EditableProps<T> {
  sourcePath?: string;
  defaultRender?: VNode;
  editor: React.ReactNode;
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
}

export function useEditableDispatch<T>(
  initial: EditableState<T> | (() => EditableState<T>)
): [EditableState<T>, Dispatch<EditableAction<T>>] {
  const init = useMemo(() => (typeof initial == "function" ? initial() : initial), [initial]);
  return useReducer(editableReducer as Reducer<EditableState<T>, EditableAction<T>>, init, (s) => init);
}

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
  const dblclick = useStableCallback((evt: MouseEvent) => {
    dispatch({ type: "editing-toggled", newValue: !state.isEditing });
  }, []);
  return (
    <span onDblClick={dblclick} className="datacore-editable-outer" ref={currentRef}>
      {element}
    </span>
  );
}

export function DateEditable({
	dispatch,
	sourcePath,
	...rest
}: EditableState<DateTime | string | null> & { sourcePath: string; dispatch: Dispatch<EditableAction<DateTime | string | null>> }) {
	/** the extra dispatch is _just_ in case... */
	const [state, o] = useEditableDispatch<DateTime | string | null>(() => ({
    isEditing: rest.isEditing,
    content: rest.content,
    updater: rest.updater,
    inline: rest.inline ?? false,
  }));

  const onChange = (v: DPickerValue) => {
    dispatch({
      type: "content-changed",
      newValue: !!v ? DateTime.fromJSDate(v as Date) : null,
    });
    dispatch({
      type: "commit",
      newValue: !!v ? DateTime.fromJSDate(v as Date) : null,
    });
		o({
      type: "commit",
      newValue: !!v ? DateTime.fromJSDate(v as Date) : null,
    })
  };
	const jsDate = useMemo(() => {
		return (state.content instanceof DateTime
			? state.content
			: typeof state.content == "string" && !!state.content
			? DateTime.fromJSDate(new Date(Date.parse(state.content)))
			: null
		)?.toJSDate()
	}, [state.content])
  const editorNode = (
    <DatePicker
      value={
        jsDate ?? null
      }
      calendarType="gregory"
      onChange={onChange}
    />
  );
  return <Editable<DateTime | string | null> dispatch={dispatch} state={rest} editor={editorNode} />;
}

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
	const finalize = async () => {
    dispatch({
      type: "commit",
      newValue: value.current,
    });
    dispatch({
      type: "editing-toggled",
      newValue: false,
    });
  };
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
  const readonlyEl = (
		<Lit inline={false} sourcePath={cfc} value={value.current as Literal} />
  );
	const editor = (
    <input className="datacore-editable" type="number" onChange={onChangeCb} onKeyUp={onInput} />
  )
	return (<span className="has-texteditable" onDblClick={dblClick}>
      <Editable<number> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
  </span>)
}

export function TextEditable(props: EditableState<string> & { markdown?: boolean; sourcePath: string }) {
  const cfc = useContext(CURRENT_FILE_CONTEXT);
  const [state, dispatch] = useEditableDispatch<string>(() => ({
    isEditing: false,
    content: props.content,
    updater: props.updater,
    inline: props.inline ?? false,
  }));

  const text = useRef("-");
  useEffect(() => {
    text.current = props.content;
    dispatch({ type: "content-changed", newValue: props.content });
  }, [props.content]);

  const onChangeCb = useStableCallback(
    async (evt: ChangeEvent) => {
      text.current = (evt.currentTarget as HTMLTextAreaElement).value;
    },
    [text.current, props.sourcePath, state.content, state.updater, state.isEditing]
  );

  const finalize = async () => {
    dispatch({
      type: "commit",
      newValue: text.current,
    });
    dispatch({
      type: "editing-toggled",
      newValue: false,
    });
  };
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
  const editor = !state.inline ? (
    <textarea className="datacore-editable" onChange={onChangeCb} onKeyUp={onInput}>
      {text.current}
    </textarea>
  ) : (
    <input className="datacore-editable" type="text" onChange={onChangeCb} onKeyUp={onInput} />
  );
  return (
    <span className="has-texteditable" onDblClick={dblClick}>
      <Editable<string> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
    </span>
  );
}

export function EditableListField({
  props,
  field,
  parent,
  type,
	dispatch,
	renderAs,
	config
}: { props: EditableState<Literal> } & FieldControlProps<Literal> & {
    parent: MarkdownTaskItem | MarkdownListItem;
    type: LiteralType;
    dispatch: Dispatch<EditableAction<Literal>>;
  }) {
  const editor = useMemo(() => {
    switch (type) {
      case "date":
        return (
          <DateEditable
						dispatch={dispatch}
            sourcePath={parent.$file}
            content={props.content as DateTime}
            updater={props.updater as (val: string | DateTime | null) => any}
          />
        );
      case "boolean":
        return <BooleanField type={type} value={props.content as boolean} field={field} file={parent.$file} />;
      case "string":
        return (
          <TextEditable
            sourcePath={parent.$file}
            isEditing={false}
            content={props.content as string}
            updater={props.updater as (val: string) => unknown}
          />
        );
			case "number":
				switch(renderAs) {
					case "progress":
						return (
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
							)
						case "rating":
							return (
								<Rating 
									field={field}
									file={parent.$file}
									type={type}
									config={config} 
									value={props.content as (string | number)} 
									updater={props.updater}
								/>
							)
					default:
						return (
								<NumberEditable
									content={props.content as number}
									updater={props.updater} 
								/>
							)
				}
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
  }, [parent, field, props.content, props.content, props, config, renderAs]);
	const dblclick = useStableCallback((evt: MouseEvent) => {
		dispatch({type: "editing-toggled", newValue: !props.isEditing})
	}, [props.isEditing]);
  return (
    <div className="datacore-field" onDblClick={dblclick}>
      <span className="field-title" onDblClick={dblclick}>{field.key}</span>
      <span className="field-value" tabIndex={0}>
        {editor}
      </span>
    </div>
  );
}
