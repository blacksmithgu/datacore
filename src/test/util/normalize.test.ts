import { extractSubtags, normalizeHeaderForLink } from "utils/normalizers";

describe("Header Normalization", () => {
    test("Link", () => expect(normalizeHeaderForLink("Header  [[Outer Wilds]]  ")).toEqual("Header Outer Wilds"));
    test("Dash", () => expect(normalizeHeaderForLink("Header - More")).toEqual("Header - More"));
    test("Underscore", () => expect(normalizeHeaderForLink("Header _ More _")).toEqual("Header _ More _"));
    test("Link with Display", () =>
        expect(normalizeHeaderForLink("Header  [[Outer Wilds|Thing]]  ")).toEqual("Header Outer Wilds Thing"));
    test("Markup", () => expect(normalizeHeaderForLink("**Header** *Value")).toEqual("Header Value"));
    test("Emoji", () =>
        expect(normalizeHeaderForLink("Header   📷 [[Outer Wilds]]  ")).toEqual("Header 📷 Outer Wilds"));
});

describe("Extract Subtags", () => {
    test("Empty", () => expect(extractSubtags([])).toEqual([]));
    test("Solo", () => expect(extractSubtags("#a")).toEqual(["#a"]));
    test("Single List", () => expect(extractSubtags(["#a"])).toEqual(["#a"]));
    test("Double List", () => expect(extractSubtags(["#a", "#b"])).toEqual(["#a", "#b"]));

    test("Subtag", () => expect(extractSubtags("#a/b/c")).toEqual(["#a/b/c", "#a/b", "#a"]));
});
