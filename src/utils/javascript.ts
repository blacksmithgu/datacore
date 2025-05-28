//! Utilities for running javascript.

import { DatacoreLocalApi } from "api/local-api";
import { normalizePath, TFile } from "obsidian";
import { transform } from "sucrase";

import path from "path-browserify";

export type ScriptLanguage = "js" | "ts" | "jsx" | "tsx";

export interface ScriptDefinition {
    /** The file that the script source has been loaded from */
    scriptFile: TFile;
    /** The script source code */
    scriptSource: string;
    /** The script language */
    scriptLanguage: ScriptLanguage;
}

export function defaultScriptLoadingContext(api: DatacoreLocalApi): Record<string, any> {
    return {
        dc: api,
        h: api.preact.h,
        Fragment: api.preact.Fragment,
        exports: {},
    };
}

export function newScriptLoadingContextWith(api: DatacoreLocalApi, other: Record<string, any>): Record<string, any> {
    return { ...defaultScriptLoadingContext(api), ...other };
}

/** Converts a raw script in the given language to plain javascript.  */
export function transpile(script: ScriptDefinition): ScriptDefinition {
    const transpiled = { ...script };

    switch (script.scriptLanguage) {
        case "js":
            transpiled.scriptSource = transform(script.scriptSource, { transforms: ["imports"] }).code;
        case "jsx":
            transpiled.scriptSource = transform(script.scriptSource, {
                transforms: ["jsx", "imports"],
                jsxPragma: "h",
                jsxFragmentPragma: "Fragment",
            }).code;
        case "ts":
            transpiled.scriptSource = transform(script.scriptSource, { transforms: ["typescript", "imports"] }).code;
        case "tsx":
            transpiled.scriptSource = transform(script.scriptSource, {
                transforms: ["typescript", "jsx", "imports"],
                jsxPragma: "h",
                jsxFragmentPragma: "Fragment",
            }).code;
    }

    return transpiled;
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

function resolveRelativeRequires(script: string, scriptFile: TFile): string {
    const requireMatches = script.matchAll(/=\s*require\(([^\)]+)\)/gm);
    for (const match of requireMatches) {
        const requireTargetRaw = match[1];
        const requireTarget = requireTargetRaw.replace(/'/gm, "").replace(/"/gm, "").replace(/^\//, "");
        const regexEscapedRequire = requireTargetRaw.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");
        const regExp = new RegExp(`=\\s*require\\(${regexEscapedRequire}\\)`, "gm");

        var resolvedRequireTarget = requireTarget;
        if (/^[\.]*\//gm.test(requireTarget)) {
            resolvedRequireTarget = normalizePath(path.join(scriptFile.parent!.path, requireTarget));
        }
        script = script.replace(regExp, `= await dc.require("${resolvedRequireTarget}")`);
    }
    return script;
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 */
export async function asyncEvalInContext(script: ScriptDefinition, variables: Record<string, any>): Promise<any> {
    var { scriptSource, scriptFile } = script;
    if (/=\s*require\(/gm.test(scriptSource)) {
        scriptSource = resolveRelativeRequires(scriptSource, scriptFile);
    }

    if (scriptSource.includes("await")) {
        return evalInContext("return (async () => { " + scriptSource + " })()", variables) as Promise<any>;
    } else {
        return Promise.resolve(evalInContext(scriptSource, variables));
    }
}
