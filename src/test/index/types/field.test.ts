import { Literal } from "expression/literal";
import { Extractors, INTRINSIC_PROVENANCE } from "index/types/field";
import { Indexable } from "index/types/indexable";

class DummyFields {
    public constructor(public text: string, public value: number, public size: number) {}

    public get valueSize(): number {
        return this.value + this.size;
    }
}

describe("Intrinsic Behavior", () => {
    const intrinsics = Extractors.intrinsics();
    const dummy = new DummyFields("Hello", 10, 20);

    test("Fetch Text", () =>
        expect(intrinsics(dummy, "text")).toEqual([{ key: "text", value: "Hello", provenance: INTRINSIC_PROVENANCE }]));

    test("Fetch Value", () =>
        expect(intrinsics(dummy, "value")).toEqual([{ key: "value", value: 10, provenance: INTRINSIC_PROVENANCE }]));

    test("Fetch Derived", () =>
        expect(intrinsics(dummy, "valueSize")).toEqual([
            { key: "valueSize", value: 30, provenance: INTRINSIC_PROVENANCE },
        ]));
});

class DummyMarkdown implements Indexable {
    public $types: string[] = ["a", "b", "c"];
    public $file: string = "file";
    public $id: string = "dummy";
    public $typename: string = "Dummy";

    public constructor(public keys: Record<string, Literal>, public raws: Record<string, Literal>) {}
}

describe("Frontmatter Behavior", () => {
    const extractor = Extractors.frontmatter<DummyMarkdown>(
        (x) => x.keys,
        (x) => x.raws
    );
    const dummy = new DummyMarkdown({ a: 10, b: "hello" }, { a: 10, b: "Hello!" });

    test("Fetch A", () =>
        expect(extractor(dummy, "a")).toEqual([
            { key: "a", value: 10, raw: 10, provenance: { type: "frontmatter", key: "a", file: "file" } },
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
