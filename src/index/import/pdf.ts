import { JsonPDF } from "index/types/json/pdf";
import { PDFImport } from "index/web-worker/message";
import { document } from "index/web-worker/polyfill";

export async function pdfImport({ path, resourceURI, stat: stats }: PDFImport): Promise<JsonPDF> {
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
                await (await fetch("https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.mjs")).text()
            )
        )
    )}`;
    const rawPdfJs = `data:text/javascript;base64,${btoa(
        unescape(
            encodeURIComponent(
                await (await fetch("https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs")).text()
            )
        )
    )}`;
    let pdfjsLib = await import(rawPdfJs);
    pdfjsLib.GlobalWorkerOptions.workerSrc = rawPdfWorker;
    console.debug(path, resourceURI);
		let actualWorker = new Worker(rawPdfWorker, { type: "module" });
    pdfjsLib.GlobalWorkerOptions.workerPort = actualWorker;

    let { promise } = await pdfjsLib.getDocument(resourceURI);
    let pdf = await promise;
		pdfjsLib.GlobalWorkerOptions.workerPort.terminate()
    return {
        $pageCount: pdf.numPages,
        $extension: "pdf",
        $ctime: stats.ctime,
        $mtime: stats.mtime,
        $path: path,
        $size: stats.size,
    };
}
