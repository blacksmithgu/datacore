import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { SearchResult } from "index/datastore";
import { QUERY } from "expression/parser";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownPage } from "index/types/markdown/markdown";
import { Result } from "./result";
import { Component, MarkdownPostProcessorContext } from "obsidian";
import { DatacoreJSRenderer } from "ui/js-renderer";
import { DatacoreLocalApi } from "./local-api";

/** Exterally visible API for datacore. */
export class DatacoreApi {
    public constructor(public core: Datacore) {}

    /////////////////////////
    // Querying + Fetching //
    /////////////////////////

    /** Load a markdown file by full path or link. */
    public page(path: string | Link): MarkdownPage | undefined {
        const realPath = path instanceof Link ? path.path : path;

        return this.core.datastore.load(realPath) as MarkdownPage | undefined;
    }

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link, sourcePath?: string): string {
        const rawpath = path instanceof Link ? path.path : path;
        if (rawpath.startsWith("/")) return rawpath.substring(1);

        const absolute = this.core.metadataCache.getFirstLinkpathDest(rawpath, sourcePath ?? "");
        if (absolute) return absolute.path;

        return rawpath;
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
    /**javascript! */
    public async executeJs(
        source: string, 
        container: HTMLElement, 
        component: Component | MarkdownPostProcessorContext, 
        filePath: string
    ) {
        let local = new DatacoreLocalApi(this, filePath, container)
        let renderer = new DatacoreJSRenderer(local, source, container, filePath);
        component.addChild(renderer)
    }
}
