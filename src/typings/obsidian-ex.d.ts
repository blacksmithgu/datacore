import type { DatacoreApi } from "api/plugin-api";
import "obsidian";

declare module "obsidian" {
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
                [key: string]: unknown,
                md: MarkdownRenderer,
            }
            getEmbedCreator: (arg: {extension: string}) => (arg2: {
                app: App,
                linktext: string,
                sourcePath: string,
                showInline: boolean,
                depth: number,
                containerEl: HTMLElement
            }) => View
        }
    }
}

declare global {
    interface Window {
        datacore?: DatacoreApi;
    }
}
