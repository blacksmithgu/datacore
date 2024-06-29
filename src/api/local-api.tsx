import { DatacoreApi } from "api/api";
import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { SearchResult } from "index/datastore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownCodeblock, MarkdownPage } from "index/types/markdown";
import { App } from "obsidian";
import { useFileMetadata, useFullQuery, useIndexUpdates, useInterning, useQuery } from "ui/hooks";
import * as luxon from "luxon";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { Result } from "./result";
import { Group, Stack } from "./ui/layout";
import { Embed, LineSpanEmbed } from "api/ui/embed";
import { CURRENT_FILE_CONTEXT, Lit, Markdown, ObsidianLink } from "ui/markdown";
import { CSSProperties } from "preact/compat";
import { Literal } from "expression/literal";
import { Button, Checkbox, Icon, Slider, Switch, Textbox, VanillaSelect } from "./ui/basics";
import { VanillaTable } from "./ui/views/vanilla-table";
import { Callout } from "./ui/views/callout";
import { DataArray } from "./data-array";
import { Coerce } from "./coerce";
import { DatacoreJSRenderer, asyncEvalInContext } from "ui/javascript";

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
    public async require(path: string | Link): Promise<any> {
        let code: string | null = null;
        if (path instanceof Link) {
            const blockData = this.core.datastore.resolveLink(path);
            if (blockData instanceof MarkdownCodeblock) {
                const tfile = this.core.vault.getFileByPath(blockData.$file);
                if (tfile !== null) {
                    const rawCode = (await this.core.vault.read(tfile))
                        .split(/\r?\n|\r/)
                        .slice(blockData.$contentPosition.start, blockData.$contentPosition.end + 1)
                        .join("\n");
                    const lang = blockData.$languages[0].replace(/datacore/i, "");
                    code = DatacoreJSRenderer.convert(rawCode, lang as "js" | "ts" | "jsx" | "tsx");
                }
            }
        } else {
            const tfile = this.core.vault.getFileByPath(path);
            if (tfile !== null) {
                const rawCode = await this.core.vault.read(tfile);
                const lang = path.substring(path.lastIndexOf(".") + 1);
                if (!!lang.match(/[jt]sx?$/i)) {
                    code = DatacoreJSRenderer.convert(rawCode, lang as "js" | "ts" | "jsx" | "tsx"); 
                }
            }
        }
        return code
            ? await asyncEvalInContext(code, {
                  dc: this,
                  h: preact.h,
                  Fragment: preact.Fragment,
              })
            : code;
    }

    ///////////////////////
    // General utilities //
    ///////////////////////

    /** Utilities for coercing types into one specific type for easier programming. */
    public coerce = Coerce;

    /** Resolve a local or absolute path or link to an absolute path. */
    public resolvePath(path: string | Link, sourcePath?: string): string {
        return this.api.resolvePath(path, sourcePath ?? this.path);
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

    /** Create a data array from a regular array. */
    public array<T>(input: T[] | DataArray<T>): DataArray<T> {
        return DataArray.wrap(input);
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

    /** Memoize the input automatically and process it using a Data Array; returns a vanilla array back. */
    public useArray<T, U>(input: T[] | DataArray<T>, process: (data: DataArray<T>) => DataArray<U>, deps?: any[]): U[] {
        return hooks.useMemo(() => process(DataArray.wrap(input)).array(), [input, ...(deps ?? [])]);
    }

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
        return useIndexUpdates(this.core, settings);
    }

    /**
     * Run a query, automatically re-running it whenever the vault changes. Returns more information about the query
     * execution, such as index revision and total search duration.
     */
    public useFullQuery(query: string | IndexQuery, settings?: { debounce?: number }): SearchResult<Indexable> {
        return useFullQuery(this.core, this.parseQuery(query), settings);
    }

    /** Run a query, automatically re-running it whenever the vault changes. */
    public useQuery(query: string | IndexQuery, settings?: { debounce?: number }): Indexable[] {
        // Hooks need to be called in a consistent order, so we don't nest the `useQuery` call in the DataArray.wrap _just_ in case.
        return useQuery(this.core, this.parseQuery(query), settings);
    }

    /////////////////////
    // Visual Elements //
    /////////////////////

    /** Vertical flexbox container; good for putting items together in a column. */
    public Stack = Stack;
    /** Horizontal flexbox container; good for putting items together in a row. */
    public Group = Group;

    /** Renders a literal value in a pretty way that respects settings. */
    public Literal({ value, sourcePath, inline }: { value: Literal; sourcePath?: string; inline?: boolean }) {
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return <Lit value={value} sourcePath={sourcePath ?? implicitSourcePath ?? this.path} inline={inline} />;
    }

    /** Renders markdown using the Obsidian markdown renderer, optionally attaching additional styles. */
    public Markdown({
        content,
        sourcePath,
        inline,
        style,
        className,
    }: {
        content: string;
        sourcePath?: string;
        inline?: boolean;
        style?: CSSProperties;
        className?: string;
    }) {
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return (
            <Markdown
                content={content}
                sourcePath={sourcePath ?? implicitSourcePath ?? this.path}
                inline={inline}
                style={style}
                cls={className}
            />
        );
    }

    /** Renders an obsidian-style link directly and more effieicntly than rendering markdown. */
    public Link = ObsidianLink;

    /** Create a vanilla Obsidian embed for the given link. */
    public LinkEmbed({ link, inline, sourcePath }: { link: string | Link; inline?: boolean; sourcePath?: string }) {
        const realLink = hooks.useMemo(() => (typeof link === "string" ? Link.file(link) : link), [link]);
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return (
            <Embed
                link={realLink}
                inline={inline ?? false}
                sourcePath={sourcePath ?? implicitSourcePath ?? this.path}
            />
        );
    }

    /** Create an explicit 'span' embed which extracts a span of lines from a markdown file */
    public SpanEmbed({
        path,
        start,
        end,
        sourcePath,
    }: {
        path: string;
        sourcePath?: string;
        start: number;
        end: number;
    }) {
        // Resolve the path to the correct path if a source path is provided.
        const resolvedPath = hooks.useMemo(() => this.resolvePath(path, sourcePath), [path, sourcePath]);

        return <LineSpanEmbed path={resolvedPath} start={start} end={end} />;
    }

    ///////////
    // Views //
    ///////////

    public VanillaTable = VanillaTable;

    /////////////////////////
    // Interative elements //
    /////////////////////////

    public Button = Button;
    public Textbox = Textbox;
    public Callout = Callout;
    public Checkbox = Checkbox;
    public Slider = Slider;
    public Switch = Switch;
    public VanillaSelect = VanillaSelect;
    public Icon = Icon;
}
