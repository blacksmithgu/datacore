import { Link } from "expression/link";
import { Datastore } from "index/datastore";
import { Result } from "./result";
import { MarkdownCodeblock, MarkdownSection } from "index/types/markdown";
import { Deferred, deferred } from "utils/deferred";
import {
    ScriptDefinition,
    ScriptLanguage,
    asyncEvalInContext,
    defaultScriptLoadingContext,
    transpile,
} from "utils/javascript";
import { lineRange } from "utils/normalizers";
import { normalizePath, TFile } from "obsidian";
import { DatacoreLocalApi } from "./local-api";

/** A script that is currently being loaded. */
export interface LoadingScript {
    type: "loading";

    path: string;
    promise: Deferred<Result<any, string>>;
}

/** A script that has successfully loaded. */
export interface LoadedScript {
    type: "loaded";

    path: string;
    object: any;
}

export type DatacoreScript = LoadingScript | LoadedScript;

/** A simple caching script loader that can load any DAG of script dependencies. */
export class ScriptCache {
    /** All of the tags we recognize for scripts. */
    private static SCRIPT_LANGUAGES: Record<string, ScriptLanguage> = {
        js: "js",
        javascript: "js",
        datacorejs: "js",
        typescript: "ts",
        ts: "ts",
        datacorets: "ts",
        jsx: "jsx",
        datacorejsx: "jsx",
        tsx: "tsx",
        datacoretsx: "tsx",
    };

    /** All of the direct file extensions we can load. */
    private static FILE_EXTENSIONS: Record<string, ScriptLanguage> = {
        tsx: "tsx",
        jsx: "jsx",
        js: "js",
        ts: "ts",
    };

    /** Caches scripts by fully qualified path. */
    public scripts: Map<string, DatacoreScript> = new Map<string, DatacoreScript>();

    public constructor(private store: Datastore) {}

    /** Load the given script at the given path, recursively loading any subscripts as well.  */
    public async load(path: string | Link, api: DatacoreLocalApi): Promise<Result<any, string>> {
        // First, attempt to resolve the script against the script roots so we cache a canonical script path as the key.
        var linkToLoad = undefined;
        const roots = ["", ...api.core.settings.scriptRoots];
        for (var i = 0; i < roots.length; i++) {
            linkToLoad = this.store.tryNormalizeLink(path, normalizePath(roots[i]));
            if (linkToLoad) {
                break;
            }
        }

        const resolvedPath = linkToLoad ?? path;

        // Always check the cache first.
        const key = this.pathkey(resolvedPath);
        const currentScript = this.scripts.get(key);
        if (currentScript) {
            if (currentScript.type === "loaded") {
                return Result.success(currentScript.object);
            }

            // TODO: If we try to load an already-loading script, we are almost certainly doing something
            // weird. Either the caller is not `await`-ing the load and loading multiple times, OR
            // we are in a `require()` loop. Either way, we'll error out for now since we can't handle
            // either case currently.
            return Result.failure(
                `Failed to import script "${resolvedPath.toString()}", as it is in the middle of being loaded. Do you have
                 a circular dependency in your require() calls? The currently loaded or loading scripts are:
                 ${Array.from(this.scripts.values())
                     .map((sc) => "\t" + sc.path)
                     .join("\n")}`
            );
        }

        // Cache has missed, so add ourselves to the cache and try and load it directly.
        const deferral = deferred<Result<any, string>>();
        this.scripts.set(key, { type: "loading", promise: deferral, path: key });

        const result = await this.loadUncached(resolvedPath, api);
        deferral.resolve(result);

        if (result.successful) {
            this.scripts.set(key, { type: "loaded", path: key, object: result.value });
        } else {
            this.scripts.delete(key);
        }

        return result;
    }

