import { Literal, Literals } from "expression/literal";
import { Filters } from "./filters";

/** Comparison operators which yield true/false. */
export type CompareOp = ">" | ">=" | "<=" | "<" | "=" | "!=";
/** Arithmetic operators which yield numbers and other values. */
export type ArithmeticOp = "+" | "-" | "*" | "/" | "%" | "&" | "|";
/** Index a value into another value. */
export type LogicalOp = "index";
/** All valid binary operators. */
export type BinaryOp = CompareOp | ArithmeticOp | LogicalOp;

export type Expression =
    | LiteralExpression
    | VariableExpression
    | ListExpression
    | ObjectExpression
    | BinaryOpExpression
    | FunctionExpression
    | LambdaExpression
    | NegatedExpression;

/** Literal representation of some field type. */
export interface LiteralExpression {
    type: "literal";
    value: Literal;
}

/** A variable field for a variable with a given name. */
export interface VariableExpression {
    type: "variable";
    name: string;
}

/** A list literal, which is an ordered collection of fields. */
export interface ListExpression {
    type: "list";
    values: Expression[];
}

/** An object literal, which is a mapping of name to field. */
export interface ObjectExpression {
    type: "object";
    values: Record<string, Expression>;
}

/** A binary operator expression which combines two subnodes somehow. */
export interface BinaryOpExpression {
    type: "binaryop";
    left: Expression;
    right: Expression;
    op: BinaryOp;
}

/** A function expression which calls a function on 0 or more arguments. */
export interface FunctionExpression {
    type: "function";
    /** Either the name of the function being called or a Function object. */
    func: Expression;
    /** The list of arguments being passed to the function. */
    arguments: Expression[];
}

/** An inline function accepting one or more arguments and producing a value. */
export interface LambdaExpression {
    type: "lambda";
    /** An ordered list of named arguments. */
    arguments: string[];
    /** The field which will be evaluated using the arguments in context. */
    value: Expression;
}

/** An expression which negates the value of the original field. */
export interface NegatedExpression {
    type: "negated";

    /** The child field to negate. */
    child: Expression;
}

export namespace Expressions {
    /** The implicit field referencing the current field. */
    export const ROW: string = "$row";

    export function variable(name: string): VariableExpression {
        return { type: "variable", name };
    }

    export function literal(value: Literal): LiteralExpression {
        return { type: "literal", value };
    }

    export function binaryOp(left: Expression, op: BinaryOp, right: Expression): Expression {
        return { type: "binaryop", left, op, right } as BinaryOpExpression;
    }

    export function index(obj: Expression, index: Expression): Expression {
        return { type: "binaryop", left: obj, right: index, op: "index" };
    }

    /** Converts a string in dot-notation-format into a variable which indexes. */
    export function indexVariable(name: string): Expression {
        let parts = name.split(".");
        let result: Expression = Expressions.variable(parts[0]);
        for (let index = 1; index < parts.length; index++) {
            result = Expressions.index(result, Expressions.literal(parts[index]));
        }

        return result;
    }

    export function lambda(args: string[], value: Expression): LambdaExpression {
        return { type: "lambda", arguments: args, value };
    }

    export function func(func: Expression, args: Expression[]): FunctionExpression {
        return { type: "function", func, arguments: args };
    }

    export function list(values: Expression[]): ListExpression {
        return { type: "list", values };
    }

    export function object(values: Record<string, Expression>): ObjectExpression {
        return { type: "object", values };
    }

    export function negate(child: Expression): NegatedExpression {
        return { type: "negated", child };
    }

    export function isCompareOp(op: BinaryOp): op is CompareOp {
        return op == "<=" || op == "<" || op == ">" || op == ">=" || op == "!=" || op == "=";
    }

    /** Returns a set of all unbound variables (i.e., variables not provided by `row`, lambdas, or similar.) */
    export function unboundVariables(expr: Expression, bound: Set<string> = new Set([ROW])): Set<string> {
        switch (expr.type) {
            case "binaryop":
                // Special case `row["...."]`.
                if (
                    expr.op === "index" &&
                    expr.left.type == "variable" &&
                    expr.left.name == ROW &&
                    expr.right.type == "literal" &&
                    Literals.isString(expr.right.value)
                ) {
                    if (bound.has(expr.right.value)) return new Set();
                    else return new Set([expr.right.value]);
                }

                // Otherwise just check left and right.
                return Filters.setUnion([unboundVariables(expr.left, bound), unboundVariables(expr.right, bound)]);
            case "function":
                return Filters.setUnion(expr.arguments.map((a) => unboundVariables(a, bound)));
            case "lambda":
                const newBound = bound ?? new Set();
                for (const arg of expr.arguments) newBound.add(arg);

                return unboundVariables(expr.value, newBound);
            case "list":
                return Filters.setUnion(expr.values.map((v) => unboundVariables(v, bound)));
            case "negated":
                return unboundVariables(expr.child, bound);
            case "object":
                return Filters.setUnion(Object.values(expr.values).map((v) => unboundVariables(v, bound)));
            case "variable":
                if (bound && bound.has(expr.name)) return new Set();
                else return new Set([expr.name]);
            case "literal":
                return new Set();
        }
    }

    /** Render an expression as a string. */
    export function toString(expr: Expression): string {
        switch (expr.type) {
            case "binaryop":
                if (expr.op === "index") {
                    return `${toString(expr.left)}[${toString(expr.right)}]`;
                }

                return `${toString(expr.left)} ${expr.op} ${toString(expr.right)}`;
            case "function":
                return `${toString(expr.func)}(${expr.arguments.map(toString).join(", ")})`;
            case "lambda":
                return `(${expr.arguments.join(", ")}) => ${toString(expr.value)}`;
            case "list":
                return `[${expr.values.map(toString).join(", ")}]`;
            case "negated":
                return `!${toString(expr.child)}`;
            case "object":
                return `{${Object.entries(expr.values)
                    .map(([k, v]) => `${k}: ${toString(v)}`)
                    .join(", ")}}`;
            case "variable":
                return expr.name;
            case "literal":
                const wrapped = Literals.wrapValue(expr.value);
                if (!wrapped) return "null";
                switch (wrapped.type) {
                    case "string":
                        return `"${wrapped.value}"`;
                    default:
                        return Literals.toString(wrapped.value);
                }
        }
    }

    export const NULL = Expressions.literal(null);
}
