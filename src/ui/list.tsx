import { Literal } from "expression/literal";
import { JSX, RenderableProps, isValidElement } from "preact";
import { CURRENT_FILE_CONTEXT, Lit } from "ui/markdown";
import { h } from "preact";
import { useContext } from "preact/hooks";

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
    const renderer = state.renderer ?? defaultElementRenderer;

    if (type == "none") {
        return (
            <div class="datacore-list datacore-list-none">
                {elements.map((element, index) => renderer(element, index))}
            </div>
        );
    } else if (type == "ordered") {
        return (
            <ol class={"datacore-list datacore-list-ordered"}>
                {elements.map((element, index) => (
                    <li class="datacore-list-item">{renderer(element, index)}</li>
                ))}
            </ol>
        );
    } else {
        return (
            <ul class="datacore-list datacore-list-unordered">
                {elements.map((element, index) => (
                    <li class="datacore-list-item">{renderer(element, index)}</li>
                ))}
            </ul>
        );
    }
}

export function defaultElementRenderer<T>(element: T): JSX.Element {
    if (isValidElement(element)) {
        return element;
    } else {
        return <DefaultListElement element={element} />;
    }
}

/** Default list element which just tries to render the value as a literal. */
export function DefaultListElement<T>({ element }: RenderableProps<{ element: T }>) {
    const sourcePath = useContext(CURRENT_FILE_CONTEXT);

    return <Lit value={element as Literal} sourcePath={sourcePath} />;
}
