import { markdownImport } from "index/import/markdown";
import { pdfImport } from "index/import/pdf";
import { ImportCommand, MarkdownImportResult, PdfImportResult } from "index/web-worker/message";
import { Transferable } from "index/web-worker/transferable";
import { TFile } from "obsidian";

/** Web worker entry point for importing. */
onmessage = (event) => {
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
            window.pdfjsLib?.getDocument(
                app.vault.getResourcePath(app.vault.getAbstractFileByPath(message.path) as TFile)
            )?.promise.then(pdf => {
                if (pdf) {
                    postMessage(
                        Transferable.transferable({
                            type: "pdf",
                            result: pdfImport(message.path, message.stat, pdf),
                        } as PdfImportResult)
                    );
                }
            })
            
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        postMessage({ $error: error.message });
    }
};
