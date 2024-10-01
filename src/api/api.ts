import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { SearchResult } from "index/datastore";
import { PRIMITIVES, QUERY } from "expression/parser";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownPage } from "index/types/markdown";
import { Result } from "./result";
import { App, Component, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { DatacoreJSRenderer } from "ui/javascript";
import { DatacoreLocalApi } from "./local-api";
import Parsimmon from "parsimmon";
import { Coerce } from "./coerce";
import { DataArray } from "./data-array";
import * as luxon from "luxon";
import * as preact from "preact";

/** Exterally visible API for datacore. */
export class DatacoreApi {
    public constructor(public core: Datacore) {}

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

    ///////////////
    // Local API //
    ///////////////

    /** Construct a local API for the file at the given path. */
    public local(path: string): DatacoreLocalApi {
        return new DatacoreLocalApi(this, path);
    }

    /////////////////////////
    // Querying + Fetching //
    /////////////////////////

    /** Load a markdown file by full path or link. */
    public page(path: string | Link): MarkdownPage | undefined {
        const realPath = path instanceof Link ? path.path : path;

        return this.core.datastore.load(realPath) as MarkdownPage | undefined;
    }

    /** Execute a textual or typed index query, returning all results. */
    public query(query: string | IndexQuery): Indexable[] {
        return this.tryQuery(query).orElseThrow();
    }

    /** Execute a textual or typed index query, returning all results. */
    public tryQuery(query: string | IndexQuery): Result<Indexable[], string> {
        return this.tryFullQuery(query).map((result) => result.results);
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public fullquery(query: string | IndexQuery): SearchResult<Indexable> {
        return this.tryFullQuery(query).orElseThrow();
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public tryFullQuery(query: string | IndexQuery): Result<SearchResult<Indexable>, string> {
        const parsedQuery = typeof query === "string" ? QUERY.query.tryParse(query) : query;
        return this.core.datastore.search(parsedQuery);
    }

    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Utilities for coercing types into one specific type for easier programming. */
    public coerce = Coerce;

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link, sourcePath?: string): string {
        const rawpath = path instanceof Link ? path.path : path;
        if (rawpath.startsWith("/")) return rawpath.substring(1);

        const absolute = this.core.metadataCache.getFirstLinkpathDest(rawpath, sourcePath ?? "");
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

    /** Create a link to a header with the given name. */
    public headerLink(path: string, header: string): Link {
        return Link.header(path, header);
    }

    /** Create a link to a block with the given path and block ID. */
    public blockLink(path: string, block: string): Link {
        return Link.block(path, block);
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

    /** Create a data array from a regular array. */
    public array<T>(input: T[] | DataArray<T>): DataArray<T> {
        return DataArray.wrap(input);
    }

    /////////////////////
    // Visual Elements //
    /////////////////////

    /**
     * Run the given DatacoreJS script, rendering it into the given container. This function
     * will return quickly; actual rendering is done asynchronously in the background.
     *
     * Returns a markdown render child representing the rendered object.
     */
    public executeJs(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "js");
    }

    /**
     * Similar to `executeJs`, but for JSX scripts. If you are unsure if your input will be JS
     * or JSX, use this one, as it also supports regular javascript (albeit at at a mild performance
     * hit to rendering).
     */
    public executeJsx(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "jsx");
    }

    /**
     * Similar to `executeJs`, but for TypeScript scripts. Use the TSX variant for TSX supprot.
     */
    public executeTs(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "ts");
    }

    /**
     * Similar to `executeTs`, but for TSX scripts. If you are unsure if your input will be TS
     * or TSX, use this one, as it also supports regular javascript (albeit at at a mild performance
     * hit to rendering).
     *
     * This generally will also work if you are unsure if your input is javascript or typescript,
     * though beware there are a few niche cases where javascript and typescript diverge in syntax.
     */
    public executeTsx(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string
    ): MarkdownRenderChild {
        return this._renderJavascript(source, container, component, sourcePath, "tsx");
    }

    /** Shared logic for rendering any JS/TS script. */
    private _renderJavascript(
        source: string,
        container: HTMLElement,
        component: Component | MarkdownPostProcessorContext,
        sourcePath: string,
        language: "js" | "ts" | "jsx" | "tsx"
    ) {
        let local = new DatacoreLocalApi(this, sourcePath);
        const renderer = new DatacoreJSRenderer(local, container, sourcePath, source, language);
        component.addChild(renderer);

        return renderer;
    }
}
