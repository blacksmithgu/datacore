import { BinaryOpExpression, Expressions, LiteralExpression } from "expression/expression";
import { EXPRESSION, PRIMITIVES } from "expression/parser";
import { DateTime, Duration } from "luxon";
import { Success } from "parsimmon";
import { Literals, Link } from "expression/literal";

// <-- Integer Literals -->

test("Parse Integer Literal", () => {
    expect(PRIMITIVES.number.parse("0no").status).toBe(false);
    expect(PRIMITIVES.number.tryParse("123")).toBe(123);
    expect(PRIMITIVES.number.tryParse("-123")).toBe(-123);
});

test("Parse Float Literal", () => {
    expect(PRIMITIVES.number.tryParse("123.45")).toBeCloseTo(123.45);
    expect(PRIMITIVES.number.tryParse("1000.0")).toBeCloseTo(1000);
    expect(PRIMITIVES.number.tryParse("-123.18")).toBe(-123.18);
    expect(PRIMITIVES.number.parse("123.0.0").status).toBe(false);
});

// <-- String Literals -->

describe("String Literals", () => {
    test("Parse String Literal", () => {
        expect(PRIMITIVES.string.parse(`this won't work, no quotes`).status).toBe(false);
        expect(PRIMITIVES.string.tryParse(`"hello"`)).toBe("hello");

        expect(PRIMITIVES.string.tryParse(`"\\""`)).toBe('"');
        expect(PRIMITIVES.string.parse(`"\\\\""`).status).toBe(false);

        // Test case which failed on old regex
        expect(PRIMITIVES.string.tryParse(`"\\\\\\""`)).toBe(`\\"`);

        // Testcase for escape in regex strings.
        expect(PRIMITIVES.string.tryParse('"\\w+"')).toBe("\\w+");
    });

    test("Parse Empty String Literal", () => {
        expect(PRIMITIVES.string.tryParse('""')).toBe("");
    });

    test("Parse String Escape", () => {
        expect(PRIMITIVES.string.tryParse('"\\""')).toBe('"');
    });

    test("Parse String Escape Escape", () => {
        expect(PRIMITIVES.string.tryParse('"\\\\"')).toBe("\\");
    });

    test("Parse Multiple Strings", () => {
        let result = pexpr('"" or "yes"') as BinaryOpExpression;
        expect(result.type).toBe("binaryop");

        let left = result.left as LiteralExpression;
        expect(left.type).toBe("literal");
        expect(left.value).toBe("");

        let right = result.right as LiteralExpression;
        expect(right.type).toBe("literal");
        expect(right.value).toBe("yes");
    });

    test("Parse emoji", () => {
        expect(PRIMITIVES.string.tryParse('"📷"')).toEqual("📷");
        expect(PRIMITIVES.string.tryParse('"⚙️"')).toEqual("⚙️");
    });

    test("Parse string which includes emoji", () => {
        expect(PRIMITIVES.string.tryParse('"⚗️ KNOWLEDGE"')).toEqual("⚗️ KNOWLEDGE");
    });
});

// <-- Booleans -->

test("Parse boolean literal", () => {
    expect(PRIMITIVES.bool.tryParse("true")).toBe(true);
    expect(PRIMITIVES.bool.tryParse("false")).toBe(false);
    expect(PRIMITIVES.bool.parse("fal").status).toBe(false);
});

// <-- Tags -->

describe("Tag Literals", () => {
    test("Daily", () => expect(PRIMITIVES.tag.tryParse("#daily/2021/20/08")).toEqual("#daily/2021/20/08"));
    test("Dashes", () =>
        expect(PRIMITIVES.tag.tryParse("#hello-from-marketing/yes")).toEqual("#hello-from-marketing/yes"));

    test("#📷", () => expect(PRIMITIVES.tag.tryParse("#📷")).toEqual("#📷"));
    test("#🌱/🌿", () => expect(PRIMITIVES.tag.tryParse("#🌱/🌿")).toEqual("#🌱/🌿"));
    test("#⚙️", () => expect(PRIMITIVES.tag.tryParse("#⚙️")).toEqual("#⚙️"));
    test("#début", () => expect(PRIMITIVES.tag.tryParse("#début")).toEqual("#début"));
});

// <-- Identifiers -->

