/**
 * @module views
 */

import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown";
import { EditableListElement, ListViewProps } from "api/ui/views/list";
import { useStableCallback } from "ui/hooks";
import { Fragment } from "preact";
import { APP_CONTEXT, DATACORE_CONTEXT } from "ui/markdown";
import { JSXInternal } from "preact/src/jsx";
import { Dispatch, useContext, useMemo, useRef, useState } from "preact/hooks";
import { completeTask, insertListOrTaskItemAt, rewriteTask } from "utils/task";
import { Literal, Literals } from "expression/literal";
import {
    EditableAction,
    EditableListField,
    editableReducer,
    EditableState,
    TextEditable,
    useEditableDispatch,
} from "ui/fields/editable";
import { setInlineField } from "index/import/inline-field";
import { Field } from "expression/field";
import { DateTime } from "luxon";
import "./lists.css";
import "./misc.css";

/**
 * Props passed to the task list component.
 * @group Props
 */
export interface TaskProps extends ListViewProps<MarkdownTaskItem | MarkdownListItem> {
    /** task states to cycle through, if specified */
    additionalStates?: string[];
}

/**
 * Represents a list of tasks.
 * @param props
 * @group Components
 */
export function TaskList(props: TaskProps) {
    return <InnerTaskList parent={null} {...props} />;
}
/**
 * @hidden 
 * @group Components
 */
function InnerTaskList({
    rows: items,
    additionalStates: states,
    renderer: listRenderer = (item) => (
        <EditableListElement<string>
            onUpdate={useListItemEditing(item, "")}
            element={item.$cleantext!}
            file={item.$file}
            editorProps={{ markdown: true, sourcePath: item.$file }}
            editor={(it) => TextEditable}
        />
    ),
    parent,
    ...rest
}: TaskProps & { parent: MarkdownTaskItem | MarkdownListItem | null }) {
    const app = useContext(APP_CONTEXT);
    const create = useStableCallback(async () => {
        const parentOrRootSibling = parent ? parent : items![items!.length - 1];
        const nfields = Object.fromEntries(
            rest.displayedFields?.map((a) => [a.key, a.defaultValue ?? Literals.defaultValue(a.type)]) ?? []
        );
				const at = parent ? parent : parentOrRootSibling.$line + parentOrRootSibling.$lineCount + 1
        await insertListOrTaskItemAt(app, at, true, " ", rest.defaultText ?? "...", parentOrRootSibling.$file, nfields);
    }, [parent, rest.displayedFields, items, app]);
    const content = useMemo(() => {
        return (
            <ul className="datacore contains-task-list">
                {items?.map((item) =>
                    item instanceof MarkdownTaskItem ? (
                        <Task key={item.$id} state={{ ...rest, additionalStates: states, rows: item.$elements }} item={item} />
                    ) : (
                        <li>
                            {listRenderer(item as MarkdownListItem | MarkdownTaskItem)}
                            <div className="datacore-list-item-fields">
                                <ListItemFields displayedFields={rest.displayedFields} item={item as MarkdownListItem | MarkdownTaskItem} />
                            </div>
                        </li>
                    )
                )}
            </ul>
        );
    }, [items, states]);
    return (
        <Fragment>
            {!!items && content}
						{parent == null && (<button className="dashed-default" style="width: 100%" onClick={create}>
                Add item
            </button>)
						}
        </Fragment>
    );
}
/**
 * Represents a single item in a task listing.
 * @param props - the component's props
 * @param props.item - the current task being rendered
 * @param props.state - the {@link TaskProps} of the {@link TaskList} in which this Task appears
 * @group Components
 */
export function Task({ item, state: props }: { item: MarkdownTaskItem; state: TaskProps }) {
    const app = useContext(APP_CONTEXT);
    const core = useContext(DATACORE_CONTEXT);
    const { settings } = core;
    const states = [" ", ...(props.additionalStates || []), "x"];
    const nextState = () => {
        if (props.additionalStates && props.additionalStates?.length > 0) {
            let curIndex = states.findIndex((a) => a === item.$status);
            curIndex++;
            if (curIndex >= states.length) {
                curIndex = 0;
            }
            return states[curIndex];
        } else {
            return item.$completed ? " " : "x";
        }
    };
    const [status, setStatus] = useState<string>(item.$status);
    const completedRef = useRef<Dispatch<EditableAction<Literal>>>(null);
    const onChecked = useStableCallback(async (evt: JSXInternal.TargetedMouseEvent<HTMLInputElement>) => {
        const completed = evt.currentTarget.checked;
        let newStatus: string;
        if (evt.shiftKey) {
            newStatus = nextState();
        } else {
            newStatus = completed ? "x" : " ";
        }
        setStatus(newStatus);
        await completeTask(completed, item, app.vault, core);
        const nv = completed ? DateTime.now().toFormat(settings.defaultDateFormat) : null;
        completedRef.current && completedRef.current({ type: "commit", newValue: nv });
    }, []);

    const checked = useMemo(() => status !== " ", [item.$status, item, status]);
    const eState: EditableState<string> = useMemo(() => {
        return {
            updater: useListItemEditing(item, status),
            content: item.$cleantext,
            inline: false,
            isEditing: false,
        } as EditableState<string>;
    }, [item.$cleantext, item.$text]);
    const theElement = useMemo(
        () => <TextEditable sourcePath={item.$file} {...eState} />,
        [eState.content, item, props.rows]
    );

    const [collapsed, setCollapsed] = useState<boolean>(true);
    const hasChildren = useMemo(() => item.$elements.length > 0, [item, item.$elements, item.$elements.length]);

    return (
        <li
            key={item.$id}
            data-testid="datacore-task-item"
            className={"datacore task-list-item" + (checked ? " is-checked" : "")}
            data-task={status}
        >
            <CollapseIndicator
                onClick={() => setCollapsed((c) => !c)}
                collapsed={collapsed}
                hasChildren={hasChildren}
            />
            <input
                className="datacore task-list-item-checkbox"
                type="checkbox"
                checked={checked}
                onClick={onChecked}
                onChange={(e) => console.log(e.currentTarget.value)}
            />
            <div>
                <div className="datacore-list-item-content">
                    {theElement}
                    <div className="datacore-list-item-fields">
                        <ListItemFields displayedFields={props.displayedFields} item={item} />
                    </div>
                </div>
            </div>
            {hasChildren && !collapsed && <InnerTaskList {...props} rows={item.$elements} parent={item}/>}
        </li>
    );
}

