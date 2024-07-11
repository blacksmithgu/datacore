import { Checkbox } from "api/ui/basics";
import { Field } from "expression/field";
import { Dispatch, useState } from "preact/hooks";
import { useFinalizer, useSetField } from "utils/fields";
import { EditableAction, TextEditable, UncontrolledTextEditable, useEditableDispatch } from "./editable";
import { useStableCallback } from "ui/hooks";
import { HTMLProps } from "preact/compat";

export function EditableFieldCheckbox(
    props: { className?: string; field: Field; defaultChecked?: boolean } & React.HTMLProps<HTMLInputElement>
) {
    const { field, defaultChecked, ...rest } = props;
    const [checked, setChecked] = useState(field.value as boolean);
    return (
        <Checkbox
            {...rest}
            disabled={undefined}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckChange={useSetField(field, setChecked)}
        />
    );
}

export function EditableTextField(props: {
    field: Field;
    inline: boolean;
    dispatch: Dispatch<EditableAction<string>>;
}) {
    const { field, inline, dispatch } = props;

    return <ControlledEditableTextField text={field.value as string} inline={inline} dispatch={dispatch} />;
}

export function ControlledEditableTextField(props: {
    text: string;
    inline: boolean;
    dispatch: Dispatch<EditableAction<string>>;
}) {
    const { text, inline, dispatch } = props;
		const [textState, setText] = useState(text)
    const onInput = async (e: KeyboardEvent) => {
				setText((e.currentTarget as HTMLInputElement).value)
        
        if (props.inline) {
            if (e.key === "Enter") {
                e.preventDefault();
                await useFinalizer(textState, dispatch)();
            } 
        } else {
            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                await useFinalizer(textState, dispatch)();
            }
        }
    };
    return <UncontrolledTextEditable text={text} inline={inline} dispatch={dispatch} onInput={onInput} />;
}
export function ControlledEditableCheckbox(props: {
	onUpdate: (val: boolean) => void;
	initial: boolean;
	className: string;
} & HTMLProps<HTMLInputElement>) {
	const {onUpdate, initial, className, ...rest} = props;
	return <Checkbox {...rest} className={className} checked={initial} onCheckChange={onUpdate} disabled={false} defaultChecked={initial}/>
}