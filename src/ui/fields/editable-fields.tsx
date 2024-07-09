import { Checkbox } from "api/ui/basics";
import { Field } from "expression/field";
import { useState } from "preact/hooks";
import { useSetField } from "utils/fields";
import { TextEditable, UncontrolledTextEditable, useEditableDispatch } from "./editable";
import { useStableCallback } from "ui/hooks";

export function EditableFieldCheckbox(props: {className?: string; field: Field; defaultChecked?: boolean;} & React.HTMLProps<HTMLInputElement>) {
	const {field, defaultChecked, ...rest} = props;
	const [checked, setChecked] = useState(field.value as boolean);
	return <Checkbox {...rest} disabled={undefined} checked={checked} defaultChecked={defaultChecked} onCheckChange={useSetField(field, setChecked)}/>
}

export function EditableTextField(props: {field: Field, inline: boolean}) {
	const {field, inline} = props;
	
	return <UncontrolledTextEditable text={field.value as string} inline={inline} />
}
