import { MarkdownTaskItem } from "index/types/markdown";

describe("cleantext", () => {
    const cleanText = "nice and clean";

    test("allready clean", () => expect(new MarkdownTaskItem({ $text: cleanText }).$cleantext).toBe(cleanText));
    test("trailing spaces", () => expect(new MarkdownTaskItem({ $text: cleanText + "  " }).$cleantext).toBe(cleanText));
    test("leading spaces", () => expect(new MarkdownTaskItem({ $text: "  " + cleanText }).$cleantext).toBe(cleanText));
    test("with tab indent", () => expect(new MarkdownTaskItem({ $text: "\t" + cleanText }).$cleantext).toBe(cleanText));
    test("with square bracket inline field", () =>
        expect(new MarkdownTaskItem({ $text: cleanText + "[key:: value]" }).$cleantext).toBe(cleanText));
    test("with round bracket inline field", () =>
        expect(new MarkdownTaskItem({ $text: cleanText + "(key:: value)" }).$cleantext).toBe(cleanText));
    test("with multiple inline fields", () =>
        expect(new MarkdownTaskItem({ $text: cleanText + " (key:: value) [another:: one]" }).$cleantext).toBe(
            cleanText
        ));
    test("with id", () => expect(new MarkdownTaskItem({ $text: cleanText + " ^id" }).$cleantext).toBe(cleanText));
    test("with inline field and id", () =>
        expect(new MarkdownTaskItem({ $text: cleanText + "[key:: value] ^id" }).$cleantext).toBe(cleanText));
    test("all combined", () =>
        expect(
            new MarkdownTaskItem({ $text: "\t" + cleanText + "  [key:: value] (another :: one) ^some-id    " })
                .$cleantext
        ).toBe(cleanText));
    test("just inline fields and id", () =>
        expect(new MarkdownTaskItem({ $text: "[key:: value] ^id" }).$cleantext).toBe(""));
});