describe("Identifiers", () => {
    test("lma0", () => expect(PRIMITIVES.identifier.tryParse("lma0")).toEqual("lma0"));
    test("0no", () => expect(PRIMITIVES.identifier.parse("0no").status).toBeFalsy());
    test("a*b", () => expect(PRIMITIVES.identifier.parse("a*b").status).toBeFalsy());
    test("😊", () => expect(PRIMITIVES.identifier.tryParse("😊")).toEqual("😊"));
    test("📷", () => expect(PRIMITIVES.identifier.tryParse("📷")).toEqual("📷"));
});

// <-- Dates -->

test("Parse Year-Month date", () => {
    let date = PRIMITIVES.date.tryParse("2020-04");
    expect(date.year).toBe(2020);
    expect(date.month).toBe(4);
});

test("Parse Year-Month-Day date", () => {
    let date = PRIMITIVES.date.tryParse("1984-08-15");
    expect(date.year).toBe(1984);
    expect(date.month).toBe(8);
    expect(date.day).toBe(15);
});

test("Parse Year-Month-DayTHour:Minute:Second", () => {
    let date = PRIMITIVES.date.tryParse("1984-08-15T12:42:59");
    expect(date.year).toBe(1984);
    expect(date.month).toBe(8);
    expect(date.day).toBe(15);
    expect(date.hour).toBe(12);
    expect(date.minute).toBe(42);
    expect(date.second).toBe(59);
});

test("Parse Year-Month-DayTHour:Minute:Second", () => {
    let date = PRIMITIVES.date.tryParse("1984-08-15T12:42:59");
    expect(date.year).toBe(1984);
    expect(date.month).toBe(8);
    expect(date.day).toBe(15);
    expect(date.hour).toBe(12);
    expect(date.minute).toBe(42);
    expect(date.second).toBe(59);
});

test("Parse Year-Month-DayTHour:Minute:Second.Millisecond", () => {
    let date = PRIMITIVES.date.tryParse("1984-08-15T12:42:59.123");
    expect(date.year).toBe(1984);
    expect(date.month).toBe(8);
    expect(date.day).toBe(15);
    expect(date.hour).toBe(12);
    expect(date.minute).toBe(42);
    expect(date.second).toBe(59);
    expect(date.millisecond).toBe(123);

    let builtin = PRIMITIVES.date.tryParse(new Date("1984-08-15T12:42:59.123").toISOString());
    // only seconds and milliseconds are inconsistent due to Javascript being bad with
    // time zones, but the goal here is to ensure values are parsed appropriately at least
    expect(builtin.second).toBe(59);
    expect(builtin.millisecond).toBe(123);
});

describe("Parse Year-Month-DayTHour:Minute:Second(.Millisecond?)Timezone", () => {
    test("Offset", () => {
        let date1 = PRIMITIVES.date.tryParse("1984-08-15T12:40:50-07:00");
        expect(date1.year).toBe(1984);
        expect(date1.month).toBe(8);
        expect(date1.day).toBe(15);
        expect(date1.hour).toBe(12);
        expect(date1.minute).toBe(40);
        expect(date1.second).toBe(50);
        expect(date1.millisecond).toBe(0);
        expect(date1.zoneName).toBe("UTC-7");

        let date2 = PRIMITIVES.date.tryParse("1984-08-15T12:40:50+9");
        expect(date2.zoneName).toBe("UTC+9");

        let date3 = PRIMITIVES.date.tryParse("1985-12-06T19:40:10+06:30");
        expect(date3.zoneName).toBe("UTC+6:30");
    });

    test("Named timezone", () => {
        let date1 = PRIMITIVES.date.tryParse("2021-08-15T12:40:50[Europe/Paris]");
        expect(date1.year).toBe(2021);
        expect(date1.month).toBe(8);
        expect(date1.day).toBe(15);
        expect(date1.hour).toBe(12);
        expect(date1.minute).toBe(40);
        expect(date1.second).toBe(50);
        expect(date1.millisecond).toBe(0);
        expect(date1.toString()).toBe("2021-08-15T12:40:50.000+02:00");
        expect(date1.zoneName).toBe("Europe/Paris");

        let date2 = PRIMITIVES.date.tryParse("2021-11-15T12:40:50[Europe/Paris]");
        expect(date2.year).toBe(2021);
        expect(date2.month).toBe(11);
        expect(date2.day).toBe(15);
        expect(date2.hour).toBe(12);
        expect(date2.minute).toBe(40);
        expect(date2.second).toBe(50);
        expect(date2.millisecond).toBe(0);
        expect(date2.toString()).toBe("2021-11-15T12:40:50.000+01:00");
        expect(date2.zoneName).toBe("Europe/Paris");
    });

    test("Z", () => {
        let date1 = PRIMITIVES.date.tryParse("1985-12-06T19:40:10Z");
        expect(date1.year).toBe(1985);
        expect(date1.month).toBe(12);
        expect(date1.day).toBe(6);
        expect(date1.hour).toBe(19);
        expect(date1.minute).toBe(40);
        expect(date1.second).toBe(10);
        expect(date1.millisecond).toBe(0);
        expect(date1.zoneName).toBe("UTC");

        let date2 = PRIMITIVES.date.tryParse("1985-12-06T19:40:10.123Z");
        expect(date2.zoneName).toBe("UTC");

        // built-in always returns UTC
        let date3 = PRIMITIVES.date.tryParse(new Date().toISOString());
        expect(date3.zoneName).toBe("UTC");
    });
});

