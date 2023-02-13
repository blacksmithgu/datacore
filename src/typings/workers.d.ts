declare module "index/web-worker/importer.worker" {
    const WorkerFactory: new () => Worker;
    export default WorkerFactory;
}
