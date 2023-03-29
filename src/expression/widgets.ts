import { Literal, Literals, Widget } from "./literal";

/** A trivial widget which renders a (key, value) pair, and allows accessing the key and value. */
export class ListPairWidget extends Widget {
    public constructor(public key: Literal, public value: Literal) {
        super("datacore:list-pair");
    }

    public override markdown(): string {
        return `${Literals.toString(this.key)}: ${Literals.toString(this.value)}`;
    }
}

/** A simple widget which renders an external link. */
export class ExternalLinkWidget extends Widget {
    public constructor(public url: string, public display?: string) {
        super("datacore:external-link");
    }

    public override markdown(): string {
        return `[${this.display ?? this.url}](${this.url})`;
    }
}

export namespace Widgets {
    /** Create a list pair widget matching the given key and value. */
    export function listPair(key: Literal, value: Literal): ListPairWidget {
        return new ListPairWidget(key, value);
    }

    /** Create an external link widget which renders an external Obsidian link. */
    export function externalLink(url: string, display?: string): ExternalLinkWidget {
        return new ExternalLinkWidget(url, display);
    }

    /** Checks if the given widget is a list pair widget. */
    export function isListPair(widget: Widget): widget is ListPairWidget {
        return widget.$widget === "datacore:list-pair";
    }

    export function isExternalLink(widget: Widget): widget is ExternalLinkWidget {
        return widget.$widget === "datacore:external-link";
    }

    /** Determines if the given widget is any kind of built-in widget with special rendering handling. */
    export function isBuiltin(widget: Widget): boolean {
        return isListPair(widget) || isExternalLink(widget);
    }
}
