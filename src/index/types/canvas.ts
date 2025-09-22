/**
 * @module indexables
 */
import { Extractors, Field, Fieldbearing, FIELDBEARING_TYPE, FieldExtractor } from "expression/field";
import { FILE_TYPE, Indexable, Linkable, LINKABLE_TYPE, Linkbearing, Taggable, TAGGABLE_TYPE } from "./indexable";
import {
    CardDimensions,
    CardPos,
    JsonBaseCanvasCard,
    JsonCanvas,
    JsonCanvasCard,
    JsonCanvasFileCard,
    JsonCanvasTextCard,
    JsonCanvasWebCard,
} from "./json/canvas";
import { DateTime } from "luxon";
import { Link } from "expression/link";
import {
    FrontmatterEntry,
    LinkNormalizer,
    MarkdownSection,
    NOOP_NORMALIZER,
    normalizeLinks,
    valueFrontmatterEntry,
} from "./markdown";
import { InlineField, jsonInlineField, valueInlineField } from "index/import/inline-field";
import { File } from "index/types/indexable";
import { mapObjectValues } from "utils/data";
import { Literal } from "expression/literal";
import { TypedFieldbearing } from "./typed-field";

/** A canvas file, consisting of a set of canvas cards. */
export class Canvas implements Linkable, File, Linkbearing, Taggable, Indexable, Fieldbearing {
    static TYPES = [FILE_TYPE, "canvas", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];

    $types: string[] = Canvas.TYPES;
    $typename: string = "Canvas";

    /** Time that the file was created on the file system. */
    $ctime: DateTime;
    /** The that the file was last modified on the file system. */
    $mtime: DateTime;

    /** File extension - for canvas files, generally always 'canvas'. */
    $extension: string = "canvas";

    /** The full path of the canvas file. */
    get $file() {
        return this.$path;
    }

    get $id() {
        return this.$path;
    }

    /** A link object pointing to the canvas file. */
    get $link() {
        return Link.file(this.$path);
    }

    $path: string;
    $cards: BaseCanvasCard[] = [];
    $size: number = 0;
    $tags: string[];
    $links: Link[];
    $infields: Record<string, InlineField>;

    private constructor(init: Partial<Canvas>) {
        Object.assign(this, init);
    }

    get fields(): Field[] {
        return Canvas.FIELD_DEF(this);
    }

    public field(key: string): Field | undefined {
        return Canvas.FIELD_DEF(this, key)?.[0];
    }

    public json(): JsonCanvas {
        return {
            $cards: this.$cards.map((x) => x.json()) as JsonCanvasCard[],
            $ctime: this.$ctime.toMillis(),
            $mtime: this.$mtime.toMillis(),
            $size: this.$size,
            $links: this.$links,
            $path: this.$path,
            $infields: mapObjectValues(this.$infields, jsonInlineField),
            $tags: this.$tags,
        };
    }

    static from(raw: JsonCanvas, normalizer: LinkNormalizer = NOOP_NORMALIZER): Canvas {
        const cards = raw.$cards
            .map((s) => {
                switch (s.$type) {
                    case "text-card":
                        return CanvasTextCard.from(s, raw.$path, normalizer);
                    case "file-card":
                        return CanvasFileCard.from(s);
                    case "web-card":
                        return CanvasWebCard.from(s, raw.$path);
                }
                return null;
            })
            .filter((x): x is CanvasTextCard => !!x);

        return new Canvas({
            $cards: cards,
            $ctime: DateTime.fromMillis(raw.$ctime),
            $mtime: DateTime.fromMillis(raw.$mtime),
            $size: raw.$size,
            $extension: "canvas",
            $path: raw.$path,
            $links: raw.$links.map((l) => normalizer(Link.fromObject(l))),
            $infields: raw.$infields
                ? mapObjectValues(raw.$infields, (field) => normalizeLinks(valueInlineField(field), normalizer))
                : {},
            $tags: raw.$tags,
        });
    }
    private static FIELD_DEF: FieldExtractor<Canvas> = Extractors.merge(
        Extractors.inlineFields((f) => f.$infields),
        Extractors.intrinsics()
    );
}

/** @public */
export namespace Canvas {
    export interface Typed<Fields extends { [key in string]?: Literal }>
        extends Omit<Canvas, keyof TypedFieldbearing<Fields>>,
            TypedFieldbearing<Fields> {}
}

/** All supported canvas card types. */
export type CanvasCard = CanvasTextCard | CanvasFileCard | CanvasWebCard;

/** Shared metadata for all canvas cards. */
export abstract class BaseCanvasCard implements Indexable, Linkable {
    abstract $types: string[];
    abstract $typename: string;
    abstract readonly $type: string;

    $revision?: number | undefined;
    $id: string;
    $position: CardPos;
    $dimensions: CardDimensions;
    $parent?: Indexable;
    $file: string;
    $color?: string;

    public constructor(init: Partial<BaseCanvasCard>) {
        Object.assign(this, init);
    }

