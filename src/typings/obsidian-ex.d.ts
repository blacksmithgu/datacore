import type { DatacorePlugin } from "main";
import type { CanvasMetadataIndex } from "index/types/json/canvas";

import "obsidian";

/** Provides extensions used by datacore or provider to other plugins via datacore. */
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
            enabledPlugins: Set<string>;
            plugins: {
                datacore?: DatacorePlugin;
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

/** Provides the 'datacore' global for other plugins to use. */
declare global {
    interface Window {
        datacore?: DatacoreApi;
    }
}
