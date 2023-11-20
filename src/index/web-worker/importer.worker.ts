import { markdownImport } from "index/import/markdown";
import { pdfImport } from "index/import/pdf";
import { ImportCommand, MarkdownImportResult, PdfImportResult } from "index/web-worker/message";
import { Transferable } from "index/web-worker/transferable";
import { document } from "./polyfill";

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
            /** dear reader, i know there is no good explanation for any of the following code... */

            /** we need to shit-fill window.location to placate the pdf worker */
            globalThis["window"] = {
                // @ts-ignore
                location: "app://obsidian.md",
            };

            /** add `document` shitfill to global object (to placate the pdf worker) */
            Object.assign(globalThis, { document });
            const rawPdfWorker = `data:text/javascript;base64,${btoa(
                unescape(
                    encodeURIComponent(
                        await (
                            await fetch("https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.mjs")
                        ).text()
                    )
                )
            )}`;
            const rawPdfJs = `data:text/javascript;base64,${btoa(
                unescape(
                    encodeURIComponent(
                        await (
                            await fetch("https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs")
                        ).text()
                    )
                )
            )}`;
            let pdfjsLib = await import(rawPdfJs)
            pdfjsLib.GlobalWorkerOptions.workerSrc = rawPdfWorker;
            console.debug(message.path, message.resourceURI);
            pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(rawPdfWorker, { type: "module" });

            let { promise } = await pdfjsLib.getDocument(message.resourceURI);
            let pdf = await promise;

            postMessage(
                Transferable.transferable({
                    type: "pdf",
                    result: pdfImport(message.path, message.stat, pdf),
                } as PdfImportResult)
            );
        } else {
            postMessage({ $error: "Unsupported import method." });
        }
    } catch (error) {
        postMessage({ $error: error.message });
    }
};