test("Parse invalid date", () => expect(EXPRESSION.date.parse("4237-14-73").status).toBeFalsy());

test("Parse Today", () => {
    let date = EXPRESSION.date.tryParse("date(today)") as LiteralExpression;
    expect(Literals.isDate(date.value)).toEqual(true);
    expect(date.value).toEqual(DateTime.local().startOf("day"));
});

// <-- Durations -->

describe("Durations", () => {
    test("6 days", () => {
        let day = PRIMITIVES.duration.tryParse("6 days");
        let day2 = PRIMITIVES.duration.tryParse("6day");

        expect(day).toEqual(day2);
        expect(day).toEqual(Duration.fromObject({ days: 6 }));
    });

    test("4 minutes", () => {
        let min = PRIMITIVES.duration.tryParse("4min");
        let min2 = PRIMITIVES.duration.tryParse("4 minutes");
        let min3 = PRIMITIVES.duration.tryParse("4 minute");

        expect(min).toEqual(min2);
        expect(min).toEqual(min3);
        expect(min).toEqual(Duration.fromObject({ minutes: 4 }));
    });

    test("4 hours 15 minutes", () => {
        let dur = PRIMITIVES.duration.tryParse("4 hr 15 min");
        let dur2 = PRIMITIVES.duration.tryParse("4h15m");
        let dur3 = PRIMITIVES.duration.tryParse("4 hours, 15 minutes");

        expect(dur).toEqual(dur2);
        expect(dur).toEqual(dur3);
        expect(dur).toEqual(Duration.fromObject({ hours: 4, minutes: 15 }));
    });

    test("4 years 6 weeks 9 minutes 3 seconds", () => {
        let dur = PRIMITIVES.duration.tryParse("4 years 6 weeks 9 minutes 3 seconds");
        let dur2 = PRIMITIVES.duration.tryParse("4yr6w9m3s");
        let dur3 = PRIMITIVES.duration.tryParse("4 yrs, 6 wks, 9 mins, 3 s");

        expect(dur).toEqual(dur2);
        expect(dur).toEqual(dur3);
        expect(dur).toEqual(Duration.fromObject({ years: 4, weeks: 6, minutes: 9, seconds: 3 }));
    });
});

// <-- Links -->

describe("Parse Link", () => {
    test("simple", () => expect(pexpr("[[test/Main]]")).toEqual(Expressions.literal(Link.file("test/Main", false))));
    test("extension", () =>
        expect(pexpr("[[test/Main.md]]")).toEqual(Expressions.literal(Link.file("test/Main.md", false))));
    test("number", () => expect(pexpr("[[simple0]]")).toEqual(Expressions.literal(Link.file("simple0", false))));
    test("date", () => expect(pexpr("[[2020-08-15]]")).toEqual(Expressions.literal(Link.file("2020-08-15", false))));
    test("glyphs", () =>
        expect(pexpr("[[%Man & Machine + Mind%]]")).toEqual(
            Expressions.literal(Link.file("%Man & Machine + Mind%", false))
        ));

    test("escaped pipe", () =>
        expect(PRIMITIVES.link.tryParse("[[Hello \\| There]]")).toEqual(Link.file("Hello | There")));
    test("escaped pipe with display", () =>
        expect(PRIMITIVES.link.tryParse("[[\\||Yes]]")).toEqual(Link.file("|", false, "Yes")));
});

