import { Link } from "expression/link";
import { Datastore } from "index/datastore";
import { Result } from "./result";
import { MarkdownCodeblock, MarkdownSection } from "index/types/markdown/markdown";

/** A simple caching script loader that can load any DAG of script dependencies. */
export class ScriptCache {
    /** A static placeholder placed into the `scripts` section to catch recursive loading loops. */
    // private static LOADING_SENTINEL: Symbol = Symbol("CURRENTLY_LOADING");
    private static SCRIPT_TAGS: string[] = ["javascript", "typescript", "ts", "js", "tsx", "jsx"];

    public constructor(private store: Datastore) {}

    /**
     * Load the given script at the given path, recursively loading any subscripts by correctly injecting `import` into the child contexts.
     */
    public async load(path: string | Link, sourcePath?: string): Promise<Result<any, string>> {
        const source = await this.resolveSource(path, sourcePath);
        if (!source.successful) return source;

        return Result.success(""); // TODO
    }

    /** Attempts to resolve the source to load given a path or link to a markdown section. */
    private async resolveSource(path: string | Link, sourcePath?: string): Promise<Result<string, string>> {
        const object = this.store.resolveLink(path);
        if (!object) return Result.failure("Could not find a script at the given path: " + path.toString());

        // If the object is a markdown section, search for any javascript codeblocks; otherwise, check if it is a full script file.
        if (object instanceof MarkdownSection) {
            const importCodeblock = object.$blocks
                .filter((b): b is MarkdownCodeblock => b.$type === "codeblock")
                .find((cb) => ScriptCache.SCRIPT_TAGS.some((language) => cb.$languages.includes(language)));

            if (!importCodeblock)
                return Result.failure("Could not find a script in the given markdown section: " + path.toString());

            // Load the script.
            return Result.success(""); // TODO.
        }

        return Result.success(""); // TODO.
    }
}
