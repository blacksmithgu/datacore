import { markdownImport } from "index/import/markdown";
import { pdfImport } from "index/import/pdf";
import { ImportCommand, MarkdownImportResult, PdfImportResult } from "index/web-worker/message";
import { Transferable } from "index/web-worker/transferable";

/** Web worker entry point for importing. */
onmessage = async (event) => {
    try {
        const message = Transferable.value(event.data) as ImportCommand;

        if (message.type === "markdown") {
            const markdown = markdownImport(message.path, message.contents, message.metadata, message.stat);

            postMessage(
                Transferable.transferable({
                    type: "markdown",
                    result: markdown,
                } as MarkdownImportResult)
            );
        } else if (message.type === "pdf") {
            postMessage(
                Transferable.transferable({
                    type: "pdf",
                    result: await pdfImport(message),
                } as PdfImportResult)
            );
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        postMessage({ $error: error.message });
    }
};
