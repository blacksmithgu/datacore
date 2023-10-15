/** Core implementation of the query language evaluation engine. */

import { DataObject, Link, Literal, Literals } from "expression/literal";
import { Result } from "api/result";
import { BinaryOpHandler, createBinaryOps } from "./binaryop";
import { Expression } from "expression/expression";
import { DEFAULT_FUNCTIONS, FunctionImpl } from "./functions";
import { Settings } from "settings";
import { Fieldbearing, Fieldbearings } from "./field";

/** Handles link resolution and normalization inside of a context. */
export interface LinkHandler {
    /** Resolve a link to the metadata it contains. */
    resolve(path: string | Link): DataObject | null;
    /**
     * Normalize a link to it's fully-qualified path for comparison purposes.
     * If the path does not exist, returns it unchanged.
     */
    normalize(path: string): string;
    /** Return true if the given path actually exists, false otherwise. */
    exists(path: string): boolean;
}

/** Any object which provides variables to the evaluator. */
export type MaybeArray<T> = T | T[];
export type ObjectOrFieldbearing = MaybeArray<Fieldbearing | Record<string, Literal>>;

/**
 * Evaluation context that expressions can be evaluated in. Includes global state, as well as available functions and a handler
 * for binary operators.
 */
export class Evaluator {
    /**
     * Create a new context with the given namespace of globals, as well as optionally with custom binary operator, function,
     * and link handlers.
     */
    public constructor(
        public linkHandler: LinkHandler,
        public settings: Settings,
        public globals: Record<string, Literal> = {},
        public binaryOps: BinaryOpHandler = createBinaryOps(linkHandler.normalize),
        public functions: Record<string, FunctionImpl> = DEFAULT_FUNCTIONS
    ) {}

    /** Set a global value in this context. */
    public set(name: string, value: Literal): Evaluator {
        this.globals[name] = value;
        return this;
    }

    /** Get the value of a global variable by name. Returns null if not present. */
    public get(name: string): Literal {
        return this.globals[name] ?? null;
    }

    /** Try to evaluate an arbitrary expression in this context, raising an exception on failure. */
    public tryEvaluate(expr: Expression, data: ObjectOrFieldbearing = {}): Literal {
        return this.evaluate(expr, data).orElseThrow();
    }

    /** Evaluate an arbitrary expression in this context. */
    public evaluate(expr: Expression, data: ObjectOrFieldbearing = {}): Result<Literal, string> {
        switch (expr.type) {
            case "literal":
                return Result.success(expr.value);
            case "variable":
                if (expr.name === "row") return Result.success(data);

                // Look through all of the "stack frames".
                for (const obj of Array.isArray(data) ? data : [data]) {
                    const local = Fieldbearings.get(obj, expr.name);
                    if (local !== undefined) return Result.success(local);
                }

                if (expr.name in this.globals) return Result.success(this.globals[expr.name]);

                return Result.success(null);
            case "negated":
                return this.evaluate(expr.child, data).map((s) => !Literals.isTruthy(s));
            case "binaryop":
                return Result.flatMap2(this.evaluate(expr.left, data), this.evaluate(expr.right, data), (a, b) =>
                    this.binaryOps.evaluate(expr.op, a, b, this)
                );
            case "list":
                let result = [];
                for (let child of expr.values) {
                    let subeval = this.evaluate(child, data);
                    if (!subeval.successful) return subeval;
                    result.push(subeval.value);
                }
                return Result.success(result);
            case "object":
                let objResult: DataObject = {};
                for (let [key, child] of Object.entries(expr.values)) {
                    let subeval = this.evaluate(child, data);
                    if (!subeval.successful) return subeval;
                    objResult[key] = subeval.value;
                }
                return Result.success(objResult);
            case "lambda":
                // Just relying on JS to capture 'data' for us implicitly; unsure
                // if this is correct thing to do. Could cause weird behaviors.
                return Result.success((ctx: Evaluator, ...args: Literal[]) => {
                    let locals: Record<string, Literal> = {};
                    for (let arg = 0; arg < Math.min(args.length, expr.arguments.length); arg++) {
                        locals[expr.arguments[arg]] = args[arg];
                    }

                    // Put locals first since they should supercede parent data (i.e., shadow parent variables).
                    const newData = Array.isArray(data) ? [locals, ...data] : [locals, data];
                    return ctx.evaluate(expr.value, newData).orElseThrow();
                });
            case "function":
                let rawFunc =
                    expr.func.type == "variable"
                        ? Result.success<string, string>(expr.func.name)
                        : this.evaluate(expr.func, data);
                if (!rawFunc.successful) return rawFunc;
                let func = rawFunc.value;

                let args: Literal[] = [];
                for (let arg of expr.arguments) {
                    let resolved = this.evaluate(arg, data);
                    if (!resolved.successful) return resolved;
                    args.push(resolved.value);
                }

                let call: FunctionImpl;
                if (Literals.isFunction(func)) call = func as FunctionImpl;
                else if (Literals.isString(func) && func in this.functions) call = this.functions[func];
                else if (Literals.isString(func)) return Result.failure(`Unrecognized function name '${func}'`);
                else return Result.failure(`Cannot call type '${Literals.typeOf(func)}' as a function`);

                try {
                    return Result.success(call(this, ...args));
                } catch (e) {
                    return Result.failure(e.message);
                }
        }
    }
}
