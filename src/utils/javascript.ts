//! Utilities for running javascript.

import { transform } from "sucrase";

export type ScriptLanguage = "js" | "ts" | "jsx" | "tsx";

/** Converts a raw script in the given language to plain javascript.  */
export async function transpile(path: string, script: string, language: ScriptLanguage): Promise<string> {
	let preTransformed = script;
	if(window.app.plugins.plugins["datacore-addon-transform-js"]) {
		preTransformed = await window.app.plugins.plugins["datacore-addon-transform-js"].preTransform(path, script,["jsx", "tsx"].includes(language), language.startsWith("ts"));
	}
    switch (language) {
        case "js":
            return preTransformed;
        case "jsx":
            return transform(preTransformed, { filePath: path, transforms: ["jsx"], jsxPragma: "h", jsxFragmentPragma: "Fragment" }).code;
        case "ts":
            return transform(preTransformed, { filePath: path, transforms: ["typescript"] }).code;
        case "tsx":
            return transform(preTransformed, {
							filePath: path,
                transforms: ["typescript", "jsx"],
                jsxPragma: "h",
                jsxFragmentPragma: "Fragment",
            }).code;
    }
}

/**
 * Evaluate a script where 'this' for the script is set to the given context. Allows you to define global variables.
 */
export function evalInContext(script: string, variables: Record<string, unknown>): unknown {
    const pairs = Object.entries(variables);
    const keys = pairs.map(([key, _]) => key);
    const values = pairs.map(([_, value]) => value);

    return new Function(...keys, script)(...values);
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: string, variables: Record<string, unknown>): Promise<unknown> {
    if (script.includes("await")) {
        return evalInContext("return (async () => { " + script + " })()", variables) as Promise<unknown>;
    } else {
        return Promise.resolve(evalInContext(script, variables));
    }
}
