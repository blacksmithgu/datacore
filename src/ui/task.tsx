import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown/markdown";
import { DefaultListElement, ListState } from "./list";
import { useIndexUpdates, useStableCallback } from "./hooks";
import { Fragment, h } from "preact";
import { APP_CONTEXT, DATACORE_CONTEXT, Lit } from "./markdown";
import { JSXInternal } from "preact/src/jsx";
import { Dispatch, Reducer, useContext, useMemo, useReducer, useRef, useState } from "preact/hooks";
import { rewriteTask, setTaskCompletion } from "./utils";
import { Literal, Literals } from "expression/literal";
import {
  Editable,
  EditableAction,
  EditableListField,
  EditableState,
  TextEditable,
  editableReducer,
  useEditableDispatch,
} from "./editable";
import { InlineField, setInlineField } from "index/import/inline-field";
import { BaseFieldProps } from "./fields/common-props";
import { Field } from "expression/field";
import { DateTime } from "luxon";

export interface TaskProps extends ListState<MarkdownTaskItem | MarkdownListItem> {
  /** task states to cycle through, if specified */
  states?: string[];
	/** fields to display under each item in this task list */
  displayedFields?: (BaseFieldProps<Literal> & { key: string })[];
}

export interface TaskState extends TaskProps {
  states?: string[];
  status?: string;
	fields: Record<string, InlineField>;
}

export type TaskAction =
  | {
      type: "checked-changed";
      oldStatus: any;
      newStatus: string;
    }
  | {
      type: "field-changed";
			fieldKey: string;
      callback?: (val: Literal) => unknown;
      newValue: Literal;
    };

export function taskReducer(state: TaskState, action: TaskAction) {
  switch (action.type) {
    case "checked-changed":
      return { ...state, status: action.newStatus };
    case "field-changed":
      action.callback && action.callback(action.newValue);
			let newFields = {
				...state.fields,
				[action.fieldKey]: {
					key: action.fieldKey,
					value: action.newValue
				}
			} as Record<string, Field>;
			return {...state, fields: newFields}
  }
}

export function useTaskDispatch(initial: TaskState | (() => TaskState)): [TaskState, Dispatch<TaskAction>] {
  const init = useMemo(() => (typeof initial == "function" ? initial() : initial), [initial]);
  return useReducer(taskReducer as Reducer<TaskState, TaskAction>, init, (s) => init);
}

export function TaskList({
  rows: items,
  states,
  renderer: listRenderer = (item, index) => <DefaultListElement element={item} />,
  ...rest
}: TaskProps) {
  const content = useMemo(() => {
    return (
      <ul class="contains-task-list">
        {items?.map((item, ind) =>
          item instanceof MarkdownTaskItem ? <Task state={{ ...rest, states }} item={item} /> : listRenderer(item, ind)
        )}
      </ul>
    );
  }, [items, states]);
  return <Fragment>{!!items && content}</Fragment>;
}

