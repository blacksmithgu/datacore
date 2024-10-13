/**
 * @module views
*/

import { Literal } from "expression/literal";
import { VNode } from "preact";
import { useMemo } from "preact/hooks";

import "./cards.css";
/**
 * Props for the card component
 * 
 * @group Props
 */
export interface CardProps<T> {
    /** the actual value held in this card. */
    value: T;

    /** The title of the card. */
    title: Literal | ((val: T) => Literal | VNode);

    /** The raw content of the card. */
    content: Literal | ((val: T) => Literal | VNode);

    /** optional footer (because why not?) */
    footer?: Literal | ((val: T) => Literal | VNode);

    /** If true, the title will be rendered centered. */
    centerTitle?: boolean;
}
/**
 * A card with a title and content
 * 
 * @group Components 
 */
export function Card<T>(props: CardProps<T>) {
    const cardTitle = useMemo(() => {
        if (typeof props.title === "function") {
            return props.title(props.value);
        } else {
            return props.title;
        }
    }, [props.value, props.title]);

    const innerContent = useMemo(() => {
        if (typeof props.content === "function") return props.content(props.value);
        else return props.content;
    }, [props.value, props.content]);

    const footerContent = useMemo(() => {
        if (props.footer !== undefined) {
            if (typeof props.footer === "function") {
                return props.footer(props.value);
            } else {
                return props.footer;
            }
        }
        return null;
    }, [props.footer, props.value]);

    const titleClasses = useMemo(() => {
        let base = ["datacore-card-title"];
        if (props.centerTitle) base = base.concat("centered");
        return base;
    }, [props.centerTitle, props.title, props.content, props.value]);

    return (
        <div className="datacore-card">
            <div className={titleClasses.join(" ")}>{cardTitle}</div>
            <div className="datacore-card-inner">
                <div className="datacore-card-content">{innerContent}</div>
                <div className="datacore-card-footer">{footerContent}</div>
            </div>
        </div>
    );
}
