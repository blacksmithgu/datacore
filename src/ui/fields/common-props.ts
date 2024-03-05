import { LiteralType } from "expression/literal";
import { InlineField } from "index/import/inline-field";

export interface FieldControlProps<T> extends BaseFieldProps<T> {
	field: InlineField;
	value: T;
	file: string;
	updater?: (val: T) => unknown
}
export interface BaseFieldProps<T> {
	/** only read if the field is rendered as a dropdown */
	enumValues?: {
		label: string;
		value: T
	}[]
	type: LiteralType;
	defaultValue?: T;
}