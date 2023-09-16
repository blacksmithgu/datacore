import { normalizeHeaderForLink } from "util/normalize";

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