test("Parse link with display", () => {
    expect(pexpr("[[test/Main|Yes]]")).toEqual(Expressions.literal(Link.file("test/Main", false, "Yes")));
    expect(pexpr("[[%Man + Machine%|0h no]]")).toEqual(
        Expressions.literal(Link.file("%Man + Machine%", false, "0h no"))
    );
});

test("Parse link with header/block", () => {
    expect(pexpr("[[test/Main#Yes]]")).toEqual(Expressions.literal(Link.header("test/Main", "Yes", false)));
    expect(pexpr("[[2020#^14df]]")).toEqual(Expressions.literal(Link.block("2020", "14df", false)));
});

test("Parse link with header and display", () => {
    expect(pexpr("[[test/Main#what|Yes]]")).toEqual(
        Expressions.literal(Link.header("test/Main", "what", false, "Yes"))
    );
    expect(pexpr("[[%Man + Machine%#^no|0h no]]")).toEqual(
        Expressions.literal(Link.block("%Man + Machine%", "no", false, "0h no"))
    );
});

test("Parse embedded link", () => {
    expect(pexpr("![[hello]]")).toEqual(Expressions.literal(Link.file("hello", true)));
});

// <-- Null ->

test("Parse Null", () => {
    expect(pexpr("null")).toEqual(Expressions.NULL);
    expect(pexpr('"null"')).toEqual(Expressions.literal("null"));
});

// <-- Indexes -->

test("Parse Dot Notation", () => {
    expect(pexpr("Dates.Birthday")).toEqual(
        Expressions.index(Expressions.variable("Dates"), Expressions.literal("Birthday"))
    );
    expect(pexpr("a.b.c3")).toEqual(
        Expressions.index(
            Expressions.index(Expressions.variable("a"), Expressions.literal("b")),
            Expressions.literal("c3")
        )
    );
});

test("Parse Index Notation", () => {
    expect(pexpr("a[0]")).toEqual(Expressions.index(Expressions.variable("a"), Expressions.literal(0)));
    expect(pexpr('"hello"[0]')).toEqual(Expressions.index(Expressions.literal("hello"), Expressions.literal(0)));
    expect(pexpr("hello[brain]")).toEqual(
        Expressions.index(Expressions.variable("hello"), Expressions.variable("brain"))
    );
});

test("Parse Mixed Index/Dot Notation", () => {
    expect(pexpr("a.b[0]")).toEqual(
        Expressions.index(
            Expressions.index(Expressions.variable("a"), Expressions.literal("b")),
            Expressions.literal(0)
        )
    );
    expect(pexpr('"hello".what[yes]')).toEqual(
        Expressions.index(
            Expressions.index(Expressions.literal("hello"), Expressions.literal("what")),
            Expressions.variable("yes")
        )
    );
});

test("Parse negated index", () => {
    expect(pexpr("!a[b]")).toEqual(
        Expressions.negate(Expressions.index(Expressions.variable("a"), Expressions.variable("b")))
    );
    expect(pexpr("!a.b")).toEqual(
        Expressions.negate(Expressions.index(Expressions.variable("a"), Expressions.literal("b")))
    );
});

// <-- Functions -->

test("Parse function with no arguments", () => {
    expect(pexpr("hello()")).toEqual(Expressions.func(Expressions.variable("hello"), []));
    expect(pexpr("lma0()")).toEqual(Expressions.func(Expressions.variable("lma0"), []));
});

test("Parse function with arguments", () => {
    expect(pexpr("list(1, 2, 3)")).toEqual(
        Expressions.func(Expressions.variable("list"), [
            Expressions.literal(1),
            Expressions.literal(2),
            Expressions.literal(3),
        ])
    );
    expect(pexpr('object("a", 1, "b", 2)')).toEqual(
        Expressions.func(Expressions.variable("object"), [
            Expressions.literal("a"),
            Expressions.literal(1),
            Expressions.literal("b"),
            Expressions.literal(2),
        ])
    );
});

