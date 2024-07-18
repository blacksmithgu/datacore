import { JsonPDF } from "index/types/json/pdf";
import { PDFImport } from "index/web-worker/message";
import { document } from "index/web-worker/polyfill";
import { getDocument, GlobalWorkerOptions, VerbosityLevel, setVerbosityLevel } from "pdfjs-dist";
export async function pdfImport({ path, resourceURI, stat: stats }: PDFImport): Promise<JsonPDF> {
    /** dear reader, i know there is no good explanation for any of the following code... */
		setVerbosityLevel(VerbosityLevel.ERRORS);
		await import("index/web-worker/pdf.worker");
    /** we need to shit-fill window.location to placate the pdf worker */
    globalThis["window"] = {
        // @ts-ignore
        location: "app://obsidian.md",
    };

    /** add `document` shitfill to global object (to placate the pdf worker) */
    Object.assign(globalThis, { document });
    let pdf = await getDocument(resourceURI).promise;
		GlobalWorkerOptions.workerPort?.terminate();
    return {
        $pageCount: pdf.numPages,
        $extension: "pdf",
        $ctime: stats.ctime,
        $mtime: stats.mtime,
        $path: path,
        $size: stats.size,
    };
}