    /** Load a script, directly bypassing the cache. */
    private async loadUncached(scriptPath: string | Link, api: DatacoreLocalApi): Promise<Result<any, string>> {
        var maybeSource = await this.resolveSource(scriptPath);
        if (!maybeSource.successful) return maybeSource;

        // Transpile to vanilla javascript first...
        const scriptDefinition = maybeSource.value;
        let basic;
        try {
            basic = transpile(scriptDefinition);
        } catch (error) {
            return Result.failure(
                `Failed to import ${scriptPath.toString()} while transpiling from ${
                    scriptDefinition.scriptLanguage
                }: ${error}`
            );
        }

        // Then finally execute the script to 'load' it.
        const scriptContext = defaultScriptLoadingContext(api);
        try {
            const loadRet = (await asyncEvalInContext(basic, scriptContext)) ?? scriptContext.exports;
            return Result.success(loadRet);
        } catch (error) {
            return Result.failure(`Failed to execute script '${scriptPath.toString()}': ${error}`);
        }
    }

    /** Normalize a path or link to a textual path. */
    private pathkey(path: string | Link): string {
        if (path instanceof Link) return path.obsidianLink();
        else return path;
    }

    /** Attempts to resolve the source to load given a path or link to a markdown section. */
    private async resolveSource(path: string | Link, sourcePath?: string): Promise<Result<ScriptDefinition, string>> {
        const object = this.store.resolveLink(path, sourcePath);
        if (!object) return Result.failure("Could not find a script at the given path: " + path.toString());

        const tfile = this.store.vault.getFileByPath(object.$file!);
        if (!tfile) return Result.failure(`File "${object.$file}" not found.`);

        // Check if this is a JS file we should load directly.
        if (tfile.extension.toLocaleLowerCase() in ScriptCache.FILE_EXTENSIONS) {
            const language = ScriptCache.FILE_EXTENSIONS[tfile.extension.toLocaleLowerCase()];

            try {
                const code = await this.store.vault.cachedRead(tfile);
                return Result.success({ scriptFile: tfile, scriptLanguage: language, scriptSource: code });
            } catch (error) {
                return Result.failure("Failed to load javascript/typescript source file: " + error);
            }
        }

        // If the object is a markdown section, search for any javascript codeblocks; otherwise, check if it is a full script file.
        if (object instanceof MarkdownSection) {
            const maybeBlock = object.$blocks
                .filter((b): b is MarkdownCodeblock => b.$type === "codeblock")
                .find((cb) =>
                    cb.$languages.some((language) => language.toLocaleLowerCase() in ScriptCache.SCRIPT_LANGUAGES)
                );

            if (!maybeBlock)
                return Result.failure("Could not find a script in the given markdown section: " + path.toString());

            const language =
                ScriptCache.SCRIPT_LANGUAGES[
                    maybeBlock.$languages.find((lang) => lang.toLocaleLowerCase() in ScriptCache.SCRIPT_LANGUAGES)!
                ];
            return (await this.readCodeblock(tfile, maybeBlock)).map((code) => ({
                scriptFile: tfile,
                scriptSource: code,
                scriptLanguage: language,
            }));
        } else if (object instanceof MarkdownCodeblock) {
            const maybeLanguage = object.$languages.find(
                (lang) => lang.toLocaleLowerCase() in ScriptCache.SCRIPT_LANGUAGES
            );
            if (!maybeLanguage)
                return Result.failure(`The codeblock referenced by '${path}' is not a JS/TS codeblock.`);

            const language = ScriptCache.SCRIPT_LANGUAGES[maybeLanguage];
            return (await this.readCodeblock(tfile, object)).map((code) => ({
                scriptFile: tfile,
                scriptSource: code,
                scriptLanguage: language,
            }));
        }

        return Result.failure(`Cannot import '${path.toString()}: not a JS/TS file or codeblock reference.`);
    }

    /** Read the contents of a codeblock from a file. */
    private async readCodeblock(file: TFile, block: MarkdownCodeblock): Promise<Result<string, string>> {
        try {
            const raw = lineRange(
                await this.store.vault.cachedRead(file),
                block.$contentPosition.start,
                block.$contentPosition.end
            );

            if (block.$style === "fenced") return Result.success(raw);
            else
                return Result.success(
                    raw
                        .split("\n")
                        .map((line) => line.trimStart())
                        .join("\n")
                );
        } catch (error) {
            return Result.failure(`Failed to read a codeblock from ${file.path}: ${error}`);
        }
    }
}
