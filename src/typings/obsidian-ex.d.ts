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
    }
}

declare global {
    interface Window {
        datacore?: DatacoreApi;
    }
}
