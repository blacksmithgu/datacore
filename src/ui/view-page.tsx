import { debounce, ItemView, MarkdownRenderChild, Menu, Scope, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ScriptLanguage } from "utils/javascript";
import { DatacoreJSRenderer, ReactRenderer } from "./javascript";
import { DatacoreLocalApi } from "api/local-api";
import { DatacoreApi } from "api/api";
import { createContext } from "preact";
import { Group, Stack } from "api/ui/layout";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Textbox, VanillaSelect } from "api/ui/basics";
import { useIndexUpdates } from "./hooks";
import { DATACORE_CONTEXT, ErrorMessage } from "./markdown";
import Select from "react-select";
import "./view-page.css";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { foldGutter, indentOnInput, syntaxHighlighting, bracketMatching, foldKeymap } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    EditorView,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import { tagHighlighter, tags } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState } from "@codemirror/state";
import { vim } from "@replit/codemirror-vim";

/** Key for datacore JS query views. */
export const VIEW_TYPE_DATACOREJS = "datacorejs-view";

/** Stores the current Obsidian view object, so it can be manipulated from react. */
const CUSTOM_VIEW_CONTEXT = createContext<DatacoreQueryView>(undefined!);

const EDITOR_HL = syntaxHighlighting(
    tagHighlighter([
        {
            tag: tags.link,
            class: "cm-link",
        },
        {
            tag: tags.heading,
            class: "cm-heading",
        },
        {
            tag: tags.emphasis,
            class: "cm-emphasis",
        },
        {
            tag: tags.strong,
            class: "cm-strong",
        },
        {
            tag: tags.keyword,
            class: "cm-keyword",
        },
        {
            tag: tags.atom,
            class: "cm-atom",
        },
        {
            tag: tags.bool,
            class: "cm-bool",
        },
        {
            tag: tags.url,
            class: "cm-url",
        },
        {
            tag: tags.labelName,
            class: "cm-labelName",
        },
        {
            tag: tags.inserted,
            class: "cm-inserted",
        },
        {
            tag: tags.deleted,
            class: "cm-deleted",
        },
        {
            tag: tags.literal,
            class: "cm-literal",
        },
        {
            tag: tags.string,
            class: "cm-string",
        },
        {
            tag: tags.number,
            class: "cm-number",
        },
        {
            tag: [tags.regexp, tags.escape, tags.special(tags.string)],
            class: "cm-string2",
        },
        {
            tag: tags.variableName,
            class: "cm-variableName",
        },
        {
            tag: tags.local(tags.variableName),
            class: "cm-variableName cm-local",
        },
        {
            tag: tags.definition(tags.variableName),
            class: "cm-variableName cm-definition",
        },
        {
            tag: tags.special(tags.variableName),
            class: "cm-variableName2",
        },
        {
            tag: tags.definition(tags.propertyName),
            class: "cm-propertyName cm-definition",
        },
        {
            tag: tags.typeName,
            class: "cm-typeName",
        },
        {
            tag: tags.namespace,
            class: "cm-namespace",
        },
        {
            tag: tags.className,
            class: "cm-className",
        },
        {
            tag: tags.macroName,
            class: "cm-macroName",
        },
        {
            tag: tags.propertyName,
            class: "cm-propertyName",
        },
        {
            tag: tags.operator,
            class: "cm-operator",
        },
        {
            tag: tags.comment,
            class: "cm-comment",
        },
        {
            tag: tags.meta,
            class: "cm-meta",
        },
        {
            tag: tags.invalid,
            class: "cm-invalid",
        },
        {
            tag: tags.punctuation,
            class: "cm-punctuation",
        },
    ])
);
const LANG_COMPARTMENT = new Compartment();
const EDITOR_EXTS = [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
    ]),
    EditorView.baseTheme({
        ".cm-cursor": {
            borderLeftColor: "var(--text)",
        },
        ".cm-tooltip": {
            backgroundColor: "var(--bg)",
        },
    }),
];
/** Provides a minimal editor with syntax highlighting */
function CodeMirrorEditor({
    lang,
    state: { script },
    setState,
}: {
    lang?: ScriptLanguage;
    state: DatacoreViewState;
    setState: (state: Partial<DatacoreViewState>) => void;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView>(null);
    const viewContext = useContext(CUSTOM_VIEW_CONTEXT);
    useEffect(() => {
        if (editorRef.current)
            viewRef.current = new EditorView({
                parent: editorRef.current,
                extensions: [viewContext.app.vault.getConfig("vimMode") && vim()].concat(
                    ...EDITOR_EXTS.concat(
                        ...[
                            LANG_COMPARTMENT.of(javascript()),
                            ViewPlugin.fromClass(
                                class {
                                    constructor(public view: EditorView) {}
                                    update(update: ViewUpdate) {
                                        if (update.docChanged) {
                                            setState({ script: this.view.state.sliceDoc() || "" });
                                        }
                                    }
                                }
                            ),
                            EDITOR_HL,
                            viewContext.app.vault.getConfig("vimMode") && vim(),
                        ].filter((a) => !!a)
                    )
                ),
                doc: script || "",
            });
        return () => viewRef.current?.destroy();
    }, [editorRef.current]);
    useEffect(() => {
        if (viewRef.current)
            viewRef.current.dispatch({
                effects: LANG_COMPARTMENT.reconfigure(
                    javascript({ jsx: lang?.endsWith("x"), typescript: lang?.startsWith("ts") })
                ),
            });
    }, [lang]);

    return <div className="dc-cm-editor" ref={editorRef}></div>;
}

/** Provides options for configuring a datacore view pane. */
function DatacoreViewSettings() {
    const view = useContext(CUSTOM_VIEW_CONTEXT) as DatacoreQueryView;
    const setViewState = useMemo(
        () => debounce((state: Partial<DatacoreViewState>) => view.setState(state, { history: false }), 500),
        [view]
    );

    const [localState, setLocalState] = useState(view.getState());
    const setState = useCallback(
        (state: Partial<DatacoreViewState>) => {
            const finalState = { ...localState, ...state };
            // Not debounced.
            setLocalState(finalState);

            // Debounced.
            setViewState(finalState);
        },
        [localState, setLocalState, view]
    );

    return (
        <Stack align="stretch">
            <button className="clickable-icon" style="align-self: start" onClick={() => view.view("script")}>
                {BACK_BUTTON}
            </button>
            <Group justify="space-between" align="center">
                <h6>View Title</h6>
                <Textbox
                    defaultValue={view.getState().title}
                    onChange={(e) => setState({ title: e.currentTarget.value as string })}
                />
            </Group>
            <Group justify="space-between" align="center">
                <h6>View Type</h6>
                <VanillaSelect
                    defaultValue={view.getState().sourceType}
                    options={LANGUAGE_OPTIONS}
                    value={localState.sourceType}
                    onValueChange={(s) => setState({ sourceType: s as ScriptLanguage })}
                />
            </Group>
            <Group justify="space-between" align="center">
                <h6>Script/View source</h6>
                <div style={{ minWidth: "75%", fontFamily: "monospace" }}>
                    <CodeMirrorEditor state={localState} setState={setState} lang={localState.sourceType ?? "js"} />
                </div>
            </Group>
            <Group justify="space-between" align="center">
                <Stack>
                    <h6>Current File</h6>
                    <small>The path returned by functions like `useCurrentPath` in this view</small>
                </Stack>
                <div style={{ minWidth: "50%" }}>
                    <CurrentFileSelector
                        defaultValue={localState.currentFile}
                        onChange={(v) => setState({ currentFile: v })}
                    />
                </div>
            </Group>
        </Stack>
    );
}

/** React component for asynchronously showing the active set of current files to select one from. */
function CurrentFileSelector({
    defaultValue,
    onChange,
}: {
    defaultValue?: string;
    onChange: (value: string | undefined) => void;
}) {
    const core = useContext(DATACORE_CONTEXT);
    const revision = useIndexUpdates(core, { debounce: 2000 });
    const defaultOption = !defaultValue
        ? { label: "No file", value: "" }
        : { label: defaultValue!, value: defaultValue! };
    // Cached list of relevant files, which is only recomputed on vault changes.
    const options = useMemo(() => {
        return core.vault
            .getMarkdownFiles()
            .map((f) => ({ label: f.path, value: f.path }))
            .concat(defaultOption);
    }, [revision]);

    return (
        <Select
            options={options}
            classNamePrefix="datacore-selectable"
            defaultValue={defaultOption}
            onChange={(nv, _am) => onChange(nv?.value)}
            unstyled
            menuPortalTarget={document.body}
            classNames={{
                input: (props: any) => "prompt-input",
                valueContainer: (props: any) => "suggestion-item value-container",
                container: (props: any) => "suggestion-container",
                menu: (props: any) => "suggestion-content suggestion-container",
                option: (props: any) => `suggestion-item${props.isSelected ? " is-selected" : ""}`,
            }}
        />
    );
}

/** Selectable options for picking which language to execute the script in. */
const LANGUAGE_OPTIONS: { label: string; value: ScriptLanguage }[] = [
    { label: "Javascript", value: "js" },
    { label: "Typescript", value: "ts" },
    { label: "Javascript (JSX)", value: "jsx" },
    { label: "Typescript JSX", value: "tsx" },
];

/** SVG back button shown to exit the settings view. */
const BACK_BUTTON = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="svg-icon lucide-arrow-left"
    >
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
    </svg>
);

