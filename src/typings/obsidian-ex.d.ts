import type { DatacoreApi } from "api/api";
import { CanvasMetadataIndex } from "index/types/json/canvas";
import "obsidian";

/** @hidden */
declare module "obsidian" {
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
            enablePlugin: (id: string) => Promise<boolean>;
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
    interface WorkspaceLeaf {
        containerEl: HTMLElement;
        resizeHandleEl: HTMLElement;
        tabHeaderEl: HTMLElement;
        tabHeaderInnerIconEl: HTMLElement;
        tabHeaderInnerTitleEl: HTMLElement;
        tabHeaderStatusContainerEl: HTMLElement;
        tabHeaderStatusPinEl: HTMLElement;
        tabHeaderStatusLinkEl: HTMLElement;
        tabHeaderCloseEl: HTMLElement;
    }
}

declare global {
    interface Window {
        datacore?: DatacoreApi;
    }
}
