
declare module "react-select" {
		import { RefAttributes, ReactElement, JSX } from "preact/compat";
		import { StateManagerAdditionalProps } from "react-select/dist/declarations/src/useStateManager";
		import { Props } from "react-select/dist/declarations/src/Select";
		import Select from "react-select/dist/declarations/src/Select";
		declare type StateManagedPropKeys = 'inputValue' | 'menuIsOpen' | 'onChange' | 'onInputChange' | 'onMenuClose' | 'onMenuOpen' | 'value';
		declare type PublicBaseSelectProps<Option, IsMulti extends boolean, Group extends GroupBase<Option>> = JSX.LibraryManagedAttributes<typeof Select, Props<Option, IsMulti, Group>>;
		declare type SelectPropsWithOptionalStateManagedProps<Option, IsMulti extends boolean, Group extends GroupBase<Option>> = Omit<PublicBaseSelectProps<Option, IsMulti, Group>, StateManagedPropKeys> & Partial<PublicBaseSelectProps<Option, IsMulti, Group>>;
		export declare type StateManagerProps<Option = unknown, IsMulti extends boolean = boolean, Group extends GroupBase<Option> = GroupBase<Option>> = SelectPropsWithOptionalStateManagedProps<Option, IsMulti, Group> & StateManagerAdditionalProps<Option>;
    declare const StateManagedSelect: <
        Option = unknown,
        IsMulti extends boolean = false,
        Group extends GroupBase<Option> = GroupBase<Option>
    >(
        props: StateManagerProps<Option, IsMulti, Group>
    ) =>  ReactElement;
    export default StateManagedSelect;
}
