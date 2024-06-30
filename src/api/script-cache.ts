import { Link } from "expression/link";
import { Datastore } from "index/datastore";
import { Result } from "./result";
import { MarkdownCodeblock, MarkdownSection } from "index/types/markdown";
import { DatacoreJSRenderer, ScriptLanguage, asyncEvalInContext } from "ui/javascript";
import { DatacoreLocalApi } from "./local-api";
import { Fragment, h } from "preact";
export interface DatacoreScript {
    language: ScriptLanguage;
    code: string | null;
    id: string;
    state: LoadingState;
    source: string;
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
    public async load(
        path: string | Link,
        parentContext: DatacoreLocalApi,
        sourcePath?: string
    ): Promise<Result<any, string>> {
        const source = await this.resolveSource(path, sourcePath);
        if (!source.successful) return source;
        source.value.state = LoadingState.LOADING;
        let element = parentContext.loadedScripts.find(
            (x) => x.id === source.value.id && x.state === LoadingState.LOADING
        );
        if (!element) {
            parentContext.loadedScripts.push(source.value);
            let dc = new DatacoreLocalApi(parentContext.api, source.value.source, parentContext.loadedScripts);
            const res = await asyncEvalInContext(source.value.code!, {
                h,
                Fragment,
                dc,
            });
            parentContext.loadedScripts[parentContext.loadedScripts.length - 1].code = null;
            parentContext.loadedScripts[parentContext.loadedScripts.length - 1].state = LoadingState.LOADED;

            return Result.success(res);
        }
        return Result.failure(
            `Script import cycle detected; currently loaded scripts are:\n${parentContext.loadedScripts
                .map((x) => `		- ${x.source}`)
                .join("\n")}`
        );
    }

    /** Attempts to resolve the source to load given a path or link to a markdown section. */
    private async resolveSource(path: string | Link, sourcePath?: string): Promise<Result<DatacoreScript, string>> {
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
                .find((cb) => cb.$languages.some((language) => ScriptCache.SCRIPT_TAGS.includes(language.replace(prefixRegex, ""))));

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
        let code = DatacoreJSRenderer.convert(rawCode, lang as ScriptLanguage);

        return Result.success({
            code,
            id: codeBlock.$id,
            language: lang as ScriptLanguage,
            state: LoadingState.UNDEFINED,
            source: codeBlock.$file,
        }); // TODO.
    }
}
