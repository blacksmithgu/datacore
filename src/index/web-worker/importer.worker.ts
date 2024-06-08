import { markdownImport } from "index/import/markdown";
import { ImportCommand, MarkdownImportResult } from "index/web-worker/message";

/** Web worker entry point for importing. */
onmessage = async (event) => {
    try {
        const message = event.data as ImportCommand;

        if (message.type === "markdown") {
            const markdown = markdownImport(message.path, message.contents, message.metadata, message.stat);

            postMessage({
                type: "markdown",
                result: markdown,
            } as MarkdownImportResult);
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        console.error(`Datacore Indexer failed to index ${event.data.path}: ${error}`);
        postMessage({ $error: error.message });
    }
};
