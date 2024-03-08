import { DatacoreApi } from "api/api";
import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { Datastore, SearchResult } from "index/datastore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownPage } from "index/types/markdown/markdown";
import { App } from "obsidian";
import { useFileMetadata, useFullQuery, useInterning, useQuery } from "ui/hooks";
import * as luxon from "luxon";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { DataArray } from "./data-array";
import { PRIMITIVES, QUERY } from "expression/parser";
import { Result } from "./result";
import Parsimmon from "parsimmon";
import { TableProps, TableView } from "ui/table";
import { h } from "preact";

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

    //////////////////////////////
    // Script loading utilities //
    //////////////////////////////

    // Note: Script loading is a bit jank, since it has to be asynchronous due to IO (unless of course we wanted to cache
    // every single script in the vault in memory, which seems terrible for performance). It functions by essentially
    // returning a lazy proxy.

    /**
     * Asynchronously load a javascript block from the given path or link; this method supports loading code blocks
     * from markdown files via the link option
     *
     */
    public async require(path: string | Link): Promise<any> {}

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

    /** Try to parse the given query, returning a monadic success/failure result. */
    public tryParseQuery(query: string | IndexQuery): Result<IndexQuery, string> {
        if (!(typeof query === "string")) return Result.success(query);

        const result = QUERY.query.parse(query);
        if (result.status) return Result.success(result.value);
        else return Result.failure(Parsimmon.formatError(query, result));
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
        return this.tryParseLink(linktext).orElseThrow((e) => "Failed to parse link: " + e);
    }

    /** Try to parse a link, returning a monadic success/failure result. */
    public tryParseLink(linktext: string): Result<Link, string> {
        const parsed = PRIMITIVES.embedLink.parse(linktext);
        if (!parsed.status) return Result.failure(Parsimmon.formatError(linktext, parsed));

        return Result.success(parsed.value);
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
    public useCurrentFile(settings?: { debounce?: number }): MarkdownPage {
        return useFileMetadata(this.core, this.path, settings) as MarkdownPage;
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
    // Visual elements //
    /////////////////////

    /**
     * Central entry point for creating a raw (p)react DOM element. Allows for raw creation of preact elements.
     *
     * Note: `h` is directly injected into local datacorejs contexts already, so this is just a backup.
     */
    public h = preact.h;
    public createElement = preact.createElement;

    /** Create a responsive table showing the given data. */
    public table<T>(rows: T[] | DataArray<T>, settings?: TableProps<T>): preact.VNode<TableProps<T>> {
        const rawRows = DataArray.isDataArray(rows) ? rows.array() : rows;
        return <TableView<T> rows={rawRows} {...settings} />;
    }
}
