import { Extractors, Field, Fieldbearing, FIELDBEARING_TYPE, FieldExtractor } from "expression/field";
import { FILE_TYPE, Indexable, LINKABLE_TYPE, Linkbearing, Taggable, TAGGABLE_TYPE } from "./indexable";
import { CardDimensions, CardPos, JsonCanvas, JsonCanvasFileCard, JsonCanvasTextCard, JsonCanvasWebCard } from "./json/canvas";
import { DateTime } from "luxon";
import { Link } from "expression/link";
import { FrontmatterEntry, LinkNormalizer, MarkdownPage, MarkdownSection, NOOP_NORMALIZER, normalizeLinks, valueFrontmatterEntry } from "./markdown";
import { InlineField } from "index/import/inline-field";
import {File} from "index/types/indexable";
import { mapObjectValues } from "utils/data";

export class Canvas implements File, Linkbearing, Taggable, Indexable, Fieldbearing {
	static TYPES = [FILE_TYPE, "canvas", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];

	$types: string[] = Canvas.TYPES;
	$typename: string = "Canvas";

	$ctime: DateTime;
	$mtime: DateTime;
	
	get $file() {
		return this.$path;
	}

	get $id() {
		return this.$path;
	}
	get $extension() {
		return "canvas";
	}
	get $link() {
		return Link.file(this.$path);
	}
	$path: string;
	$cards: CanvasCard[] = [];	
	$size: number = 0;
	$tags: string[];
	$links: Link[];
	$infields: Record<string, InlineField>;
	private constructor(init: Partial<Canvas>) {
		Object.assign(this, init);
	}
	get fields(): Field[] {
		return Canvas.FIELD_DEF(this)
	}
	public field(key: string): Field | undefined {
		return Canvas.FIELD_DEF(this, key)?.[0];
	}
	static from(raw: JsonCanvas, normalizer: LinkNormalizer = NOOP_NORMALIZER): Canvas {
		const cards = raw.$cards.map(s => {
			switch(s.$type) {
				case "text-card":
					return CanvasTextCard.from(s, raw.$path, normalizer);
				case "file-card":
					return CanvasFileCard.from(s);
				case "web-card":
					return CanvasWebCard.from(s, raw.$path);
			}
			return null;
		}).filter(x => !!x)
		return new Canvas({
			$cards: cards,
			$ctime: DateTime.fromMillis(raw.$ctime),
			$mtime: DateTime.fromMillis(raw.$mtime),
			$size: raw.$size,
			$extension: "canvas",
			$path: raw.$path,
			$links: raw.$links.map(l => normalizer(Link.fromObject(l))),
			$infields: raw.$infields,
			$id: raw.$path,
			$tags: raw.$tags,
			$link: Link.file(raw.$path),	
		})
	}
	private static FIELD_DEF: FieldExtractor<Canvas> = Extractors.merge(Extractors.inlineFields(f => f.$infields), Extractors.intrinsics())
}

abstract class CanvasCard {
	public constructor(init: Partial<CanvasCard>) {
		Object.assign(this, init);
	}
	$id: string;
	$position: CardPos;
	$dimensions: CardDimensions;
	$parent?: Indexable;
	$file: string;
	$color?: string;
	readonly abstract $type: string;
}

export class CanvasTextCard extends CanvasCard implements Linkbearing, Taggable, Indexable, Fieldbearing {

	static TYPES = ["canvas-card", "markdown", "text-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];
	$types: string[] = CanvasTextCard.TYPES;
	$typename: string = "Text Card";
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
	$sections: MarkdownSection[] = [];
	private constructor(init: Partial<CanvasTextCard>) {
		super(init);
	}
	get fields(): Field[] {
		return CanvasTextCard.FIELD_DEF(this)
	}
	public field(key: string): Field | undefined {
		return CanvasTextCard.FIELD_DEF(this, key)?.[0];
	}
	static from(raw: JsonCanvasTextCard, file: string, normalizer: LinkNormalizer = NOOP_NORMALIZER) {
		return new CanvasTextCard({
			$file: file,
			$id: raw.$id,
			$links: raw.$links.map(l => normalizer(Link.fromObject(l))),
			$sections: raw.$sections.map(s => MarkdownSection.from(s, file, normalizer)),
			$dimensions: raw.$dimensions,
			$position: raw.$position,
			$frontmatter: raw.$frontmatter ? mapObjectValues(raw.$frontmatter, fm => normalizeLinks(valueFrontmatterEntry(fm), normalizer)) : undefined,
			$infields: raw.$infields,
			$tags: raw.$tags,

		})
	}

	static FIELD_DEF: FieldExtractor<CanvasTextCard> = Extractors.merge(Extractors.intrinsics(), Extractors.inlineFields((f) => f.$infields), Extractors.frontmatter(f => f.$frontmatter));
}

export class CanvasFileCard extends CanvasCard implements Indexable {
	static TYPES = ["canvas-card", "markdown", "file-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];
	$types: string[] = CanvasTextCard.TYPES;
	$typename: string = "File Card"
	private constructor(init: Partial<CanvasFileCard>) {
		super(init);
	}
	readonly $type: string = "file-card";
	$linkedFile: string;

	/* the page this card is embedding */
	$page: MarkdownPage;

	static from(raw: JsonCanvasFileCard) {
		return new CanvasFileCard({
			$file: raw.$file,
			$id: raw.$id,
			$position: raw.$position,
			$dimensions: raw.$dimensions,
			$linkedFile: raw.$linkedFile,
		})
	}
}

export class CanvasWebCard extends CanvasCard implements Indexable {
	private constructor(init: Partial<CanvasWebCard>) {
		super(init);
	}
	static TYPES = ["canvas-card", "markdown", "web-card", TAGGABLE_TYPE, LINKABLE_TYPE, FIELDBEARING_TYPE];
	$types: string[] = CanvasTextCard.TYPES;
	$typename: string = "Web Card";
	$url: string;

	readonly $type: string = "web-card";

	static from(raw: JsonCanvasWebCard, file: string) {
		return new CanvasWebCard({
			$dimensions: raw.$dimensions,
			$position: raw.$position,
			$file: file,
			$id: raw.$id,
			$url: raw.$url,
		})
	}
}