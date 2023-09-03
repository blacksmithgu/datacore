import { BimapIndex } from "index/storage/bimap";

test("Simple Set/Get", () => {
    let index = new BimapIndex();
    index.set("test", new Set(["one", "two"]));
    index.set("test2", new Set(["two"]));

    expect(index.get("test")).toEqual(new Set(["one", "two"]));
    expect(index.get("test2")).toEqual(new Set(["two"]));
});

test("Inverted Get", () => {
    let index = new BimapIndex();
    index.set("test", new Set(["a", "b", "c"]));
    index.set("test2", new Set(["a", "c"]));
    index.set("test3", new Set([]));

    expect(index.invert("a")).toEqual(new Set(["test", "test2"]));
    expect(index.invert("b")).toEqual(new Set(["test"]));
    expect(index.invert("")).toEqual(new Set());

    index.set("test", new Set(["a", "c"]));
    expect(index.invert("b")).toEqual(new Set([]));
    expect(index.invert("a")).toEqual(new Set(["test", "test2"]));
    expect(index.invert("c")).toEqual(new Set(["test", "test2"]));

    index.set("test", new Set([]));
    expect(index.invert("a")).toEqual(new Set(["test2"]));
    expect(index.invert("c")).toEqual(new Set(["test2"]));
});