test("Parse function with duration", () => {
    expect(pexpr("today() + dur(4hr)")).toEqual(
        Expressions.binaryOp(
            Expressions.func(Expressions.variable("today"), []),
            "+",
            Expressions.literal(Duration.fromObject({ hours: 4 }))
        )
    );
});

test("Parse null duration", () => {
    expect(pexpr("dur(null)")).toEqual(Expressions.func(Expressions.variable("dur"), [Expressions.literal(null)]));
    expect(pexpr('dur("null")')).toEqual(Expressions.func(Expressions.variable("dur"), [Expressions.literal("null")]));
});

test("Parse function with null duration", () => {
    expect(pexpr("today() + dur(null)")).toEqual(
        Expressions.binaryOp(
            Expressions.func(Expressions.variable("today"), []),
            "+",
            Expressions.func(Expressions.variable("dur"), [Expressions.literal(null)])
        )
    );
});

test("Parse date +/- null", () => {
    expect(pexpr("today() + null")).toEqual(
        Expressions.binaryOp(Expressions.func(Expressions.variable("today"), []), "+", Expressions.literal(null))
    );
    expect(pexpr("today() - null")).toEqual(
        Expressions.binaryOp(Expressions.func(Expressions.variable("today"), []), "-", Expressions.literal(null))
    );
});

test("Parse function with mixed dot, index, and function call", () => {
    expect(pexpr("list().parts[0]")).toEqual(
        Expressions.index(
            Expressions.index(Expressions.func(Expressions.variable("list"), []), Expressions.literal("parts")),
            Expressions.literal(0)
        )
    );
});

// <-- Methods -->

describe("Method Calls", () => {
    test("Parse simple method call", () => {
        expect(pexpr("a.b()")).toEqual(Expressions.method(Expressions.variable("a"), "b", []));
    });

    test("Parse method call with arguments", () => {
        expect(pexpr("a.b(1, 2)")).toEqual(
            Expressions.method(Expressions.variable("a"), "b", [Expressions.literal(1), Expressions.literal(2)])
        );
    });

    test("Parse method call on list", () => {
        expect(pexpr("[].first()")).toEqual(Expressions.method(Expressions.list([]), "first", []));
    });
});

// <-- Lambdas -->
describe("Lambda Expressions", () => {
    test("Parse 0-argument constant lambda", () => {
        expect(pexpr("() => 16")).toEqual(Expressions.lambda([], Expressions.literal(16)));
    });

    test("Parse 0-argument binary op lambda", () => {
        expect(pexpr("() => a + 2")).toEqual(
            Expressions.lambda([], Expressions.binaryOp(Expressions.variable("a"), "+", Expressions.literal(2)))
        );
    });

    test("Parse 1-argument lambda", () => {
        expect(pexpr("(v) => v")).toEqual(Expressions.lambda(["v"], Expressions.variable("v")));
    });

    test("Parse 2-argument lambda", () => {
        expect(pexpr("(yes, no) => yes - no")).toEqual(
            Expressions.lambda(
                ["yes", "no"],
                Expressions.binaryOp(Expressions.variable("yes"), "-", Expressions.variable("no"))
            )
        );
    });
});

// <-- Lists -->

describe("Lists", () => {
    test("[]", () => expect(pexpr("[]")).toEqual(Expressions.list([])));
    test("[1]", () => expect(pexpr("[1]")).toEqual(Expressions.list([Expressions.literal(1)])));
    test("[1, 2]", () =>
        expect(pexpr("[1,2]")).toEqual(Expressions.list([Expressions.literal(1), Expressions.literal(2)])));
    test("[1, 2, 3]", () =>
        expect(pexpr("[ 1,  2, 3   ]")).toEqual(
            Expressions.list([Expressions.literal(1), Expressions.literal(2), Expressions.literal(3)])
        ));

    test('["a"]', () => expect(pexpr('["a" ]')).toEqual(Expressions.list([Expressions.literal("a")])));

    test("[[]]", () => expect(pexpr("[ [] ]")).toEqual(Expressions.list([Expressions.list([])])));
});

// <-- Objects -->

