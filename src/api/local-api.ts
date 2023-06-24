import { DatacoreApi } from "api/plugin-api";
import { LineSpan, MarkdownFile } from "index/types/markdown";

/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    private $state: Record<string, any>;

    public constructor(public api: DatacoreApi, public path: string, public codeblock: LineSpan) {
        this.$state = {};
    }

    /** The current file path for the local API. */
    public currentPath(): string {
        return this.path;
    }

    /** The full markdown file metadata for the current file. */
    public current(): MarkdownFile {
        return this.api.page(this.path)!;
    }

    /** Return the state for the current API. */
    public state(): Record<string, any> {
        return this.$state;
    }
}
