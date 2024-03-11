import { DatacoreApi } from "api/api";
import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { SearchResult } from "index/datastore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownPage } from "index/types/markdown/markdown";
import { App } from "obsidian";
import { useFileMetadata, useFullQuery, useInterning, useQuery } from "ui/hooks";
import * as luxon from "luxon";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { DataArray } from "./data-array";
import { Result } from "./result";
import { Group, Stack } from "./ui/layout";

/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    public constructor(public api: DatacoreApi, public path: string) {}

    /** The current file path for the local API. */
    public currentPath(): string {
        return this.path;
    }

    /** The full markdown file metadata for the current file. */
    public currentFile(): MarkdownPage {
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

    /** Central Obsidian app object. */
    get app(): App {
        return this.core.app;
    }

    /** The internal plugin central datastructure. */
    get core(): Datacore {
        return this.api.core;
    }

    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link): string {
        return this.api.resolvePath(path, this.path);
    }

    /** Try to parse the given query, returning a monadic success/failure result. */
    public tryParseQuery(query: string | IndexQuery): Result<IndexQuery, string> {
        return this.api.tryParseQuery(query);
    }

    /** Try to parse the given query, throwing an error if it is invalid. */
    public parseQuery(query: string | IndexQuery): IndexQuery {
        return this.tryParseQuery(query).orElseThrow((e) => "Failed to parse query: " + e);
    }

    /** Create a file link pointing to the given path. */
    public fileLink(path: string): Link {
        return Link.file(path);
    }

    /** Try to parse the given link, throwing an error if it is invalid. */
    public parseLink(linktext: string): Link {
        return this.api.parseLink(linktext);
    }

    /** Try to parse a link, returning a monadic success/failure result. */
    public tryParseLink(linktext: string): Result<Link, string> {
        return this.api.tryParseLink(linktext);
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

    /** Use the file metadata for the current file. Automatically updates the view when the current file metadata changes. */
    public useCurrentFile(settings?: { debounce?: number }): MarkdownPage {
        return useFileMetadata(this.core, this.path, settings) as MarkdownPage;
    }

    /** Use the file metadata for a specific file. Automatically updates the view when the file changes. */
    public useFile(path: string, settings?: { debounce?: number }): Indexable | undefined {
        return useFileMetadata(this.core, path, settings)!;
    }

    /** Automatically refresh the view whenever the index updates; returns the latest index revision ID. */
    public useIndexUpdates(settings?: { debounce?: number }): number {
        return this.useIndexUpdates(settings);
    }

    /**
     * Run a query, automatically re-running it whenever the vault changes. Returns more information about the query
     * execution, such as index revision and total search duration.
     */
    public useFullQuery(query: string | IndexQuery, settings?: { debounce?: number }): SearchResult<Indexable> {
        return useFullQuery(this.core, this.parseQuery(query), settings);
    }

    /** Run a query, automatically re-running it whenever the vault changes. */
    public useQuery(query: string | IndexQuery, settings?: { debounce?: number }): DataArray<Indexable> {
        // Hooks need to be called in a consistent order, so we don't nest the `useQuery` call in the DataArray.wrap _just_ in case.
        const result = useQuery(this.core, this.parseQuery(query), settings);
        return DataArray.wrap(result);
    }

    /////////////////////
    // Visual Elements //
    /////////////////////

    /** Vertical flexbox container; good for putting items together in a column. */
    public Stack = Stack;
    /** Horizontal flexbox container; good for putting items together in a row. */
    public Group = Group;
}
