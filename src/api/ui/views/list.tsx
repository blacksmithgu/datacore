/**
 * @module views
 */
import { Literal } from "expression/literal";
import { APP_CONTEXT, CURRENT_FILE_CONTEXT, DATACORE_CONTEXT, Lit } from "ui/markdown";

import { VNode, isValidElement } from "preact";
import { useContext, useMemo } from "preact/hooks";
import { BaseFieldProps } from "ui/fields/common-props";
import { ControlledEditable, Editable, EditableElement, EditableState, TextEditable, useEditableDispatch } from "ui/fields/editable";
import { useStableCallback } from "ui/hooks";
import { MarkdownListItem, MarkdownTaskItem } from "index/types/markdown";
import { rewriteTask } from "utils/task";
import { setInlineField } from "index/import/inline-field";

/**
 * State for a {@link ListView}
 * @typeParam T - the type of the items contained in the list
 * @group States
 */
export interface ListState<T> {
    /**
     * Whether the list should be ordered (ol), unordered (ul), or have no special markup (none).
     *
     * Lists with no special markup just have each element rendered directly as-is without any wrapping
     * inside of a single div.
     *
     */
    type?: "ordered" | "unordered" | "none";

    /** The full collection of elements in the list. */
    rows?: T[];

    /** Controls whether paging is enabled for this element. If true, uses default page size. If a number, paging is enabled with the given page size. */
    paging?: boolean | number;

    /**
     * Custom render function to use for rendering each element. Can produce either JSX or a plain value which will be
     * rendered as a literal.
     */
    renderer?: (element: T, index: number) => React.ReactNode | Literal;

    /** fields to display under each item in this task list */
    displayedFields?: (BaseFieldProps<Literal> & { key: string })[];
}

/**
 *
 * A simple and responsive list view.
 * @group Components
 */
export function ListView<T>(state: ListState<T>) {
    // const settings = useContext(SETTINGS_CONTEXT);

    const type = state.type ?? "unordered";
    const elements = state.rows ?? [];
    const renderer = state.renderer ?? identity;

    if (type == "none") {
        return (
            <div className="datacore-list datacore-list-none">
                {elements.map((element, index) => (
                    <div className="datacore-unwrapped-list-item" key={index}>
                        {ensureElement(renderer(element, index))}
                    </div>
                ))}
            </div>
        );
    } else if (type == "ordered") {
        return (
            <ol className={"datacore-list datacore-list-ordered"}>
                {elements.map((element, index) => (
                    <li key={index} className="datacore-list-item">
                        {ensureElement(renderer(element, index))}
                    </li>
                ))}
            </ol>
        );
    } else {
        return (
            <ul className="datacore-list datacore-list-unordered">
                {elements.map((element, index) => (
                    <li key={index} className="datacore-list-item">
                        {ensureElement(renderer(element, index))}
                    </li>
                ))}
            </ul>
        );
    }
}

/** No-op element renderer.
 * @hidden
 */
function identity<T>(element: T): T {
    return element;
}

/**
 * @hidden
 *  Ensures the given element is a renderable react node. */
export function ensureElement<T>(element: T): VNode {
    if (isValidElement(element)) {
        return element;
    } else {
        return <DefaultListElement element={element} />;
    }
}

/**
 * @hidden
 *  Default list element which just tries to render the value as a literal. */
export function DefaultListElement<T>({ element }: { element: T }) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return <Lit inline={true} value={element as Literal} sourcePath={sourcePath} />;
}

export function EditableListElement<T>({
    element: item,
    editor,
    onUpdate,
		file,
		editorProps
}: {
    editor: (value: T) =>EditableElement<T>; 
    element: T;
		file: string;
    onUpdate: (value: T) => unknown;
		editorProps: unknown;
}) { 
    return (
			<ControlledEditable<T> props={editorProps} sourcePath={file} content={item} editor={editor(item)} onUpdate={onUpdate} defaultRender={<DefaultListElement element={item}/>} />
    );
}
