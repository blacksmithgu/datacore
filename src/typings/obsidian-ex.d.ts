import type { DatacoreApi } from "api/api";
import { CanvasMetadataIndex } from "index/types/json/canvas";
import "obsidian";

declare module "obsidian" {
    interface WorkspaceLeaf {
        serialize(): {
            id: string;
            type: "leaf";
            state: {
                type: string;
                state: any;
            };
        };
        tabHeaderEl: HTMLElement;
        tabHeaderInnerTitleEl: HTMLElement;
    }
    interface ItemView {
        titleEl: HTMLElement;
    }
    interface FileManager {
        linkUpdaters: {
            canvas: {
                canvas: {
                    index: {
                        index: CanvasMetadataIndex;
                    };
                };
            };
        };
    }
    interface App {
        appId?: string;
        plugins: {
            enabledPlugins: Set<string>;
            plugins: {
                datacore?: {
                    api: DatacoreApi;
                };
            };
        };
        embedRegistry: {
            embedByExtension: {
                [key: string]: unknown;
                md: MarkdownRenderer;
            };
            getEmbedCreator: (arg: TFile) => new (
                arg2: {
                    app: App;
                    linktext: string;
                    sourcePath: string;
                    showInline: boolean;
                    depth: number;
                    containerEl: HTMLElement;
                    displayMode: boolean;
                },
                file: TFile,
                subpath?: string
            ) => FileView & { loadFile: (file: TFile) => void };
        };
    }
}

declare global {
    interface Window {
        datacore?: DatacoreApi;
    }
}
