import { DatacoreApi } from "api/plugin-api";
import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { Datastore, SearchResult } from "index/datastore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownFile } from "index/types/markdown";
import { App } from "obsidian";
import { useFileMetadata, useFullQuery, useInterning, useQuery } from "ui/hooks";
import * as luxon from "luxon";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { COMPONENTS } from "./components";
import { useTableDispatch } from "ui/table";

/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    public constructor(public api: DatacoreApi, public path: string) {}

    /** The current file path for the local API. */
    public currentPath(): string {
        return this.path;
    }

    /** The full markdown file metadata for the current file. */
    public currentFile(): MarkdownFile {
        return this.api.page(this.path)!;
    }

    /** Get acess to luxon functions. */
    get luxon(): typeof luxon {
        return luxon;
    }

    /** Get access to preact functions. */
    get preact(): typeof preact {
        return preact;
    }

    /** The internal plugin central datastructure. */
    get core(): Datacore {
        return this.api.core;
    }

    /** Internal data indices and query engine. */
    get store(): Datastore {
        return this.core.datastore;
    }

    /** Central Obsidian app object. */
    get app(): App {
        return this.core.app;
    }

    /** Provides access to all of the datacore intrinsic react components. */
    get components(): typeof COMPONENTS {
        return COMPONENTS;
    }

    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link): string {
        const rawpath = path instanceof Link ? path.path : path;
        if (rawpath.startsWith("/")) return rawpath.substring(1);

        const absolute = this.app.metadataCache.getFirstLinkpathDest(rawpath, this.path);
        if (absolute) return absolute.path;

        return rawpath;
    }

    /////////////
    //  Hooks  //
    /////////////

    // Export the common preact hooks for people to use via `dc.`:
    public useState = hooks.useState;
    public useCallback = hooks.useCallback;
    public useReducer = hooks.useReducer;
    public useMemo = hooks.useMemo;
    public useEffect = hooks.useEffect;
    public createContext = preact.createContext;
    public useContext = hooks.useContext;
    public useRef = hooks.useRef;
    public useInterning = useInterning;

    /** Use the file metadata for the current file. */
    public useCurrentFile(settings?: { debounce?: number }): MarkdownFile {
        return useFileMetadata(this.core, this.path, settings) as MarkdownFile;
    }

    /**
     * Run a query, automatically re-running it whenever the vault changes. Returns more information about the query
     * execution, such as index revision and total search duration.
     */
    public useFullQuery(query: IndexQuery, settings?: { debounce?: number }): SearchResult<Indexable> {
        return useFullQuery(this.core, query, settings);
    }

    /** Run a query, automatically re-running it whenever the vault changes. */
    public useQuery(query: IndexQuery, settings?: { debounce?: number }): Indexable[] {
        return useQuery(this.core, query, settings);
    }

    //////////////////////////
    // Visual element hooks //
    //////////////////////////

    public useTableDispatch = useTableDispatch;
}
