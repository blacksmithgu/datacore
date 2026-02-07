/** @hidden */
declare module "index/web-worker/importer.worker" {
    const WorkerFactory: new () => Worker;
    export default WorkerFactory;
}

declare module "api/js/worker/transform.worker" {
    const WorkerFactory: new () => Worker;
    export default WorkerFactory;
}
