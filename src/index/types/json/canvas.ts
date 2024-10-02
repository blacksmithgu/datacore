import { JsonLink } from "expression/link";
import { JsonInlineField } from "index/import/inline-field";
import { JsonFrontmatterEntry, JsonMarkdownSection } from "./markdown";
import { CachedMetadata, EmbedCache } from "obsidian";

export interface CanvasMetadataIndex {
    [k: string]: {
        caches: {
            [c: string]: CachedMetadata;
        };
        embeds: EmbedCache[];
    };
}

/** Absolute x, y position of a card on the canvas in logical units. */
export interface CardPos {
    x: number;
    y: number;
}

/** 2D dimensions of a canvas card in logical units. */
export interface CardDimensions {
    width: number;
    height: number;
}

/** JSON representation of all canvas metadata. */
export interface JsonCanvas {
    /** All of the cards in the canvas. */
    $cards: JsonCanvasCard[];
    /** Total byte size of the canvas. */
    $size: number;
    /** Path to the canvas file. */
    $path: string;
    /** Created time as a UNIX epoch time in milliseconds. */
    $ctime: number;
    /** Last modified time as a UNIX epoch time in milliseconds. */
    $mtime: number;
    /** All tags in the canvas. */
    $tags: string[];
    /** All links in the canvas. */
    $links: JsonLink[];
    /** All inline fields in the canvas. */
    $infields: Record<string, JsonInlineField>;
}

/** Common metadata for all canvas cards. */
export interface JsonBaseCanvasCard {
    /** Path of the canvas file this card comes from. */
    $file: string;
    /** In-canvas ID of the card. */
    $id: string;
    /** Position of the card in the canvas. */
    $position: CardPos;
    /** Size of the card in the canvas. */
    $dimensions: CardDimensions;
    /** The background color of the card. */
    $color?: string;
    /** A direct link to the card. */
    $link: JsonLink;
}

/** A canvas text card. */
export interface JsonCanvasTextCard extends JsonBaseCanvasCard {
    $type: "text-card";
    $tags: string[];

    $links: JsonLink[];
    $infields: Record<string, JsonInlineField>;
    $sections: JsonMarkdownSection[];
    $frontmatter?: Record<string, JsonFrontmatterEntry>;
}

/** An embedded file card in a canvas. */
export interface JsonCanvasFileCard extends JsonBaseCanvasCard {
    $linkedFile: string;
    $type: "file-card";
}

/** An embedded web link in a canvas. */
export interface JsonCanvasWebCard extends JsonBaseCanvasCard {
    $url: string;
    $type: "web-card";
}

/** A canvas card in an Obsidian canvas. */
export type JsonCanvasCard = JsonCanvasTextCard | JsonCanvasFileCard | JsonCanvasWebCard;
