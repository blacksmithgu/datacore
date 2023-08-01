import { Datacore } from "index/datacore";
import { View, WorkspaceLeaf } from "obsidian";
import { Settings } from "settings";
import { DatacoreContextProvider } from "ui/markdown";
import { QueryEditor } from "./query-editor";
import { h, render } from "preact";

export class QueryEditorView extends View {
    public static TYPE: string = "datacore/query";

    public constructor(
        leaf: WorkspaceLeaf,
        public datacore: Datacore,
        public settings: Settings) {
        super(leaf);
        
        this.navigation = true;
        this.icon = "search";
    }

    override getViewType(): string {
        return QueryEditorView.TYPE;
    }

    override getDisplayText(): string {
        return "Datacore Query";
    }

    protected override async onOpen() {
        render(
            <DatacoreContextProvider datacore={this.datacore} settings={this.settings} app={this.app} component={this}>
                <QueryEditor />
            </DatacoreContextProvider>,
            this.containerEl)
    }

    protected override async onClose() {
        render(() => null, this.containerEl);
    }
}