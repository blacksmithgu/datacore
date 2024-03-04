import { Fragment, VNode, h } from "preact";
import { Dispatch, Reducer, useContext, useEffect, useMemo, useRef } from "preact/hooks";
import { ChangeEvent, useReducer } from "preact/compat";
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

export function DateEditable({
	dispatch,
	sourcePath,
	...rest
}: EditableState<DateTime | string | null> & { sourcePath: string; dispatch: Dispatch<EditableAction<DateTime | string | null>> }) {
	const [state, o] = useEditableDispatch<DateTime | string | null>(() => ({
    isEditing: false,
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
  const editorNode = (
    <DatePicker
      value={
        (state.content instanceof DateTime
          ? state.content
          : typeof state.content == "string" && !!state.content
          ? DateTime.fromJSDate(new Date(Date.parse(state.content)))
          : null
        )?.toJSDate() ?? null
      }
      calendarType="gregory"
      onChange={onChange}
    />
  );
  return <Editable<DateTime | string | null> dispatch={dispatch} state={rest} editor={editorNode} />;
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
			text.current = (evt.currentTarget as HTMLTextAreaElement).value
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
				<Markdown
					content={text.current as string}
					sourcePath={props.sourcePath || cfc}
					inline={false}
				/>
			) : (
				<Lit inline={false} sourcePath={props.sourcePath || cfc} value={text.current as Literal} />
			)}
		</Fragment>
	);
	const editor = !state.inline ? (
		<textarea className="datacore-editable" onChange={onChangeCb} onKeyUp={onInput}>
			{text.current}
		</textarea>
	) : <input className="datacore-editable" type="text" onChange={onChangeCb} onKeyUp={onInput}/>;
	return (
		<span className="has-texteditable" onDblClick={dblClick}>
			<Editable<string> dispatch={dispatch} editor={editor} defaultRender={readonlyEl} state={state} />
		</span>
	);
}
