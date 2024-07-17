import { FileStats } from "obsidian";
import { iterateInlineFields, markdownSourceImport, Metadata, SectionData } from "./markdown";
import { JsonFrontmatterEntry } from "index/types/json/markdown";
import {
    CanvasMetadataIndex,
    JsonBaseCanvasCard,
    JsonCanvas,
    JsonCanvasCard,
    JsonCanvasFileCard,
    JsonCanvasTextCard,
    JsonCanvasWebCard,
} from "index/types/json/canvas";
import { CanvasFileData, CanvasLinkData, CanvasTextData, CanvasData as ICanvas } from "obsidian/canvas";
import { Link } from "expression/link";
export function canvasImport(path: string, source: string, index: CanvasMetadataIndex["string"], stats: FileStats): JsonCanvas {
    const canvas = new CanvasData(path, stats);
    const parsed = JSON.parse(source) as ICanvas;
    for (const c of parsed.nodes) {
        if (c.type == "group") continue;
        if (c.type == "text") {
            const { frontmatter, metadata, lines, sections } = markdownSourceImport(path, c.text, index.caches[c.id]);
            const card = new CanvasCardData(path, c.id, c, frontmatter);
            sections.forEach((i) => card.section(i));
            canvas.card(card);
            for (const tag in metadata.tags) canvas.metadata.tag(tag);
            for (const link of metadata.links ?? []) canvas.metadata.link(link);
            for (const field of iterateInlineFields(lines)) canvas.metadata.inlineField(field);
        } else {
            const card = new CanvasCardData(path, c.id, c);
            canvas.card(card);
        }
    }
    return canvas.build();
}

abstract class AbstractCanvasCardData {
    public metadata: Metadata = new Metadata();
    public constructor(
        public path: string,
        public id: string,
        protected nodeJson: CanvasTextData | CanvasLinkData | CanvasFileData
    ) {}
    public build(): JsonBaseCanvasCard {
        return {
            $file: this.path,
            $id: this.id,
            $position: {
                x: this.nodeJson.x,
                y: this.nodeJson.y,
            },
            $dimensions: {
                width: this.nodeJson.width,
                height: this.nodeJson.height,
            },
            $color: this.nodeJson.color,
						$link: Link.file(this.path).withBlock(this.id).toObject()
        };
    }
}
export class CanvasCardData extends AbstractCanvasCardData {
    public sections: SectionData[] = [];
    public constructor(
        public path: string,
        public id: string,
        protected nodeJson: CanvasTextData | CanvasLinkData | CanvasFileData,
        public frontmatter?: Record<string, JsonFrontmatterEntry>
    ) {
        super(path, id, nodeJson);
    }
    public section(section: SectionData): SectionData {
        this.sections.push(section);
        return section;
    }
    public build(): JsonCanvasCard {
        switch (this.nodeJson.type) {
            case "text":
                return {
                    ...(super.build() as JsonBaseCanvasCard),
                    $infields: this.metadata.finishInlineFields(),
                    $frontmatter: this.frontmatter,
                    $sections: this.sections.map((x) => x.build()),
                    $tags: this.metadata.finishTags(),
                    $links: this.metadata.finishLinks(),
                    $type: "text-card",
                    $color: this.nodeJson.color,
                } as JsonCanvasTextCard;
            case "file":
                return {
                    ...super.build(),
                    $linkedFile: this.nodeJson.file,
                } as JsonCanvasFileCard;
            case "link":
                return {
                    ...super.build(),
                    $url: this.nodeJson.url,
                } as JsonCanvasWebCard;
            // return new
        }
    }
}

export class CanvasData {
    public cards: CanvasCardData[] = [];
    public metadata: Metadata = new Metadata();
    public constructor(public path: string, public stats: FileStats) {}
    public card(d: CanvasCardData): CanvasCardData {
        this.cards.push(d);
        return d;
    }
    public build(): JsonCanvas {
        return {
            $cards: this.cards.map((x) => x.build()),
            $ctime: this.stats.ctime,
            $mtime: this.stats.mtime,
            $infields: this.metadata.finishInlineFields(),
            $links: this.metadata.finishLinks(),
            $tags: this.metadata.finishTags(),
            $path: this.path,
            $size: this.stats.size,
        };
    }
}
