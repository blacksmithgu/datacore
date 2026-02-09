import { App, Component, Platform } from "obsidian";
import pathutils from "@chainner/node-path";
import { visit, parse } from "recast";
import type { Visitor } from "ast-types/lib/gen/visitor";
import { VisitorMethods } from "ast-types/lib/path-visitor";
import { parse as doParse } from "@babel/parser";
import { stripName, TransformOptions } from "./ast-util";
import type { WorkerRequest, WorkerResponse } from "./worker/types";
import TransformWorker from "api/js/worker/transform.worker";
import DatacorePlugin from "main";
import { transformImportsAndExports } from "./code-transformer";

interface Settings {
    downloadedNpmLibs: TransformOptions["importPaths"];
    latestVersionIndex: TransformOptions["latestVersions"];
}

const DEFAULT_SETTINGS: Settings = {
    downloadedNpmLibs: {},
    latestVersionIndex: {},
};

type PromiseResolver<T> = (value: T | PromiseLike<T>) => void;
type PromiseRejector = (reason?: any) => void;

export default class DatacoreJsTransformer extends Component {
    private _settings: Settings;
    #pending: Map<
        string,
        {
            resolve: PromiseResolver<WorkerResponse>;
            reject: PromiseRejector;
        }
    > = new Map();
    #worker: Worker;
    private app: App;
    static readonly exts = [".js", ".jsx", ".ts", ".tsx", ".mjs"];

    public constructor(public plugin: DatacorePlugin, app: App) {
        super();
        this.app = plugin.app;
    }

    get settings() {
        return this._settings;
    }
    get libDir(): string {
        return this.plugin.manifest.dir + "/libs";
    }

