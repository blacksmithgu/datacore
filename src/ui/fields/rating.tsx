/**
 * @module ui
 */
import { useMemo } from "preact/hooks";
import { useStableCallback } from "ui/hooks";
import { FieldControlProps } from "./common-props";
import { useEditableDispatch } from "ui/fields/editable";

import "./fields.css";

/** Editable field for a star-based rating field.
 * @group Editable Components
 */
export function RatingEditable({ value, updater, config: config, defaultValue }: FieldControlProps<number | string>) {
    const [state, dispatch] = useEditableDispatch<number | string>({
        content: value ?? defaultValue,
        updater: updater!,
    });

    const parsedValue = useMemo(() => {
        if (typeof state.content == "string") {
            if (state.content.contains("/")) {
                let split = state.content.split("/");
                return parseInt(split[0]) / parseInt(split[1]);
            }
        } else if (typeof state.content == "number") {
            return Math.min(state.content, 5);
        }
        return 0;
    }, [state.content]);

    const stars = useMemo(() => {
        let r: React.ReactNode[] = [];
        for (let i = 0; i < (config?.max ?? 5); i++) {
            let clickCb = useStableCallback(() => {
                let newValue: number | string | null = null;
                if (typeof state.content == "string") {
                    if (state.content.contains("/")) {
                        newValue = `${i + 1}/5`;
                    }
                } else if (typeof state.content == "number") {
                    newValue = Math.min(i + 1, config?.max ?? 5);
                }

                dispatch({ type: "content-changed", newValue: newValue || i + 1 });
                dispatch({ type: "commit", newValue: newValue || i + 1 });
            }, [state, parsedValue, i]);
            let classes = ["datacore-rating-star"];
            classes.push(i < parsedValue ? "filled" : "empty");
            r.push(
                <span onClick={clickCb} className={classes.join(" ")}>
                    &#9733;
                </span>
            );
        }
        return r;
    }, [parsedValue, state]);

    return <span className="datacore-rating">{stars}</span>;
}
