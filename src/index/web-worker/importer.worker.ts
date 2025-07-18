import { canvasImport } from "index/import/canvas";
import { markdownImport } from "index/import/markdown";
import { CanvasImportResult, ImportCommand, MarkdownImportResult } from "index/web-worker/message";

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
        } else if (message.type === "canvas") {
            const canvas = canvasImport(message.path, message.contents, message.index, message.stat);

            postMessage({
                type: "canvas",
                result: canvas,
            } as CanvasImportResult);
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        console.error(`Datacore failed to index ${event.data.path}: ${error}`);
        postMessage({ $error: error.message });
    }
};
