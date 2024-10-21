import { Field } from "expression/field";
import { Literal } from "expression/literal";
import { Dispatch, useCallback, useContext } from "preact/hooks";
import { APP_CONTEXT } from "ui/markdown";
import { EditableAction } from "ui/fields/editable";
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