function CollapseIndicator({
    collapsed,
    onClick,
    hasChildren,
}: {
    collapsed: boolean;
    onClick: () => void;
    hasChildren: boolean;
}) {
    const toggleCnames = ["datacore-collapser"];
    if (collapsed) toggleCnames.push("is-collapsed");
    if (!hasChildren) toggleCnames.push("no-children");
    return (
        <div onClick={onClick} className={toggleCnames.join(" ")} dir="auto">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="svg-icon right-triangle"
            >
                <path d="M3 8L12 17L21 8"></path>
            </svg>
        </div>
    );
}

/**
 * Displays an editable set of fields below a task or list item.
 * @hidden
 * @group Components
 */
export function ListItemFields({
    displayedFields: displayedFieldsProp,
    item,
}: {
    displayedFields?: TaskProps["displayedFields"];
    item: MarkdownTaskItem | MarkdownListItem;
}) {
    const app = useContext(APP_CONTEXT);
    const core = useContext(DATACORE_CONTEXT);
    const { settings } = core;
    const displayedFields = useMemo(() => {
        if (displayedFieldsProp != undefined) return displayedFieldsProp;
        else {
            return Object.values(item.$infields).map((f) => {
                return {
                    key: f.key,
                    type: Literals.typeOf(f.value),
                    config: {},
                    editable: true,
                    renderAs: "raw",
                } as NonNullable<TaskProps["displayedFields"]>[0];
            });
        }
    }, [displayedFieldsProp, item.$infields, item]);
    return (
        <>
            {displayedFields.map((ifield) => {
                ifield.key = ifield.key.toLocaleLowerCase();
                let defVal = typeof ifield.defaultValue == "function" ? ifield.defaultValue() : ifield.defaultValue;
                let defField: Field = {
                    key: ifield.key,
                    value: defVal,
                    raw: Literals.toString(defVal),
                };
                const fieldValue = item.$infields[ifield?.key]?.value || defField.value!;
                let [state2, dispatch] = useEditableDispatch<Literal>(() => ({
                    content: fieldValue,
                    isEditing: false,
                    updater: useStableCallback(
                        (val: Literal) => {
                            const dateString = (v: Literal) =>
                                v instanceof DateTime
                                    ? v.toFormat(settings.defaultDateFormat)
                                    : v != null
                                    ? Literals.toString(v)
                                    : undefined;

                            let withFields = item.$text;
                            if (withFields && item.$text) {
                                if (item.$infields[ifield.key]) item.$infields[ifield.key].value = dateString(val)!;
                                for (let field in item.$infields) {
                                    withFields = setInlineField(
                                        withFields,
                                        field,
                                        dateString(item.$infields[field]?.value)
                                    );
                                }
                                withFields = setInlineField(item.$text, ifield.key, dateString(val));
                                rewriteTask(
                                    app.vault,
                                    core,
                                    item,
                                    item instanceof MarkdownTaskItem ? item.$status : " ",
                                    withFields
                                );
                            }
                        },
                        [item.$infields]
                    ),
                }));
                if (ifield.key == settings.taskCompletionText) {
                    //@ts-ignore huh?
                    completedRef.current = dispatch;
                }
                state2 = editableReducer<Literal>(state2, { type: "content-changed", newValue: fieldValue });
                return (
                    <EditableListField
                        props={state2}
                        dispatch={dispatch}
                        type={ifield.type || Literals.wrapValue(fieldValue)!.type}
                        file={item.$file}
                        field={item.$infields[ifield.key] || defField}
                        config={ifield.config}
                        parent={item}
                        updater={state2.updater}
                        value={fieldValue}
                        renderAs={ifield.renderAs}
                    />
                );
            })}
        </>
    );
}

function useListItemEditing(item: MarkdownTaskItem | MarkdownListItem, status: string) {
    const app = useContext(APP_CONTEXT);
    const core = useContext(DATACORE_CONTEXT);
    return useStableCallback(
        async (val: Literal) => {
            if (typeof val === "string") {
                let withFields = `${val}${Object.keys(item.$infields).length ? " " : ""}`;
                for (let field in item.$infields) {
                    withFields = setInlineField(withFields, field, item.$infields[field].raw);
                }
                await rewriteTask(app.vault, core, item, status, withFields);
            }
        },
        [status, item]
    );
}
