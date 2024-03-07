import { Link } from "expression/link";
import { Datastore } from "index/datastore";
import { Result } from "./result";

/** A simple caching script loader that can load any DAG of script dependencies. */
export class ScriptCache {
    /** Scripts are cached by the fully-resolved path to them. */
    private scripts: Map<string, LoadedScript> = new Map();
    /**
     * A static placeholder placed into the `scripts` section to catch recursive loading loops.
     * 
    */
    private static LOADING_SENTINEL: Symbol = Symbol("CURRENTLY_LOADING");

    public constructor(private store: Datastore) { }

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
        if (!object) return Result.failure("Could not find a script at the given path: " + path.toString())

        // If the object is a markdown section, search for any javascript codeblocks; otherwise, check if it is a full script file.
        return Result.success(""); // TODO
    }
}

/** State for a script which is in the process of loading. */
export interface LoadingScript {
    type: "loading";

    /**  */
    promise: Promise<any>;
}