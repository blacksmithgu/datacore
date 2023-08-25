import { Literal } from "expression/literal";

/** Comparison operators which yield true/false. */
export type CompareOp = ">" | ">=" | "<=" | "<" | "=" | "!=";
/** Arithmetic operators which yield numbers and other values. */
export type ArithmeticOp = "+" | "-" | "*" | "/" | "%" | "&" | "|";
/** All valid binary operators. */
export type BinaryOp = CompareOp | ArithmeticOp;

export type Expression =
    | LiteralExpression
    | VariableExpression
    | ListExpression
    | ObjectExpression
    | BinaryOpExpression
    | FunctionExpression
    | LambdaExpression
    | IndexExpression
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

/** An expresion which indexes a variable into another variable. */
export interface IndexExpression {
    type: "index";
    /** The object, array, or other object being indexed into. */
    object: Expression;
    /** The index to use to index into the object. */
    index: Expression;
}

/** An expression which negates the value of the original field. */
export interface NegatedExpression {
    type: "negated";

    /** The child field to negate. */
    child: Expression;
}

export namespace Expressions {
    export function variable(name: string): VariableExpression {
        return { type: "variable", name };
    }

    export function literal(value: Literal): LiteralExpression {
        return { type: "literal", value };
    }

    export function binaryOp(left: Expression, op: BinaryOp, right: Expression): Expression {
        return { type: "binaryop", left, op, right } as BinaryOpExpression;
    }

    export function index(obj: Expression, index: Expression): IndexExpression {
        return { type: "index", object: obj, index };
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

    export const NULL = Expressions.literal(null);
}
