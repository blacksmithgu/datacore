import { extractSubtags } from "util/normalize";

describe("Extract Subtags", () => {
    test("Empty", () => expect(extractSubtags([])).toEqual([]));
    test("Solo", () => expect(extractSubtags("#a")).toEqual(["#a"]));
    test("Single List", () => expect(extractSubtags(["#a"])).toEqual(["#a"]));
    test("Double List", () => expect(extractSubtags(["#a", "#b"])).toEqual(["#a", "#b"]));

    test("Subtag", () => expect(extractSubtags("#a/b/c")).toEqual(["#a/b/c", "#a/b", "#a"]));
});
