import { Link } from "expression/link";
import { Literals } from "expression/literal";

describe("Links", () => {
    describe("Comparisons", () => {
        test("Same File", () => expect(Link.file("test").equals(Link.file("test"))).toBeTruthy());
        test("Different File", () => expect(Link.file("test").equals(Link.file("test2"))).toBeFalsy());
        test("Different Subpath", () => expect(Link.file("test").equals(Link.header("test", "Hello"))).toBeFalsy());
        test("Different Subpath Type", () =>
            expect(Link.header("test", "abc").equals(Link.block("test", "abc"))).toBeFalsy());
    });

    describe("General Comparisons", () => {
        test("Same File", () => expect(Literals.compare(Link.file("test"), Link.file("test"))).toBe(0));
        test("Different File", () => expect(Literals.compare(Link.file("test"), Link.file("test2"))).toBeLessThan(0));
        test("Different Subpath", () =>
            expect(Literals.compare(Link.file("test"), Link.header("test", "Hello"))).toBeLessThan(0));
        test("Different Subpath Type", () =>
            expect(Literals.compare(Link.header("test", "abc"), Link.block("test", "abc"))).toBeTruthy());
    });
});
