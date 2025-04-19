import { Field } from "expression/field";
import { Literal } from "expression/literal";
import { setInlineField } from "index/import/inline-field";
import { MarkdownTaskItem } from "index/types/markdown";
import { App } from "obsidian";
import { Dispatch, useCallback, useContext } from "preact/hooks";
import { APP_CONTEXT } from "ui/markdown";
import { rewriteTask } from "./task";
import { EditableAction } from "ui/fields/editable";
import { Datacore } from "index/datacore";
import { editProvenance } from "index/edit/field";

export function useSetField<T extends Literal>(field: Field, onChange?: (newValue: T) => void) {
    const app = useContext(APP_CONTEXT);
    return useCallback(
        (newValue: T) => {
            editProvenance(app, field.provenance!, newValue).then(() => {
                if (onChange) onChange(newValue);
            });
        },
        [field, onChange]
    );
}
export async function setTaskText(app: App, core: Datacore, text: string, item: MarkdownTaskItem) {
    let withFields = `${text}${Object.keys(item.$infields).length ? " " : ""}`;
    for (let field in item.$infields) {
        withFields = setInlineField(withFields, field, item.$infields[field].raw);
    }
    await rewriteTask(app.vault, core, item, item.$status, withFields);
}
export function useFinalizer<T>(newValue: T, dispatch: Dispatch<EditableAction<T>>) {
    return async function () {
        dispatch({
            type: "content-changed",
            newValue: newValue,
        });
        dispatch({
            type: "editing-toggled",
            newValue: false,
        });
    };
}