    async onload() {
        await this.loadSettings();
        this.#worker = new TransformWorker();
        this.#worker.onmessage = (evt) => {
            const data = evt.data as WorkerResponse;
            if (this.#pending.has(data.id)) {
                this.#pending.get(data.id)!.resolve(data);
                this.#pending.delete(data.id);
            }
        };
        this.#worker.onerror = (evt) => {
            for (const { reject } of this.#pending.values()) {
                reject(evt.message);
            }
            this.#pending.clear();
        };
        if (Platform.isMobile) {
            (window as any).process = {
                env: {},
            };
        }
    }

    async onunload(): Promise<void> {
        this.saveSettings();
        for (const { reject } of this.#pending.values()) {
            reject("shutting down. bye!");
        }
        this.#pending.clear();
        this.#worker.terminate();
    }

    async loadSettings() {
        if (!(await this.app.vault.adapter.exists(this.libDir))) {
            await this.app.vault.adapter.mkdir(this.libDir);
        }
        if (await this.app.vault.adapter.exists(this.libDir + "/libraries.json")) {
            const settings = await this.app.vault.adapter.read(this.libDir + "/libraries.json");
            this._settings = JSON.parse(settings);
        } else {
            this._settings = DEFAULT_SETTINGS;
            await this.saveSettings();
        }
    }
    async saveSettings() {
			console.log("saving settings", this._settings);
        await this.app.vault.adapter.write(this.libDir + "/libraries.json", JSON.stringify(this._settings));
    }

    async transform(srcPath: string, src: string, jsx: boolean, ts: boolean): Promise<string> {
        if (srcPath.startsWith(".obsidian")) return src;
        const topLevelmports = await this.traverseImports(src);
        const versions = await Promise.all(
            topLevelmports.map((pkg) => {
                let version: string;
                let rpkg = pkg.split("/").slice(0, 2).join("/");

                if (pkg.lastIndexOf("@") > 0) {
                    version = pkg.substring(pkg.lastIndexOf("@") + 1);
                    rpkg = pkg.substring(0, pkg.lastIndexOf("@"));
                } else {
                    version = "latest";
                }
                return [rpkg, version];
            })
        );

        const realVersions = Object.fromEntries(
            await Promise.all(versions.map(async ([k, v]) => [k, await this.addPackage(k, v)]))
        );
				await this.saveSettings();
        /* const entries = Object.fromEntries(
			[...resolved.entries()].map(([k, vv]) => {
				const base = this.libDir + `/${k.replace("latest", vv.version)}`;
				return [
					(() => {
						const lio = k.lastIndexOf("@");
						if (lio > 0) {
							return k.substring(0, lio);
						}
						return k;
					})(),
					{
						files: vv.files.map((a) => this.computeBase(a, base)),
						baseDir: base,
						entryPoint: vv.entryPoint,
					},
				];
			})
		) */
        return transformImportsAndExports(
            src,
            {
                outerBaseDir: pathutils.dirname(srcPath),
                vaultRoot: this.getBasePath(),
                vaultFiles: this.app.vault.getFiles().map((a) => a.path),
                importPaths: { ...this._settings.downloadedNpmLibs },
                dependencies: Object.entries(realVersions).map(([kk, vv]) => `${kk}@${(vv as any).version}`),
                latestVersions: this._settings.latestVersionIndex,
            },
            srcPath
        );
        // return await transformImportsAndExports(src, this, ts, jsx);
    }
    async traverseImports(src: string) {
        const imports = new Set<string>();
        const parsed = parse(src, {
            parser: {
                parse(source: string) {
                    return doParse(source, {
                        plugins: ["jsx", "typescript"],
                        sourceType: "module",
                        allowReturnOutsideFunction: true,
                        allowAwaitOutsideFunction: true,
                        errorRecovery: true,
                        tokens: true,
                    });
                },
            },
        });
        const p = this;
        const visitor: Visitor = {
            visitImportDeclaration(path) {
                const node = path.node;
                const nsrc = node.source.value as string;
                if (
                    !(
                        ["react", "preact", "preact/hooks", "preact/compat", "react-dom", "#datacore"].includes(nsrc) ||
                        p.app.vault.getFileByPath(nsrc) ||
                        nsrc.includes("^") ||
                        nsrc.indexOf("#") > 0 ||
                        nsrc.startsWith("./") ||
                        nsrc.startsWith("..")
                    ) &&
                    node.specifiers
                ) {
                    imports.add(nsrc);
                }
                this.traverse(path, visitor as VisitorMethods);
            },
        };
        visit(parsed, visitor);
        return [...imports];
    }
    async addPackage(src: string, v = "latest"): Promise<Pick<TransformOptions, "dependencies" | "version">> {
        console.log(`${src}@${v}`);
        const key = `${src}@${v}`;
        const latestKey = `${src}@${this._settings.latestVersionIndex[src]}`;
        if (
            (!this._settings.downloadedNpmLibs[key] || !this._settings.downloadedNpmLibs[key]?.files?.length) &&
            (!this._settings.downloadedNpmLibs[latestKey] ||
                !this._settings.downloadedNpmLibs[latestKey]?.files?.length)
        ) {
            const id = crypto.randomUUID();
            const resolved = await new Promise<WorkerResponse>((resolve, reject) => {
                this.#pending.set(id, { resolve, reject });
                this.#worker.postMessage({
                    id,
                    libDir: this.libDir,
                    vaultRoot: this.getBasePath(),
                    vaultFiles: this.app.vault.getFiles().map((a) => a.path),
                    version: v,
                    package: src,
                    lvi: this._settings.latestVersionIndex,
                } as WorkerRequest);
            });
            let sn: Awaited<ReturnType<DatacoreJsTransformer["addPackage"]>> = {
                dependencies: [],
            };
            for (let k in resolved.content) {
                const cur = resolved.content[k];
                if (k.startsWith(src)) {
                    sn = {
                        dependencies: cur.dependencies,
                        version: resolved.version,
                    };
                }
                this._settings.downloadedNpmLibs[k] = {
                    baseDir: cur.baseDir,
                    entryPoint: cur.entryPoint,
                    files: cur.files.map((a) => a.path),
                    latest: cur.latest,
                    dependencies: cur.dependencies,
                };
                this._settings.latestVersionIndex[stripName(k)] = cur.latest;
                for (let f of cur.files) {
                    try {
                        try {
                            await this.app.vault.createFolder(pathutils.dirname(f.path));
                        } catch (e) {}
                        try {
                            await this.app.vault.create(f.path, f.transformed);
                        } catch (e) {
                            await this.app.vault.adapter.remove(f.path);
                            await this.app.vault.adapter.write(f.path, f.transformed);
                        }
                    } catch (ex) {
                        console.error(ex);
                        console.error(ex.stack);
                    }
                }
            }
            return sn;
        }
        const rv = v == "latest" ? this._settings.latestVersionIndex[src] : v;
        const inter = this._settings.downloadedNpmLibs[`${src}@${rv}`];
        return {
            dependencies: inter.dependencies,
            version: rv,
        };
    }

    getBasePath() {
        if (this.app.vault.adapter.getBasePath) {
            return this.app.vault.adapter.getBasePath();
        }
        return this.app.vault.adapter.basePath;
    }
}
