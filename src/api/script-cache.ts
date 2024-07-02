import { Link } from "expression/link";
import { Datastore } from "index/datastore";
import { Failure, Result } from "./result";
import { MarkdownCodeblock, MarkdownSection } from "index/types/markdown";
import { DatacoreJSRenderer, ScriptLanguage, asyncEvalInContext, convert } from "ui/javascript";
import { DatacoreLocalApi } from "./local-api";
import { Fragment, h } from "preact";
import { Deferred, deferred } from "utils/deferred";
export interface DatacoreScript {
    language: ScriptLanguage;
    id: string;
    state: LoadingState;
    source: string;
    promise: Deferred<Result<any, string>>;
}
export const enum LoadingState {
    UNDEFINED = -1,
    LOADING,
    LOADED,
}
/** A simple caching script loader that can load any DAG of script dependencies. */
export class ScriptCache {
    /** A static placeholder placed into the `scripts` section to catch recursive loading loops. */
    private static readonly LOADING_SENTINEL: unique symbol = Symbol("CURRENTLY_LOADING");
    private static SCRIPT_TAGS: string[] = ["javascript", "typescript", "ts", "js", "tsx", "jsx"];

    public constructor(private store: Datastore) {}
    /**
     * Load the given script at the given path, recursively loading any subscripts by correctly injecting `import` into the child contexts.
     */
    public loadedScripts: Map<string, DatacoreScript> = new Map<string, DatacoreScript>();
    public async load(
        path: string | Link,
        parentContext: DatacoreLocalApi,
        sourcePath?: string
    ): Promise<Result<any, string>> {
        const source = await this.resolveSource(path, sourcePath);
        if (!source.successful) return source;

        const {
            value: { scriptInfo, code },
        } = source;
        scriptInfo.state = LoadingState.LOADING;
        if (!this.loadedScripts.has(scriptInfo.source)) {
            this.loadedScripts.set(scriptInfo.source, scriptInfo);
            let dc = new DatacoreLocalApi(parentContext.api, scriptInfo.source);
            dc.scriptCache = this;
            const res = await asyncEvalInContext(code, {
                h,
                Fragment,
                dc,
            });
            scriptInfo.state = LoadingState.LOADED;
            scriptInfo.promise.resolve(Result.success(res));
            this.loadedScripts.set(scriptInfo.source, scriptInfo);
        }
        let element = this.loadedScripts.get(scriptInfo.source);
        if (element?.state === LoadingState.LOADING) {
            let res: Failure<any, string> = Result.failure(
                `Script import cycle detected; currently loaded scripts are:\n${[...this.loadedScripts.values()]
                    .map((x) => `		- ${x.source}`)
                    .join("\n")}`
            ) as Failure<any, string>;
            scriptInfo.promise.reject(res.error);
            return res;
        }
        return element!.promise;
    }

    /** Attempts to resolve the source to load given a path or link to a markdown section. */
    private async resolveSource(
        path: string | Link,
        sourcePath?: string
    ): Promise<Result<{ code: string; scriptInfo: DatacoreScript }, string>> {
        const object = this.store.resolveLink(path);
        const prefixRegex = /datacore\s?/i;
        if (!object) return Result.failure("Could not find a script at the given path: " + path.toString());

        const tfile = this.store.vault.getFileByPath(object.$file!);
        if (!tfile) return Result.failure(`File "${object.$file}" not found`);

        let codeBlock: MarkdownCodeblock | null | undefined;
        // If the object is a markdown section, search for any javascript codeblocks; otherwise, check if it is a full script file.
        if (object instanceof MarkdownSection) {
            codeBlock = object.$blocks
                .filter((b): b is MarkdownCodeblock => b.$type === "codeblock")
                .find((cb) =>
                    cb.$languages.some((language) =>
                        ScriptCache.SCRIPT_TAGS.includes(language.replace(prefixRegex, ""))
                    )
                );

            // Load the script.
        } else if (object instanceof MarkdownCodeblock) {
            if (object.$languages.some((x) => ScriptCache.SCRIPT_TAGS.includes(x.replace(prefixRegex, ""))))
                codeBlock = object;
        }

        if (!codeBlock)
            return Result.failure("Could not find a script in the given markdown section: " + path.toString());

        let lang = codeBlock.$languages
            .find((a) => ScriptCache.SCRIPT_TAGS.includes(a.replace(prefixRegex, "")))!
            .replace(prefixRegex, "");
        if (lang?.toLocaleLowerCase() === "typescript") lang = "ts";
        else if (lang?.toLocaleLowerCase() === "javascript") lang = "js";

        const rawCode = (await this.store.vault.read(tfile))
            .split(/\r?\n|\r/)
            .slice(codeBlock.$contentPosition.start, codeBlock.$contentPosition.end + 1)
            .join("\n");
        let code = convert(rawCode, lang as ScriptLanguage);

        return Result.success({
            scriptInfo: {
                id: codeBlock.$id,
                language: lang as ScriptLanguage,
                state: LoadingState.UNDEFINED,
                source: codeBlock.$file,
                promise: deferred<Result<string, any>>(),
            },
            code,
        });
    }
}