describe("Objects", () => {
    test("{}", () => expect(pexpr("{}")).toEqual(Expressions.object({})));
    test("{ a: 1 }", () => expect(pexpr("{ a: 1 }")).toEqual(Expressions.object({ a: Expressions.literal(1) })));
    test('{ "a": 1 }', () => expect(pexpr('{ "a": 1 }')).toEqual(Expressions.object({ a: Expressions.literal(1) })));
    test('{ "yes no": 1 }', () =>
        expect(pexpr('{ "yes no": 1 }')).toEqual(Expressions.object({ "yes no": Expressions.literal(1) })));

    test("{a:1,b:[2]}", () =>
        expect(pexpr("{ a: 1, b: [2] }")).toEqual(
            Expressions.object({ a: Expressions.literal(1), b: Expressions.list([Expressions.literal(2)]) })
        ));
});

// <-- Binary Ops -->

describe("Binary Operators", () => {
    test("Simple Addition", () => {
        let result = EXPRESSION.binaryOp.parse('16 + "what"') as Success<BinaryOpExpression>;
        expect(result.status).toBe(true);
        expect(result.value).toEqual(Expressions.binaryOp(Expressions.literal(16), "+", Expressions.literal("what")));
    });

    test("Simple Division", () => {
        expect(pexpr("14 / 2")).toEqual(Expressions.binaryOp(Expressions.literal(14), "/", Expressions.literal(2)));
        expect(pexpr("31 / 9.0")).toEqual(Expressions.binaryOp(Expressions.literal(31), "/", Expressions.literal(9.0)));
    });

    test("Simple Modulo", () => {
        expect(pexpr("14 % 2")).toEqual(Expressions.binaryOp(Expressions.literal(14), "%", Expressions.literal(2)));
        expect(pexpr("31 % 9.0")).toEqual(Expressions.binaryOp(Expressions.literal(31), "%", Expressions.literal(9.0)));
    });

    test("Multiplication (No Spaces)", () => {
        expect(pexpr("3*a")).toEqual(Expressions.binaryOp(Expressions.literal(3), "*", Expressions.variable("a")));
    });

    test("Parenthesis", () => {
        let result = EXPRESSION.expression.parse("(16 - 4) - 8") as Success<BinaryOpExpression>;
        expect(result.status).toBe(true);
        expect(result.value).toEqual(
            Expressions.binaryOp(
                Expressions.binaryOp(Expressions.literal(16), "-", Expressions.literal(4)),
                "-",
                Expressions.literal(8)
            )
        );
    });

    test("Order of Operations", () => {
        expect(pexpr("14 + 6 >= 19 - 2")).toEqual(
            Expressions.binaryOp(
                Expressions.binaryOp(Expressions.literal(14), "+", Expressions.literal(6)),
                ">=",
                Expressions.binaryOp(Expressions.literal(19), "-", Expressions.literal(2))
            )
        );
    });
});

// <-- Negation -->

test("Parse Negated field", () => {
    expect(pexpr("!true")).toEqual(Expressions.negate(Expressions.literal(true)));
    expect(pexpr("!14")).toEqual(Expressions.negate(Expressions.literal(14)));
    expect(pexpr("!neat(0)")).toEqual(
        Expressions.negate(Expressions.func(Expressions.variable("neat"), [Expressions.literal(0)]))
    );
    expect(pexpr("!!what")).toEqual(Expressions.negate(Expressions.negate(Expressions.variable("what"))));
});

test("Parse binaryop negated field", () => {
    expect(pexpr("!(true & false)")).toEqual(
        Expressions.negate(Expressions.binaryOp(Expressions.literal(true), "&", Expressions.literal(false)))
    );
    expect(pexpr("true & !false")).toEqual(
        Expressions.binaryOp(Expressions.literal(true), "&", Expressions.negate(Expressions.literal(false)))
    );
});

// <-- Stress Tests -->

test("Parse Various Expressions.", () => {
    expect(pexpr('list(a, "b", 3, [[4]])')).toEqual(
        Expressions.func(Expressions.variable("list"), [
            Expressions.variable("a"),
            Expressions.literal("b"),
            Expressions.literal(3),
            Expressions.literal(Link.file("4", false)),
        ])
    );
});

// <-- Utils -->

/** Shorthand for parsing an expression. */
function pexpr(expr: string) {
    return EXPRESSION.expression.tryParse(expr);
}
