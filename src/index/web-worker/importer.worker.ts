import { markdownImport } from "index/import/markdown";
import { pdfImport } from "index/import/pdf";
import { ImportCommand, MarkdownImportResult, PdfImportResult } from "index/web-worker/message";

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
        } else if (message.type === "pdf") {
            const pdf = await pdfImport(message);

            postMessage({
                type: "pdf",
                result: pdf,
            } as PdfImportResult);
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        postMessage({ $error: error.message });
    }
};
