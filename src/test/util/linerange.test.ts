import { lineRange } from "utils/normalizers";

describe("Line Range", () => {
    test("Single Line", () => expect(lineRange("hello", 0, 1)).toEqual("hello"));

    test("First Line", () => expect(lineRange("hello\nworld", 0, 1)).toEqual("hello"));
    test("Second Line", () => expect(lineRange("hello\nworld", 1, 2)).toEqual("world"));

    test("First Line (Extended)", () => expect(lineRange("hello\nworld\n\n", 0, 1)).toEqual("hello"));
    test("Second Line (Extended)", () => expect(lineRange("hello\nworld\n\n", 1, 2)).toEqual("world"));

    test("Two Lines", () => expect(lineRange("hello\nworld", 0, 2)).toEqual("hello\nworld"));

    test("Just Newline", () => expect(lineRange("\n", 0, 1)).toEqual(""));
    test("Just Newline (Out of Bounds)", () => expect(lineRange("\n", 1, 2)).toEqual(""));

    test("4 Lines", () => expect(lineRange("hello\n\n\nworld\ntext\n\n", 4, 5)).toEqual("text"));
});
