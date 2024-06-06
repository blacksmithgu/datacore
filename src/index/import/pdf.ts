import { JsonPDF } from "index/types/json/pdf";
import { PDFImport } from "index/web-worker/message";
import { getDocument } from "pdfjs-dist";

/** Polyfill for Promise.withResolvers for pdfjs. */
if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = function() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        return { promise, resolve, reject };
    }
}

export async function pdfImport({ path, resourceURI, stat: stats }: PDFImport): Promise<JsonPDF> {
    console.log(resourceURI);
    let { promise } = await getDocument(resourceURI);
    const pdf = await promise;

    return {
        $pageCount: pdf.numPages,
        $extension: "pdf",
        $ctime: stats.ctime,
        $mtime: stats.mtime,
        $path: path,
        $size: stats.size,
    };
}
