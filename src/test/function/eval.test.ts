/** Various tests for evaluating fields in context. */

import { Duration } from "luxon";
import { Expressions } from "expression/expression";
import { Link } from "expression/literal";
import { simpleEvaluator, parseEval } from "test/common";
import { Evaluator } from "expression/evaluator";
import { DEFAULT_SETTINGS } from "settings";

// <-- Numeric Operations -->

test("Evaluate simple numeric operations", () => {
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(2), "+", Expressions.literal(4)))
    ).toEqual(6);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(2), "-", Expressions.literal(4)))
    ).toEqual(-2);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(2), "*", Expressions.literal(4)))
    ).toEqual(8);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(8), "/", Expressions.literal(4)))
    ).toEqual(2);
});

test("Evaluate numeric comparisons", () => {
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(8), "<", Expressions.literal(4)))
    ).toEqual(false);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(-2), "=", Expressions.literal(-2)))
    ).toEqual(true);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal(-2), ">=", Expressions.literal(-8)))
    ).toEqual(true);
});

test("Evaluate complex numeric operations", () => {
    expect(parseEval("12 + 8 - 4 / 2")).toEqual(18);
    expect(parseEval("16 / 8 / 2")).toEqual(1);
    expect(parseEval("39 / 3 <= 14")).toEqual(true);
});

// <-- String Operations -->

test("Evaluate simple string operations", () => {
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal("a"), "+", Expressions.literal("b")))
    ).toEqual("ab");
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal("a"), "+", Expressions.literal(12)))
    ).toEqual("a12");
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal("a"), "*", Expressions.literal(6)))
    ).toEqual("aaaaaa");
});

test("Evaluate string comparisons", () => {
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal("abc"), "<", Expressions.literal("abd")))
    ).toEqual(true);
    expect(
        simpleEvaluator().tryEvaluate(Expressions.binaryOp(Expressions.literal("xyz"), "=", Expressions.literal("xyz")))
    ).toEqual(true);
});

// <-- Date Operations -->

test("Evaluate date comparisons", () => {
    expect(parseEval("date(2021-01-14) = date(2021-01-14)")).toEqual(true);
    expect(parseEval("contains(list(date(2020-01-01)), date(2020-01-01))")).toEqual(true);
});

test("Evaluate date subtraction", () => {
    let duration = parseEval("date(2021-05-04) - date(1997-05-17)") as Duration;
    expect(duration.years).toEqual(23);
});

// <-- Field resolution -->

test("Evaluate simple field resolution", () => {
    let context = simpleEvaluator().set("a", 18).set("b", "hello");
    expect(context.get("a")).toEqual(18);
    expect(context.get("b")).toEqual("hello");
    expect(context.get("c")).toEqual(null);
});

test("Evaluate simple object resolution", () => {
    let object = { inner: { final: 6 } };
    let context = simpleEvaluator().set("obj", object);

    expect(context.tryEvaluate(Expressions.indexVariable("obj.inner"))).toEqual(object.inner);
    expect(context.tryEvaluate(Expressions.indexVariable("obj.inner.final"))).toEqual(object.inner.final);
});

test("Evaluate simple link resolution", () => {
    let object = { inner: { final: 6 } };
    let context = new Evaluator(
        { resolve: (path) => object, normalize: (path) => path, exists: (path) => false },
        DEFAULT_SETTINGS
    ).set("link", Link.file("test", false));
    expect(context.tryEvaluate(Expressions.indexVariable("link.inner"))).toEqual(object.inner);
    expect(context.tryEvaluate(Expressions.indexVariable("link.inner.final"))).toEqual(object.inner.final);
});

describe("Immediately Invoked Lambdas", () => {
    test("Addition", () => expect(parseEval("((a, b) => a + b)(1, 2)")).toEqual(3));
    test("Negation", () => expect(parseEval("((v) => 0-v)(6)")).toEqual(-6));
    test("Curried", () => expect(parseEval("((a) => (b) => a + b)(1)(2)")).toEqual(3));
    test("In Argument", () => expect(parseEval("((a) => 1 + a)(((a) => 2)(3))")).toEqual(3));
});

describe("Immediately Indexed Objects", () => {
    test("Empty", () => expect(parseEval('{ a: 1, b: 2 }["c"]')).toEqual(null));
    test("Single", () => expect(parseEval('{ a: 1, b: 2 }["a"]')).toEqual(1));
    test("Nested", () => expect(parseEval('{ a: 1, b: { c: 4 } }["b"]["c"]')).toEqual(4));
});
