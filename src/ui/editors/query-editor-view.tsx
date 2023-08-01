import { Datacore } from "index/datacore";
import { View, WorkspaceLeaf } from "obsidian";
import { Settings } from "settings";
import { DatacoreContextProvider, SimpleErrorBoundary } from "ui/markdown";
import { QueryEditor } from "./query-editor";
import React from "react";
import { Root, createRoot } from "react-dom/client";

export class QueryEditorView extends View {
    public static TYPE: string = "datacore/query";

    private root: Root;

    public constructor(leaf: WorkspaceLeaf, public datacore: Datacore, public settings: Settings) {
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
        this.root = createRoot(this.containerEl);
        this.root.render(
            <SimpleErrorBoundary title="Query Editor" message="The query editor crashed. See message for details.">
                <DatacoreContextProvider
                    datacore={this.datacore}
                    settings={this.settings}
                    app={this.app}
                    component={this}
                >
                    <QueryEditor />
                </DatacoreContextProvider>
            </SimpleErrorBoundary>
        );
    }

    protected override async onClose() {
        if (this.root) this.root.unmount();
    }
}
