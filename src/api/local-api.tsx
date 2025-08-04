/**
 * @module api
 */
import { DatacoreApi } from "api/api";
import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { SearchResult } from "index/datastore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { MarkdownPage } from "index/types/markdown";
import { App } from "obsidian";
import { useAsync, useFileMetadata, useFullQuery, useIndexUpdates, useInterning, useQuery } from "ui/hooks";
import * as luxon from "luxon";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { Result } from "./result";
import { Group, Stack } from "./ui/layout";
import { Embed, LineSpanEmbed } from "api/ui/embed";
import { APP_CONTEXT, COMPONENT_CONTEXT, CURRENT_FILE_CONTEXT, DATACORE_CONTEXT, ErrorMessage, Lit, Markdown, ObsidianLink, SETTINGS_CONTEXT } from "ui/markdown";
import { CSSProperties, Suspense } from "preact/compat";
import { Literal, Literals } from "expression/literal";
import { Button, Checkbox, Icon, Slider, Switch, Textbox, VanillaSelect } from "./ui/basics";
import { TableView } from "./ui/views/table";
import { Callout } from "./ui/views/callout";
import { DataArray } from "./data-array";
import { Coerce } from "./coerce";
import { ScriptCache } from "./script-cache";
import { Expression } from "expression/expression";
import { Card } from "./ui/views/cards";
import { ListView } from "./ui/views/list";

/**
 * Local API provided to specific codeblocks when they are executing.
 * @public
 */
export class DatacoreLocalApi {
    /** @internal The cache of all currently loaded scripts in this context. */
    private scriptCache: ScriptCache;

    public constructor(public api: DatacoreApi, public path: string) {
        this.scriptCache = new ScriptCache(this.core.datastore);
    }

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