/** State for the datacore view page. */
export interface DatacoreViewState {
    /** Custom title for the view pane. */
    title?: string;
    /** Language that the script will be executed in. */
    sourceType?: ScriptLanguage;
    /** If defined, the file the view will be relative to. */
    currentFile?: string;
    /** Contents of the script. */
    script?: string;
    /** The current view; defaults to 'settings' for initialization. */
    view?: "settings" | "script";
}

export class DatacoreQueryView extends ItemView {
    /** Internal current state of the view; can be modified by setState. */
    public internalState: DatacoreViewState = {
        title: "New view",
        script: "",
        sourceType: "js",
        view: "settings",
    };

    /** The current active view - either the settings view */
    private activeView: MarkdownRenderChild;
    private activeViewType: string;

    constructor(leaf: WorkspaceLeaf, public api: DatacoreApi) {
        super(leaf);
        this.rerender();
    }

    /** Should always be VIEW_TYPE_DATACOREJS. */
    getViewType(): string {
        return VIEW_TYPE_DATACOREJS;
    }

    /** Text shown in the title window. */
    getDisplayText(): string {
        return `${this.internalState.title} (DatacoreJS)`;
    }

    public async onload() {
        this.contentEl.addClass("markdown-rendered");
        this.registerDomEvent(this.containerEl, "keydown", (k) => {
            if (k.charCode == 27) {
                k.preventDefault();
                k.stopPropagation();
            }
        });
        this.scope = new Scope(this.app.scope);
        this.scope?.register(null, "Escape", (ev) => {});
        this.rerender();
    }

