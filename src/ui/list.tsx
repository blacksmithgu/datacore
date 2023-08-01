import { Literal } from "expression/literal";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import React, { useContext, isValidElement, PropsWithChildren } from "react";

export interface ListState<T> {
    /**
     * Whether the list should be ordered (ol), unordered (ul), or have no special markup (none).
     *
     * Lists with no special markup just have each element rendered directly as-is without any wrapping
     * inside of a single div.
     */
    type?: "ordered" | "unordered" | "none";

    /** The full collection of elements in the list. */
    elements?: T[];

    /**
     * Custom render function to use for rendering each element. Can produce either JSX or a plain value which will be
     * rendered as a literal.
     */
    renderer?: (element: T, index: number) => JSX.Element | Literal;
}

/** A simple and responsive list view. */
export function ListView<T>(state: ListState<T>) {
    const type = state.type ?? "unordered";
    const elements = state.elements ?? [];
    const renderer = state.renderer ?? identity;

    if (type == "none") {
        return (
            <div className="datacore-list datacore-list-none">
                {elements.map((element, index) => ensureElement(renderer(element, index)))}
            </div>
        );
    } else if (type == "ordered") {
        return (
            <ol className={"datacore-list datacore-list-ordered"}>
                {elements.map((element, index) => (
                    <li className="datacore-list-item">{ensureElement(renderer(element, index))}</li>
                ))}
            </ol>
        );
    } else {
        return (
            <ul className="datacore-list datacore-list-unordered">
                {elements.map((element, index) => (
                    <li className="datacore-list-item">{ensureElement(renderer(element, index))}</li>
                ))}
            </ul>
        );
    }
}

/** No-op element renderer. */
function identity<T>(element: T): T {
    return element;
}

export function ensureElement<T>(element: T): React.ReactNode {
    if (isValidElement(element)) {
        return element;
    } else {
        return <DefaultListElement element={element} />;
    }
}

/** Default list element which just tries to render the value as a literal. */
export function DefaultListElement<T>({ element }: PropsWithChildren<{ element: T }>) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return <Lit value={element as Literal} sourcePath={sourcePath} />;
}
