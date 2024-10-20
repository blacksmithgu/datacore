/**
 * @module views
 */

import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown";
import { EditableListElement, ListState } from "api/ui/views/list";
import { useStableCallback } from "ui/hooks";
import { Fragment } from "preact";
import { APP_CONTEXT, DATACORE_CONTEXT } from "ui/markdown";
import { JSXInternal } from "preact/src/jsx";
import { Dispatch, useContext, useMemo, useRef, useState } from "preact/hooks";
import { completeTask, rewriteTask } from "utils/task";
import { Literal, Literals } from "expression/literal";
import {
    EditableAction,
    EditableListField,
    EditableState,
    TextEditable,
    useEditableDispatch,
} from "ui/fields/editable";
import { setInlineField } from "index/import/inline-field";
import { Field } from "expression/field";
import { DateTime } from "luxon";
import "styles/lists.css";
import { ControlledEditableTextField } from "ui/fields/editable-fields";

/**
 * Props passed to the task list component.
 * @group Props
 */
export interface TaskProps extends ListState<MarkdownTaskItem | MarkdownListItem> {
    /** task states to cycle through, if specified */
    additionalStates?: string[];
}

/**
 * Represents a list of tasks.
 * @param props
 * @group Components
 */
export function TaskList({
    rows: items,
    additionalStates: states,
    renderer: listRenderer = (item, index) => (
        <EditableListElement<string>
            onUpdate={useListItemEditing(item)}
            element={item.$cleantext!}
            file={item.$file}
            editorProps={{ markdown: true, sourcePath: item.$file }}
            editor={(it) => TextEditable}
        />
    ),
    ...rest
}: TaskProps) {
    const content = useMemo(() => {
        return (
            <ul className="datacore contains-task-list">
                {items?.map((item, ind) =>
                    item instanceof MarkdownTaskItem ? (
                        <Task state={{ ...rest, additionalStates: states }} item={item} />
                    ) : (
                        <li>
                            {listRenderer(item, ind)}
                            <div className="datacore-list-item-fields">
                                <ListItemFields displayedFields={rest.displayedFields} item={item} />
                            </div>
                        </li>
                    )
                )}
            </ul>
        );
    }, [items, states]);
    return <Fragment>{!!items && content}</Fragment>;
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

    const checked = useMemo(() => item.$status !== " ", [item.$status]);
    const eState: EditableState<string> = useMemo(() => {
        return {
            updater: useListItemEditing(item),
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
    const hasChildren = item.$elements.length > 0;

    return (
        <li className={"datacore task-list-item" + (checked ? " is-checked" : "")} data-task={status}>
            <CollapseIndicator
                onClick={() => setCollapsed(!collapsed)}
                collapsed={collapsed}
                hasChildren={hasChildren}
            />
            <input className="datacore task-list-item-checkbox" type="checkbox" checked={checked} onClick={onChecked} />
            <div>
                <div className="datacore-list-item-content">
                    {theElement}
                    <div className="datacore-list-item-fields">
                        <ListItemFields displayedFields={props.displayedFields} item={item} />
                    </div>
                </div>
            </div>
            {hasChildren && !collapsed && <TaskList {...props} rows={item.$elements} />}
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
    displayedFields: displayedFieldsProp = [],
    item,
}: {
    displayedFields?: TaskProps["displayedFields"];
    item: MarkdownTaskItem | MarkdownListItem;
}) {
    const app = useContext(APP_CONTEXT);
    const core = useContext(DATACORE_CONTEXT);
    const { settings } = core;
    const displayedFields = useMemo(() => {
        if (displayedFieldsProp.length) return displayedFieldsProp;
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
                const [fieldValue] = useState<Literal>(item.$infields[ifield?.key]?.value || defField.value!);
                const [state2, dispatch] = useEditableDispatch<Literal>({
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
                });
                if (ifield.key == settings.taskCompletionText) {
                    //@ts-ignore huh?
                    completedRef.current = dispatch;
                }
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

function useListItemEditing(item: MarkdownTaskItem | MarkdownListItem) {
    const app = useContext(APP_CONTEXT);
    const core = useContext(DATACORE_CONTEXT);
    const status = useMemo(() => (item instanceof MarkdownTaskItem ? item.$status : " "), [item]);
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
