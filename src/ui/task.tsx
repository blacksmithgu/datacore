import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown/markdown";
import { DefaultListElement, ListState } from "./list";
import { useStableCallback } from "./hooks";
import { Fragment, h } from "preact";
import { APP_CONTEXT, DATACORE_CONTEXT, Lit } from "./markdown";
import { JSXInternal } from "preact/src/jsx";
import { Dispatch, Reducer, useContext, useMemo, useReducer } from "preact/hooks";
import { rewriteTask, setTaskCompletion } from "./utils";
import { Literal } from "expression/literal";
import {
  Editable,
  EditableAction,
  EditableState,
  TextEditable,
  editableReducer,
  useEditableDispatch,
} from "./editable";
import { InlineField, setInlineField } from "index/import/inline-field";

export interface TaskProps extends ListState<MarkdownTaskItem | MarkdownListItem> {
  /** task states to cycle through, if specified */
  states?: string[];
}

export interface TaskState {
  states?: string[];
  status?: string;
}

export type TaskAction = {
  type: "checked-changed";
  oldStatus: any;
  newStatus: string;
};

export function taskReducer(state: TaskState, action: TaskAction) {
  switch (action.type) {
    case "checked-changed":
      return { ...state, status: action.newStatus };
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
  const { settings } = useContext(DATACORE_CONTEXT);
  const [state, taskDispatch] = useTaskDispatch({
    status: item.$status,
    states: props.states,
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
  }, [props.states, item, item.$status, item.$completed]);

  const onChecked = useStableCallback(
    (evt: JSXInternal.TargetedMouseEvent<HTMLInputElement>) => {
      // evt.stopPropagation();
      const completed = evt.currentTarget.checked;
      const oldStatus = item.$status;

      let flatted: MarkdownTaskItem[] = [item];

      if (settings.recursiveTaskCompletion) {
        function flatter(iitem: MarkdownTaskItem | MarkdownListItem) {
          if (iitem instanceof MarkdownTaskItem) {
            flatted.push(iitem);
            iitem.$elements.forEach(flatter);
          }
        }
        item.$elements.forEach(flatter);
        flatted = flatted.flat(Infinity);
      }

      let newStatus: string;
      if (evt.shiftKey) {
        newStatus = nextState!;
      } else {
        newStatus = completed ? "x" : " ";
      }
      const parent = evt.currentTarget.parentElement;
      parent?.setAttribute("data-task", newStatus);
      async function rewr() {
        let newText = setTaskCompletion(
          item.$text,
          // TODO: replace these next three arguments with proper settings
          false,
          "completed",
          settings.defaultDateFormat,
          newStatus?.toLowerCase() === "x"
        );
        await rewriteTask(app.vault, item, newStatus, newText);
      }
      rewr().then(() => {
        taskDispatch({ type: "checked-changed", oldStatus, newStatus });
      });
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
  return (
    <li class={"datacore task-list-item" + (checked ? " is-checked" : "")} data-task={state.status}>
      <input class="datacore task-list-item-checkbox" type="checkbox" checked={checked} onClick={onChecked} />
      {/* {item.$strippedText}<hr/> */}
      {theElement}
      {item.$elements.length > 0 && <TaskList {...props} rows={item.$elements} />}
    </li>
  );
}
