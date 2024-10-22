import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown/markdown";
import { DefaultListElement, ListState } from "./list";
import { useIndexUpdates, useStableCallback } from "./hooks";
import { Fragment } from "preact";
import { APP_CONTEXT, DATACORE_CONTEXT } from "./markdown";
import { JSXInternal } from "preact/src/jsx";
import { Dispatch, useContext, useMemo, useRef, useState } from "preact/hooks";
import { rewriteTask, setTaskCompletion } from "./utils";
import { Literal, Literals } from "expression/literal";
import {
  EditableAction,
  EditableListField,
  EditableState,
  TextEditable,
  useEditableDispatch,
} from "./editable";
import { setInlineField } from "index/import/inline-field";
import { BaseFieldProps } from "./fields/common-props";
import { Field } from "expression/field";
import { DateTime } from "luxon";

export interface TaskProps extends ListState<MarkdownTaskItem | MarkdownListItem> {
  /** task states to cycle through, if specified */
  states?: string[];
	/** fields to display under each item in this task list */
  displayedFields?: (BaseFieldProps<Literal> & { key: string })[];
}

export function TaskList({
  rows: items,
  states,
  renderer: listRenderer = (item, index) => <DefaultListElement element={item} />,
  ...rest
}: TaskProps) {
	
  const core = useContext(DATACORE_CONTEXT);
	useIndexUpdates(core, {debounce: 0});
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
	let iu = useIndexUpdates(core)
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
  }, [props.states, item, item.$status, item.$completed]);

	const completedRef = useRef<Dispatch<EditableAction<Literal>>>(null)
  const onChecked = useStableCallback(
    async (evt: JSXInternal.TargetedMouseEvent<HTMLInputElement>) => {
      // evt.stopPropagation();
      const completed = evt.currentTarget.checked;
			
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
				// taskDispatch({type: "field-changed", newValue: DateTime.now().toFormat(settings.defaultDateFormat), fieldKey: settings.taskCompletionTextField, })
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
          withFields = setInlineField(withFields, field, item.$infields[field].raw);
        }
				await rewriteTask(app.vault, item, item.$status, withFields);
			}
    },
    [item]
  );
  const checked = useMemo(() => item.$status !== " ", [item.$status]);
  const eState: EditableState<string> = useMemo(() => {
    return {
      updater: onChanger,
      content: item.$strippedText,
      inline: false,
    } as EditableState<string>;
  }, [item, props.rows, iu]);
  const theElement = useMemo(() => <TextEditable sourcePath={item.$file} {...eState} />, [eState, item, props.rows, iu]);

  const editableFields = useMemo(() => {
		return (props.displayedFields || []).map((ifield) => {
			let defVal = typeof ifield.defaultValue == "function" ? ifield.defaultValue() : ifield.defaultValue;
      let defField: Field = {
        key: ifield.key,
        value: defVal,
        raw: Literals.toString(defVal),
      };
      const [fieldValue, setFieldValue] = useState<Literal>(item.$infields[ifield?.key]?.value || defField.value!);
      const [state2, dispatch] = useEditableDispatch<Literal>({
        content: fieldValue,
				isEditing: false,
        updater: useStableCallback((val: Literal) => {
					let withFields = setInlineField(item.$text, ifield.key, Literals.toString(val));
					for (let field in item.$infields) {
						withFields = setInlineField(withFields, field, item.$infields[field].raw);
					}
					rewriteTask(app.vault, item, item.$status, withFields);
        }, [item]),
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
    })
	}, [props.rows, item]);

  return (
    <li class={"datacore task-list-item" + (checked ? " is-checked" : "")} data-task={item.$status}>
      <input class="datacore task-list-item-checkbox" type="checkbox" checked={checked} onClick={onChecked} />
      <div>
				<div className="datacore-list-item-content">
					{theElement}
					<div class="datacore-list-item-fields">
						{editableFields}
					</div>
				</div>
			</div>
      {item.$elements.length > 0 && <TaskList {...props} rows={item.$elements} />}
    </li>
  );
}