export function Task({ item, state: props }: { item: MarkdownTaskItem; state: TaskProps }) {
  const app = useContext(APP_CONTEXT);
  const core = useContext(DATACORE_CONTEXT);
	const {settings} = core;
  const [state, taskDispatch] = useTaskDispatch({
    ...props,
    status: item.$status,
    states: props.states,
		fields: item.$infields,
  });
  const nextState = useMemo(() => {
    if (props.states && props.states?.length > 0) {
      let curIndex = props.states.findIndex((a) => a === item.$status);
      curIndex++;
      if (curIndex >= props.states.length) {
        curIndex = 0;
      }
      return props.states[curIndex];
    } else {
      return item.$completed ? " " : "x";
    }
  }, [state.states, item, item.$status, item.$completed]);

	const completedRef = useRef<Dispatch<EditableAction<Literal>>>(null)
  const onChecked = useStableCallback(
    async (evt: JSXInternal.TargetedMouseEvent<HTMLInputElement>) => {
      // evt.stopPropagation();
      const completed = evt.currentTarget.checked;
      const oldStatus = item.$status;

      let newStatus: string;
      if (evt.shiftKey) {
        newStatus = nextState!;
      } else {
        newStatus = completed ? "x" : " ";
      }
      const parent = evt.currentTarget.parentElement;
      parent?.setAttribute("data-task", newStatus);
      async function rewr(task: MarkdownTaskItem) {
        let newText = setTaskCompletion(
          task.$text,
          // TODO: replace these next three arguments with proper settings
          false,
          settings.taskCompletionTextField,
          settings.defaultDateFormat,
          newStatus?.toLowerCase() === "x"
        );
        await rewriteTask(app.vault, task, newStatus, newText);
				taskDispatch({ type: "checked-changed", oldStatus, newStatus });
				taskDispatch({type: "field-changed", newValue: DateTime.now().toFormat(settings.defaultDateFormat), fieldKey: settings.taskCompletionTextField, })
      }
      if (settings.recursiveTaskCompletion) {
        let flatted: MarkdownTaskItem[] = [item];
        function flatter(iitem: MarkdownTaskItem | MarkdownListItem) {
          if (iitem instanceof MarkdownTaskItem) {
            flatted.push(iitem);
            iitem.$elements.forEach(flatter);
          }
        }
        item.$elements.forEach(flatter);
        flatted = flatted.flat(Infinity);
        for (let iitem of flatted) {
          await rewr(iitem);
        }
      } else {
        await rewr(item);
      }
			const nv = completed ? DateTime.now().toFormat(settings.defaultDateFormat) : null
			completedRef.current && completedRef.current({type: "commit", newValue: nv})
    },
    [props.rows]
  );
  const onChanger = useStableCallback(
    async (val: Literal) => {
      if (typeof val === "string") {
        let withFields = val;
        for (let field in item.$infields) {
          setInlineField(withFields, field, item.$infields[field].raw);
        }
        await rewriteTask(app.vault, item, item.$status, withFields);
				completedRef.current && completedRef.current({type: "commit", newValue: val})
      }
    },
    [item]
  );
  const checked = useMemo(() => state.status !== " ", [state, item]);
  const eState: EditableState<string> = useMemo(() => {
    return {
      updater: onChanger,
      content: item.$strippedText,
      inline: false,
    } as EditableState<string>;
  }, [item, props.rows]);
  const theElement = useMemo(() => <TextEditable sourcePath={item.$file} {...eState} />, [eState, item, props.rows]);
  const editableFields = (state.displayedFields || []).map((ifield) => {
      let defField: Field = {
        key: ifield.key,
        value: ifield.defaultValue!,
        raw: Literals.toString(ifield.defaultValue),
      };
      const [fieldValue, setFieldValue] = useState<Literal>(item.$infields[ifield?.key]?.value || ifield.defaultValue!);
      const [state2, dispatch] = useEditableDispatch<Literal>({
        content: fieldValue,
        isEditing: false,
        updater: (val: Literal) => {
            let withFields = setInlineField(item.$text, ifield.key, val ? Literals.toString(val) : undefined);
            rewriteTask(app.vault, item, item.$status, withFields).then(() => {
							taskDispatch({ type: "field-changed", newValue: val, fieldKey: ifield.key });
						});
          },
      });
			if(ifield.key == settings.taskCompletionTextField) {
				//@ts-ignore huh?
				completedRef.current = dispatch
			}
      return (
        <EditableListField
          props={state2}
          dispatch={dispatch}
          type={ifield.type || Literals.wrapValue(fieldValue)!.type}
          file={item.$file}
          field={item.$infields[ifield.key] || defField}
          parent={item}
          updater={state2.updater}
          value={fieldValue}
        />
      );
    });

  return (
    <li class={"datacore task-list-item" + (checked ? " is-checked" : "")} data-task={state.status}>
      <input class="datacore task-list-item-checkbox" type="checkbox" checked={checked} onClick={onChecked} />
      <div>
        {theElement}
        {editableFields}
      </div>
      {item.$elements.length > 0 && <TaskList {...props} rows={item.$elements} />}
    </li>
  );
}
