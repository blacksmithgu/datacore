/** Core implementation of the query language evaluation engine. */

import { DataObject, Link, Literal, Literals } from "expression/literal";
import { Result } from "api/result";
import { BinaryOpHandler, createBinaryOps } from "./binaryop";
import { Expression, Expressions } from "expression/expression";
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

/** Source of variables which can be referenced in the evaluator. */
export interface Variables {
    /** Render the entire variable store to a key-value map. */
    all(): DataObject;

    /** Resolve a variable by name. */
    resolve(name: string): Literal | undefined;
}

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
    public tryEvaluate(expr: Expression, variables: Variables = Variables.empty()): Literal {
        return this.evaluate(expr, variables).orElseThrow();
    }

    /** Evaluate an arbitrary expression in this context. */
    public evaluate(expr: Expression, variables: Variables = Variables.empty()): Result<Literal, string> {
        switch (expr.type) {
            case "literal":
                return Result.success(expr.value);
            case "variable":
                if (expr.name === Expressions.ROW) return Result.success(variables.all());

                const resolved = variables.resolve(expr.name);
                if (resolved !== undefined) return Result.success(resolved);
                if (expr.name in this.globals) return Result.success(this.globals[expr.name]);

                return Result.success(null);
            case "negated":
                return this.evaluate(expr.child, variables).map((s) => !Literals.isTruthy(s));
            case "binaryop":
                return Result.flatMap2(
                    this.evaluate(expr.left, variables),
                    this.evaluate(expr.right, variables),
                    (a, b) => this.binaryOps.evaluate(expr.op, a, b, this)
                );
            case "list":
                let result = [];
                for (let child of expr.values) {
                    let subeval = this.evaluate(child, variables);
                    if (!subeval.successful) return subeval;
                    result.push(subeval.value);
                }
                return Result.success(result);
            case "object":
                let objResult: DataObject = {};
                for (let [key, child] of Object.entries(expr.values)) {
                    let subeval = this.evaluate(child, variables);
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

                    return ctx.evaluate(expr.value, Variables.lambda(variables, locals)).orElseThrow();
                });
            case "function":
                let rawFunc =
                    expr.func.type == "variable"
                        ? Result.success<string, string>(expr.func.name)
                        : this.evaluate(expr.func, variables);
                if (!rawFunc.successful) return rawFunc;
                let func = rawFunc.value;

                let args: Literal[] = [];
                for (let arg of expr.arguments) {
                    let resolved = this.evaluate(arg, variables);
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

/** Get variables from a plain object. */
export class ObjectVariables implements Variables {
    public constructor(public object: DataObject) {}

    public all(): DataObject {
        return this.object;
    }

    public resolve(name: string): Literal | undefined {
        return this.object[name];
    }
}

/** Get variables from a field-bearing object (which supports case insensitivity). */
export class FieldbearingVariables implements Variables {
    public constructor(public object: Fieldbearing) {}

    public all(): DataObject {
        const object: DataObject = {};
        for (const field of this.object.fields) {
            object[field.key] = field.value;
        }

        return object;
    }

    public resolve(name: string): Literal | undefined {
        return this.object.field(name)?.value;
    }
}

/** Delegate to local context first, then to parent context if not available. */
export class LambdaVariables implements Variables {
    public constructor(public parent: Variables, public locals: Record<string, Literal>) {}

    public all(): DataObject {
        return { ...this.parent.all(), ...this.locals };
    }

    public resolve(name: string): Literal | undefined {
        return this.locals[name] ?? this.parent.resolve(name);
    }
}

/** Default utility functions for making variable stores. */
export namespace Variables {
    export function empty() {
        return new ObjectVariables({});
    }

    export function infer(object: any): Variables {
        if (Fieldbearings.isFieldbearing(object)) {
            return new FieldbearingVariables(object);
        } else {
            return new ObjectVariables(object);
        }
    }

    export function lambda(parent: Variables, locals: Record<string, Literal>): Variables {
        return new LambdaVariables(parent, locals);
    }
}
