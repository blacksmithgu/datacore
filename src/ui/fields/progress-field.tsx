/**
 * @module ui
 */
import { ChangeEvent } from "preact/compat";
import { Dispatch, useEffect, useRef } from "preact/hooks";
import { Editable, EditableAction, EditableState } from "ui/fields/editable";
import { useStableCallback } from "ui/hooks";

import "./fields.css";

/** Editable field for multi-step progress.
 * @group Editable Components
 */
export function ProgressEditable(
    props: EditableState<number> & {
        sourcePath: string;
        min: number;
        max: number;
        step: number;
        dispatch: Dispatch<EditableAction<number>>;
    }
) {
    const val = useRef(props.content);
    useEffect(() => {
        props.dispatch({ type: "content-changed", newValue: val.current });
    }, [val.current]);
    const finalize = async () => {
        props.dispatch({
            type: "commit",
            newValue: val.current,
        });
    };
    const changeCB = useStableCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            finalize();
            val.current = parseFloat(e.currentTarget.value);
        },
        [val.current, props.sourcePath]
    );
    const readOnly = <progress value={val.current} max={props.max} />;

    const editor = (
        <input
            type="range"
            className="datacore-progress-editable"
            min={props.min}
            value={val.current}
            onChange={changeCB}
            step={props.step}
        />
    );

    return (
        <span className="has-texteditable">
            <Editable<number>
                dispatch={props.dispatch}
                editor={editor}
                state={{ ...props, content: val.current, isEditing: props.isEditing }}
                defaultRender={readOnly}
            />
        </span>
    );
}