    get $link(): Link {
        return Link.file(this.$file).withBlock(this.$id);
    }

    /** @internal */
    public json(): JsonBaseCanvasCard {
        const { $id, $position, $color, $dimensions, $file, $link } = this;
        return {
            $id,
            $position,
            $color,
            $dimensions,
            $file,
            $link: $link.toObject(),
        };
    }
}

/** Canvas card with markdown text in it. */
export class CanvasTextCard extends BaseCanvasCard implements Linkbearing, Taggable, Indexable, Fieldbearing {
    static TYPES = ["canvas-card", "markdown", "canvas-text-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];

    $types: string[] = CanvasTextCard.TYPES;
    $typename: string = "Text card";
    $type: string = "canvas-card";
    $id: string;

    $file: string;
    $links: Link[];
    $tags: string[];
    $title: string;
    $parent?: Indexable;
    $revision?: number;
    $infields: Record<string, InlineField>;
    $frontmatter?: Record<string, FrontmatterEntry>;

    $dimensions: CardDimensions;
    $sections: MarkdownSection[];

    private constructor(init: Partial<CanvasTextCard>) {
        super(init);
    }

    get fields(): Field[] {
        return CanvasTextCard.FIELD_DEF(this);
    }

    public field(key: string): Field | undefined {
        return CanvasTextCard.FIELD_DEF(this, key)?.[0];
    }

    /** @internal */
    public json(): JsonCanvasTextCard {
        return Object.assign(super.json(), {
            $infields: this.$infields,
            $links: this.$links,
            $tags: this.$tags,
            $type: "text-card",
            $sections: this.$sections.map((a) => a.json()),
        }) as JsonCanvasTextCard;
    }

    /** @internal */
    static from(raw: JsonCanvasTextCard, file: string, normalizer: LinkNormalizer = NOOP_NORMALIZER) {
        let $sections = raw.$sections.map((s) => MarkdownSection.from(s, file, normalizer));
        return new CanvasTextCard({
            $file: file,
            $id: raw.$id,
            $sections,
            $links: raw.$links.map((l) => normalizer(Link.fromObject(l))),
            $dimensions: raw.$dimensions,
            $position: raw.$position,
            $frontmatter: raw.$frontmatter
                ? mapObjectValues(raw.$frontmatter, (fm) => normalizeLinks(valueFrontmatterEntry(fm), normalizer))
                : undefined,
            $infields: raw.$infields
                ? mapObjectValues(raw.$infields, (field) => normalizeLinks(valueInlineField(field), normalizer))
                : {},
            $tags: raw.$tags,
        });
    }

    static FIELD_DEF: FieldExtractor<CanvasTextCard> = Extractors.merge(
        Extractors.intrinsics(),
        Extractors.inlineFields((f) => f.$infields),
        Extractors.frontmatter((f) => f.$frontmatter)
    );
}

/** @public */
export namespace CanvasTextCard {
    export interface Typed<Fields extends { [key in string]?: Literal }>
        extends Omit<CanvasTextCard, keyof TypedFieldbearing<Fields>>,
            TypedFieldbearing<Fields> {}
}

/** Canvas card that is just a file embedding. */
export class CanvasFileCard extends BaseCanvasCard implements Indexable {
    static TYPES = ["canvas-card", "markdown", "canvas-file-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];

    $types: string[] = CanvasTextCard.TYPES;
    $typename: string = "File card";

    private constructor(init: Partial<CanvasFileCard>) {
        super(init);
    }

    readonly $type: string = "file-card";
    $linkedFile: string;

    /** @internal */
    public json(): JsonCanvasFileCard {
        return Object.assign(super.json(), {
            $linkedFile: this.$linkedFile,
            $type: "file-card",
        }) as JsonCanvasFileCard;
    }

    /** @internal */
    static from(raw: JsonCanvasFileCard) {
        return new CanvasFileCard({
            $file: raw.$file,
            $id: raw.$id,
            $position: raw.$position,
            $dimensions: raw.$dimensions,
            $linkedFile: raw.$linkedFile,
        });
    }
}

export class CanvasWebCard extends BaseCanvasCard implements Indexable {
    static TYPES = ["canvas-card", "markdown", "canvas-web-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];

    $types: string[] = CanvasTextCard.TYPES;
    readonly $type: string = "web-card";
    $typename: string = "Web card";

    $url: string;

    private constructor(init: Partial<CanvasWebCard>) {
        super(init);
    }

    /** @internal */
    public json(): JsonCanvasWebCard {
        return Object.assign(super.json(), {
            $url: this.$url,
            $type: "web-card",
        }) as JsonCanvasWebCard;
    }

    /** @internal */
    static from(raw: JsonCanvasWebCard, file: string) {
        return new CanvasWebCard({
            $dimensions: raw.$dimensions,
            $position: raw.$position,
            $file: file,
            $id: raw.$id,
            $url: raw.$url,
        });
    }
}
