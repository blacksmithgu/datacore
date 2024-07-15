import { JsonLink } from "expression/link";
import { JsonInlineField } from "index/import/inline-field";
import { JsonFrontmatterEntry, JsonMarkdownSection } from "./markdown";
import { CachedMetadata, EmbedCache } from "obsidian";
export interface CanvasMetadataIndex {
	[k: string]: {
		caches: {
			[c: string]: CachedMetadata;
		}
		embeds: EmbedCache[]
	}
}
export interface CardPos {
	x: number;
	y: number;
}
export interface CardDimensions {
	width: number;
	height: number;	
}
export interface JsonCanvas {
	$cards: JsonCanvasCard[];
	$size: number;
	$path: string;
	$ctime: number;
	$mtime: number;
	$tags: string[];
	$links: JsonLink[];
	$infields: Record<string, JsonInlineField>
}
export interface JsonBaseCanvasCard {
	$file: string;
	$id: string;
	$position: CardPos;
	$dimensions: CardDimensions;
	$color?: string;
	$link: JsonLink;
}

export interface JsonCanvasGroup extends JsonBaseCanvasCard {
	$title: string;
}

export interface JsonCanvasTextCard extends JsonBaseCanvasCard {


	$type: "text-card";
	$tags: string[];

	$links: JsonLink[];

	$infields: Record<string, JsonInlineField>;

	
	$sections: JsonMarkdownSection[];

	$frontmatter?: Record<string, JsonFrontmatterEntry>;
}

export interface JsonCanvasFileCard extends JsonBaseCanvasCard {
	$linkedFile: string;
	$type: "file-card";	
}
export interface JsonCanvasWebCard extends JsonBaseCanvasCard {
	$url: string;
	$type: "web-card"
}
export type JsonCanvasCard = JsonCanvasTextCard | JsonCanvasFileCard | JsonCanvasWebCard;