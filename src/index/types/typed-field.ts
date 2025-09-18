import { Field } from "expression/field";
import { Literal } from "expression/literal";

interface TypedField<
    Fields extends { [key in string]?: Literal } = { [key in string]?: Literal },
    T extends keyof Fields & string = keyof Fields & string
> extends Field {
    /** The value of the field. */
    value: Exclude<Fields[T], undefined>;
}

type KeyedField<
    Fields extends { [key in string]?: Literal },
    Key extends keyof Fields & string
> = undefined extends Fields[Key] ? TypedField<Fields, Key> | undefined : TypedField<Fields, Key>;

export interface TypedValuebearing<Fields extends { [key in string]?: Literal }> extends TypedFieldbearing<Fields> {
    /** Get the value for the given field. */
    value<Key extends keyof Fields & string>(key: Key): Fields[Key];
}

export interface TypedFieldbearing<Fields extends { [key in string]?: Literal }> {
    /** Return a list of all fields. This may be computed eagerly, so cache this value for repeated operations. */
    fields: TypedField<Fields>[];

    /** Fetch a field with the given name if it is present on this object. */
    field<Key extends keyof Fields & string>(key: Key): KeyedField<Fields, Key>;
}
