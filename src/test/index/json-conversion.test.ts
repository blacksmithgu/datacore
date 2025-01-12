import { Link } from "expression/link";
import { Literal } from "expression/literal";
import { JsonConversion } from "index/types/json/common";
import { DateTime, Duration } from "luxon";

describe("Literals", () => {
    test("String", () => checkRoundTrip("hello"));
    test("Number", () => checkRoundTrip(18));
    test("Boolean", () => checkRoundTrip(true));
    test("Null", () => checkRoundTrip(null));
});

test("Date", () => expect(roundTrip(DateTime.fromObject({ year: 1982, month: 5, day: 25 })).day).toEqual(25));
test("Date Timezone", () => {
    const date = DateTime.fromObject({ year: 1941, month: 6, day: 5 }, { zone: "UTC-8" });
    expect(roundTrip(date)).toEqual(date);
});

test("Duration", () => expect(roundTrip(Duration.fromMillis(10000)).toMillis()).toEqual(10000));
test("Link", () => expect(roundTrip(Link.file("hello"))).toEqual(Link.file("hello")));

test("Full Date", () => {
    let date = DateTime.fromObject({ year: 1982, month: 5, day: 19 }, { zone: "UTC+8" });
    expect(roundTrip(date)).toEqual(date);
});

/** Run a value through the transferable converter and back again. */
function roundTrip<T extends Literal>(value: T): T {
    return JsonConversion.value(JsonConversion.json(value)) as T;
}

function checkRoundTrip(value: any) {
    expect(roundTrip(value)).toEqual(value);
}