    /**
     * Asynchronously load a javascript block from the given path or link; you can either load from JS/TS/JSX/TSX files
     * directly, or from codeblocks by loading from the section the codeblock is inside of. There are a few stipulations
     * to loading:
     * - You cannot load cyclical dependencies.
     * - This is similar to vanilla js `require()`, not `import ... `. Your scripts you are requiring need to explicitly
     *   return the things they are exporting, like the example below. The `export` keyword does not work.
     *
     * ```js
     * function MyElement() {
     *  ...
     * }
     *
     * return { MyElement };
     * ```
     */
    public async require(path: string | Link): Promise<unknown> {
        const result = await this.scriptCache.load(path, { dc: this });
        return result.orElseThrow();
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

    /** Evaluate an expression and return it's evaluated value. */
    public evaluate(
        expression: string | Expression,
        variables?: Record<string, Literal>,
        sourcePath?: string
    ): Literal {
        return this.api.evaluate(expression, variables, sourcePath ?? this.path);
    }

    /** Evaluate an expression and return it's evaluated value, throwing an exception on failure. */
    public tryEvaluate(
        expression: string | Expression,
        variables?: Record<string, Literal>,
        sourcePath?: string
    ): Result<Literal, string> {
        return this.api.tryEvaluate(expression, variables, sourcePath ?? this.path);
    }

    /** Execute a textual or typed index query, returning all results. */
    public query(query: string | IndexQuery): Indexable[] {
        return this.api.query(query);
    }

    /** Execute a textual or typed index query, returning all results. */
    public tryQuery(query: string | IndexQuery): Result<Indexable[], string> {
        return this.api.tryQuery(query);
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public fullquery(query: string | IndexQuery): SearchResult<Indexable> {
        return this.api.fullquery(query);
    }

    /** Execute a textual or typed index query, returning results plus performance metadata. */
    public tryFullQuery(query: string | IndexQuery): Result<SearchResult<Indexable>, string> {
        return this.api.tryFullQuery(query);
		}
    //////////////
    // Contexts //
    //////////////

    // export the necessary contexts to enable rendering
    // datacore components outside the datacore plugin
    // itself
    get SETTINGS_CONTEXT(): typeof SETTINGS_CONTEXT {
        return SETTINGS_CONTEXT;
    }
    get COMPONENT_CONTEXT(): typeof COMPONENT_CONTEXT {
        return COMPONENT_CONTEXT;
    }
    get DATACORE_CONTEXT(): typeof DATACORE_CONTEXT {
        return DATACORE_CONTEXT;
    }
    get APP_CONTEXT(): typeof APP_CONTEXT {
        return APP_CONTEXT;
    }

    /////////////
    //  Hooks  //
    /////////////

    // Export the common preact hooks for people to use via `dc.`:
    /** See the preact or react 'useState' hook. */
    public useState = hooks.useState;
    /** See the preact or react 'useCallback' hook. */
    public useCallback = hooks.useCallback;
    /** Se the preact or react 'useReducer' hook. */
    public useReducer = hooks.useReducer;
    /** See the preact or react 'useMemo' hook. */
    public useMemo = hooks.useMemo;
    /** See the preact or react 'useEffect' hook. */
    public useEffect = hooks.useEffect;
    /** See the preact or react 'createContext' function. */
    public createContext = preact.createContext;
    /** See the preact or react 'useContext' function. */
    public useContext = hooks.useContext;
    /** See the preact or react 'useRef' function. */
    public useRef = hooks.useRef;
    /**
     * Calls a function to obtain a value; returns the same exact _instance_ of that value as long
     * as calls to the function return an equivalent value. Interning is a useful performance concept
     * for reducing the total number of unique objects in memory and for making better use of
     * React's reference-equality-based caching.
     */
    public useInterning = useInterning;
    public useAsync = useAsync;

    /** Memoize the input automatically and process it using a DataArray; returns a vanilla array back. */
    public useArray<T, U>(
        input: T[] | DataArray<T>,
        process: (data: DataArray<T>) => DataArray<U>,
        deps?: unknown[]
    ): U[] {
        return hooks.useMemo(() => process(DataArray.wrap(input)).array(), [input, ...(deps ?? [])]);
    }

    /** Use the file metadata for the current file. Automatically updates the view when the current file metadata changes. */
    public useCurrentFile(settings?: { debounce?: number }): MarkdownPage {
        return useFileMetadata(this.core, this.path, settings) as MarkdownPage;
    }

    /** Use the current path. Automatically updates the view if the path changes (though that would be weird). */
    public useCurrentPath(settings?: { debounce?: number }): string {
        return this.path;
    }

    /** Use the file metadata for a specific file. Automatically updates the view when the file changes. */
    public useFile(path: string, settings?: { debounce?: number }): Indexable | undefined {
        return useFileMetadata(this.core, path, settings);
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

   public Suspense = Suspense; 

    /** Renders a literal value in a pretty way that respects settings. */
    public Literal = (({ value, sourcePath, inline }: { value: Literal; sourcePath?: string; inline?: boolean }) => {
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return <Lit value={value} sourcePath={sourcePath ?? implicitSourcePath ?? this.path} inline={inline} />;
    }).bind(this);

    /** Renders markdown using the Obsidian markdown renderer, optionally attaching additional styles. */
    public Markdown = (({
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
    }) => {
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
    }).bind(this);

    /** Renders an obsidian-style link directly and more efficiently than rendering markdown. */
    public Link = ObsidianLink;

    /** Create a vanilla Obsidian embed for the given link. */
    public LinkEmbed = (({
        link,
        inline,
        sourcePath,
    }: {
        link: string | Link;
        inline?: boolean;
        sourcePath?: string;
    }) => {
        const realLink = hooks.useMemo(() => (typeof link === "string" ? Link.file(link) : link), [link]);
        const implicitSourcePath = hooks.useContext(CURRENT_FILE_CONTEXT);
        return (
            <Embed
                link={realLink}
                inline={inline ?? false}
                sourcePath={sourcePath ?? implicitSourcePath ?? this.path}
            />
        );
    }).bind(this);

    /** Create an explicit 'span' embed which extracts a span of lines from a markdown file. */
    public SpanEmbed = (({
        path,
        start,
        end,
        explain,
        showExplain,
        sourcePath: maybeSourcePath,
    }: {
        path: string;
        sourcePath?: string;
        explain?: string;
        showExplain?: boolean;
        start: number;
        end: number;
    }) => {
        // Resolve the path to the correct path if a source path is provided.
        const sourcePath = maybeSourcePath ?? this.path;
        const resolvedPath = hooks.useMemo(() => this.resolvePath(path, sourcePath), [path, sourcePath]);

        return (
            <LineSpanEmbed path={resolvedPath} start={start} end={end} explain={explain} showExplain={showExplain} />
        );
    }).bind(this);

    /** Renders an obsidian lucide icon. */
    public Icon = Icon;

    /**
     * Generate an embed of the given markdown element. Useful to pass to the 'renderer' prop of various views
     * to efficiently render embeds of various elements.
     *
     * For example, `dc.embed(<file>)` will produce a file embedding, and `dc.embed(<section>)` will produce a section embedding.
     */
    public embed = ((element: Indexable) => {
        // TODO: We should add embeds as a new tag on indexable types and add an embedding abstraction.
        // For now, it's fairly useful enough to just hardcode some useful things that are embeddable.
        if (element.$types.contains("markdown") && element.$file && "$position" in element) {
            const { start, end } = element.$position as { start: number; end: number };
            if (!Literals.isNumber(start) || !Literals.isNumber(end))
                return (
                    <ErrorMessage
                        message={`Invalid $position field '${JSON.stringify(element.$position)}' for element '${
                            element.$id
                        }' from '${element.$file}'`}
                    />
                );

            return <this.SpanEmbed path={element.$file} start={start} end={end} />;
        }

        return <ErrorMessage message={`No valid embedding for element '${element.$id}' from '${element.$file}'`} />;
    }).bind(this);

    ///////////
    // Views //
    ///////////

    /** @deprecated - Use just `Table` instead. */
    public VanillaTable = TableView;
    /** A simple and configurable table view that supports rendering paged and grouped data. */
    public Table = TableView;

    /** A simple and configurable list view that supports rendering paged and grouped data. */
    public List = ListView;
    /** A single card which can be composed into a grid view. */
    public Card = Card;

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
}
