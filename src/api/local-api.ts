import { DatacoreApi } from "api/plugin-api";
import { LineSpan } from "index/types/markdown";

/** Local API provided to specific codeblocks when they are executing. */
export class DatacoreLocalApi {
    public constructor(public api: DatacoreApi, public path: string, public codeblock: LineSpan) {}
}
