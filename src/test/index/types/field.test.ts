import { InlineField } from "index/import/inline-field";
import { Extractors } from "expression/field";
import { Indexable } from "index/types/indexable";
import { FrontmatterEntry } from "index/types/markdown";

class DummyFields {
    public constructor(public $text: string, public $value: number, public $size: number) {}

    public get $valueSize(): number {
        return this.$value + this.$size;
    }
}

describe("Intrinsic Behavior", () => {
    const intrinsics = Extractors.intrinsics();
    const dummy = new DummyFields("Hello", 10, 20);

    test("Fetch Text", () => expect(intrinsics(dummy, "$text")).toEqual([{ key: "$text", value: "Hello" }]));

    test("Fetch Value", () => expect(intrinsics(dummy, "$value")).toEqual([{ key: "$value", value: 10 }]));

    test("Fetch Derived", () => expect(intrinsics(dummy, "$valueSize")).toEqual([{ key: "$valueSize", value: 30 }]));
});

class DummyMarkdown implements Indexable {
    public $types: string[] = ["a", "b", "c"];
    public $file: string = "file";
    public $id: string = "dummy";
    public $typename: string = "Dummy";

    public constructor(public frontmatter: Record<string, FrontmatterEntry>) {}
}

describe("Frontmatter Behavior", () => {
    const extractor = Extractors.frontmatter<DummyMarkdown>((x) => x.frontmatter);
    const dummy = new DummyMarkdown({
        a: {
            key: "a",
            value: 10,
            raw: "10",
        },
        b: {
            key: "b",
            value: "hello",
            raw: "Hello!",
        },
    });

    test("Fetch A", () =>
        expect(extractor(dummy, "a")).toEqual([
            { key: "a", value: 10, raw: "10", provenance: { type: "frontmatter", key: "a", file: "file" } },
        ]));

    test("Fetch B Insensitive", () =>
        expect(extractor(dummy, "B")).toEqual([
            { key: "b", value: "hello", raw: "Hello!", provenance: { type: "frontmatter", key: "b", file: "file" } },
        ]));

    test("Fetch All", () => {
        const elements = new Set(extractor(dummy)?.map((elem) => elem.key));
        expect(elements).toEqual(new Set(["a", "b"]));
    });
});

class DummyInlineFields implements Indexable {
    public $types: string[] = ["a", "b", "c"];
    public $file: string = "file";
    public $id: string = "dummy";
    public $typename: string = "Dummy";

    public constructor(public fields: Record<string, InlineField>) {}
}

describe("Inline Field Behavior", () => {
    const extractor = Extractors.inlineFields<DummyInlineFields>((x) => x.fields);
    const dummy = new DummyInlineFields({
        a: {
            key: "a",
            value: 10,
            raw: "10",
            position: {
                line: 1,
                start: 1,
                startValue: 1,
                end: 2,
            },
        },
        b: {
            key: "b",
            value: "hello",
            raw: "Hello!",
            position: {
                line: 2,
                start: 1,
                startValue: 1,
                end: 2,
            },
        },
    });

    test("Fetch A", () =>
        expect(extractor(dummy, "a")).toEqual([
            { key: "a", value: 10, raw: "10", provenance: { type: "inline-field", key: "a", file: "file", line: 1 } },
        ]));

    test("Fetch B Insensitive", () =>
        expect(extractor(dummy, "B")).toEqual([
            {
                key: "b",
                value: "hello",
                raw: "Hello!",
                provenance: { type: "inline-field", key: "b", file: "file", line: 2 },
            },
        ]));

    test("Fetch All", () => {
        const elements = new Set(extractor(dummy)?.map((elem) => elem.key));
        expect(elements).toEqual(new Set(["a", "b"]));
    });
});
