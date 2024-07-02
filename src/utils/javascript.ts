//! Utilities for running javascript.

import { transform } from "sucrase";

export type ScriptLanguage = "js" | "ts" | "jsx" | "tsx";

/** Converts a raw script in the given language to plain javascript.  */
export function transpile(script: string, language: ScriptLanguage): string {
    switch (language) {
        case "js":
            return script;
        case "jsx":
            return transform(script, { transforms: ["jsx"], jsxPragma: "h", jsxFragmentPragma: "Fragment" }).code;
        case "ts":
            return transform(script, { transforms: ["typescript"] }).code;
        case "tsx":
            return transform(script, {
                transforms: ["typescript", "jsx"],
                jsxPragma: "h",
                jsxFragmentPragma: "Fragment",
            }).code;
    }
}

/**
 * Evaluate a script where 'this' for the script is set to the given context. Allows you to define global variables.
 */
export function evalInContext(script: string, variables: Record<string, any>): any {
    const pairs = Object.entries(variables);
    const keys = pairs.map(([key, _]) => key);
    const values = pairs.map(([_, value]) => value);

    return new Function(...keys, script)(...values);
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: string, variables: Record<string, any>): Promise<any> {
    if (script.includes("await")) {
        return evalInContext("return (async () => { " + script + " })()", variables) as Promise<any>;
    } else {
        return Promise.resolve(evalInContext(script, variables));
    }
}
