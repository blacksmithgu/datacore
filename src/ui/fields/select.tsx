import { useCallback, useState } from "preact/hooks";
import Select from "react-select";

/** @internal Editable component which updates an editable. */
export function RawSelectEditable({
    options,
    initialValue,
    onUpdate
}: {
    /** The options you can select from. */
    options: (string | number)[];
    initialValue: string | string[];
    onUpdate: (string | string[]) => void;
}) {
    const [value, setValue] = useState(initialValue);

    return <Select
        classNamePrefix="datacore-selectable"
        onChange={onChange}
        unstyled
        isMulti={config?.multi ?? false}
        options={config?.options ?? []}
        menuPortalTarget={document.body}
                classNames={{


                    input: (props: any) => "prompt-input",


                    valueContainer: (props: any) => "suggestion-item value-container",


                    container: (props: any) => "suggestion-container",


                    menu: (props: any) => "suggestion-content suggestion-container",


                    option: (props: any) => `suggestion-item${props.isSelected ? " is-selected" : ""}`,


                }}


            />
}