import { DatacoreApi } from "api/plugin-api";
import { Datacore } from "index/datacore";
import { Datastore } from "index/datastore";
import { MarkdownFile } from "index/types/markdown";
import { App } from "obsidian";

/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    public constructor(public api: DatacoreApi, public path: string) {}

    /** The current file path for the local API. */
    public currentPath(): string {
        return this.path;
    }

    /** The full markdown file metadata for the current file. */
    public currentFile(): MarkdownFile {
        return this.api.page(this.path)!;
    }

    /** The internal plugin central datastructure. */
    get core(): Datacore {
        return this.api.core;
    }

    /** Internal data indices and query engine. */
    get store(): Datastore {
        return this.core.datastore;
    }

    /** Central Obsidian app object. */
    get app(): App {
        return this.core.app;
    }
}
