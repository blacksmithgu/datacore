import { Link } from "expression/link";
import { Datacore } from "index/datacore";
import { MarkdownFile } from "index/types/markdown";

/** Exterally visible API for datacore. */
export class DatacoreApi {
    public constructor(public core: Datacore) {}

    /** Load a markdown file by full path or link. */
    public page(path: string | Link): MarkdownFile | undefined {
        const realPath = path instanceof Link ? path.path : path;

        return this.core.datastore.load(realPath) as MarkdownFile;
    }
}
