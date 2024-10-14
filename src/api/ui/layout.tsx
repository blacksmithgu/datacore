/**
 * Collection of direct API-facing elements. This essentially serves as a layer of indirection to internal types, so that the internal types can be
 * changed without breaking the API.
 * 
 * @module ui
 */

import { HTMLAttributes, useMemo } from "preact/compat";

import "api/ui/layout.css";

/** Creates a vertical flexbox "stack" of elements.
 * 
 * @group Components
 */
export function Stack(
    props: HTMLAttributes<HTMLDivElement> & {
        className?: string;
        justify?: string;
        align?: string;
        style?: string;
    }
) {
    const { className, justify, align, style, children, ...rest } = props;
    const extraStyle = useMemo(() => {
        let style = "";
        if (justify) style += `justify-content: ${justify};`;
        if (align) style += `align-items: ${align};`;

        return style.length == 0 ? undefined : style;
    }, [justify, align]);

    return (
        <div
            className={className ? className + " dc-stack" : "dc-stack"}
            style={style ? extraStyle + style : extraStyle}
            {...rest}
        >
            {children}
        </div>
    );
}

/** Creates a horizontal flexbox "grouping" of elements. 
 * 
 * @group Components
*/
export function Group(
    props: HTMLAttributes<HTMLDivElement> & {
        className?: string;
        justify?: string;
        align?: string;
        style?: string;
    }
) {
    const { className, justify, align, style, children, ...rest } = props;
    const extraStyle = useMemo(() => {
        let style = "";
        if (justify) style += `justify-content: ${justify};`;
        if (align) style += `align-items: ${align};`;

        return style.length == 0 ? undefined : style;
    }, [justify, align]);

    return (
        <div
            className={className ? className + " dc-group" : "dc-group"}
            style={style ? extraStyle + style : extraStyle}
            {...rest}
        >
            {children}
        </div>
    );
}
