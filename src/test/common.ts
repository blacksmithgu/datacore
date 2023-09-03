import { Literal } from "expression/literal";
import { Evaluator, LinkHandler } from "expression/evaluator";
import { EXPRESSION } from "expression/parser";
import { DEFAULT_SETTINGS } from "settings";

/** Expect that the given dataview expression resolves to the given value. */
export function expectEvals(text: string, result: Literal) {
    expect(parseEval(text)).toEqual(result);
}

/** Parse a field expression and evaluate it in the simple context. */
export function parseEval(text: string): Literal {
    let field = EXPRESSION.expression.tryParse(text);
    return simpleEvaluator().tryEvaluate(field);
}

/** Create a trivial link handler which never resolves links. */
export function simpleLinkHandler(): LinkHandler {
    return {
        resolve: (path) => null,
        normalize: (path) => path,
        exists: (path) => true,
    };
}

/** Create a trivial context good for evaluations that do not depend on links. */
export function simpleEvaluator(): Evaluator {
    return new Evaluator(simpleLinkHandler(), DEFAULT_SETTINGS);
}
