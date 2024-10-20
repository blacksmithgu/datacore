import { debounce, ItemView, MarkdownRenderChild, Menu, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ScriptLanguage } from "utils/javascript";
import { DatacoreJSRenderer, ReactRenderer } from "./javascript";
import { DatacoreLocalApi } from "api/local-api";
import { DatacoreApi } from "api/api";
import { createContext } from "preact";
import { Group, Stack } from "api/ui/layout";
import { useCallback, useContext, useMemo, useState } from "preact/hooks";
import { Textbox, VanillaSelect } from "api/ui/basics";
import { useIndexUpdates } from "./hooks";
import { DATACORE_CONTEXT, ErrorMessage } from "./markdown";
import Select from "react-select";

/** Key for datacore JS query views. */
export const VIEW_TYPE_DATACOREJS = "datacorejs-view";

/** Stores the current Obsidian view object, so it can be manipulated from react. */
const CUSTOM_VIEW_CONTEXT = createContext<DatacoreQueryView>(undefined!);

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
                <textarea
                    style={{ resize: "vertical", minWidth: "75%", fontFamily: "monospace" }}
                    defaultValue={localState.script}
                    value={localState.script}
                    onChange={(e) => setState({ script: e.currentTarget.value as string })}
                />
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

    // Cached list of relevant files, which is only recomputed on vault changes.
    const options = useMemo(() => {
        return core.vault.getMarkdownFiles().map((f) => ({ label: f.path, value: f.path }));
    }, [revision]);

    const defaultOption = defaultValue
        ? { label: "No file", value: undefined }
        : { label: defaultValue, value: defaultValue };

    return (
        <Select
            options={options}
            classNamePrefix="datacore-selectable"
            defaultValue={defaultOption}
            onChange={(nv, _am) => onChange(nv?.value)}
            unstyled
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