    public onunload(): void {
        if (this.activeView) this.removeChild(this.activeView);
    }

    /** Synchronizes the screen state to properly reflect the current internal state. */
    rerender(): void {
        this.leaf.tabHeaderInnerTitleEl.textContent = this.titleEl.textContent = this.getDisplayText();
        if (this.activeViewType == this.internalState.view) return;

        if (this.activeView) this.removeChild(this.activeView);
        if (this.internalState.view === "settings") {
            this.activeViewType = "settings";
            this.activeView = new ReactRenderer(
                this.app,
                this.api.core,
                this.contentEl,
                this.internalState.currentFile || "",
                (
                    <CUSTOM_VIEW_CONTEXT.Provider value={this}>
                        <DatacoreViewSettings />
                    </CUSTOM_VIEW_CONTEXT.Provider>
                )
            );
        } else {
            // If a script, try to execute it; otherwise, show a reasonable error message.
            this.activeViewType = "script";
            if (this.internalState.script) {
                this.activeView = new DatacoreJSRenderer(
                    new DatacoreLocalApi(this.api, this.internalState.currentFile || ""),
                    this.contentEl,
                    this.internalState.currentFile || "",
                    this.internalState.script || "",
                    this.internalState.sourceType || "js"
                );
            } else {
                this.activeView = new ReactRenderer(
                    this.app,
                    this.api.core,
                    this.contentEl,
                    this.internalState.currentFile || "",
                    (
                        <CUSTOM_VIEW_CONTEXT.Provider value={this}>
                            <ErrorMessage message="No script defined for this view." />
                        </CUSTOM_VIEW_CONTEXT.Provider>
                    )
                );
            }
        }

        this.addChild(this.activeView);
    }

    public getState() {
        return this.internalState;
    }

    /** Update the state of this view with new metadata. Generally controlled by the settings pane. */
    public async setState(state: DatacoreViewState, _result: ViewStateResult): Promise<void> {
        this.internalState = state;
        this.rerender();
    }

    /** Swap the active view. */
    public view(mode: "settings" | "script"): void {
        this.internalState.view = mode;
        this.rerender();
    }

    public async onOpen(): Promise<void> {}

    /** Handle for right click menus. */
    public onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
        if (source === "more-options") {
            menu.addItem((it) => {
                it.setIcon("settings");
                it.setTitle("Configure View");
                it.onClick((e) => this.view("settings"));
            });
        }
    }
}
