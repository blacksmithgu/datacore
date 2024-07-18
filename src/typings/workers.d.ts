/** @hidden */
declare module "index/web-worker/importer.worker" {
    const WorkerFactory: new () => Worker;
    export default WorkerFactory;
	}
declare module "index/web-worker/pdf.worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
	export const WorkerMessageHandler: {
		new(): any;
		[k: string]: any;
	}
}
declare module "pdfjs-dist/pdf.worker";
declare module "pdfjs-dist/shared";