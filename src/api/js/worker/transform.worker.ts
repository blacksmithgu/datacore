import { WorkerRequest, WorkerResponse } from "./types";
import { stripName } from "../ast-util";
import { transformImportsAndExports } from "../code-transformer";
import { computeBase, computeName, resolve } from "./utils";

const extractVersion = (k: string) => {
	const lio = k.lastIndexOf("@");
	if (lio > 0) {
		return k.substring(lio + 1);
	}
	return k;
};

onmessage = async (e) => {
	const {
		libDir,
		package: paackage,
		version,
		vaultRoot,
		vaultFiles,
		id,
		lvi,
	} = e.data as WorkerRequest;
	const {
		rootEntry,
		map: resolved,
		latest,
	} = await resolve(paackage, version, lvi);
	const finalFiles: WorkerResponse["content"] = {};
	for (let [pkg, info] of resolved.entries()) {
		const base = libDir + `/${pkg}`;
		const strippedName = stripName(pkg);
		/* this._settings.downloadedNpmLibs[strippedName] = {
			baseDir: base,
			files: info.files.map((a) => this.computeBase(a, base)),
			entryPoint: info.entryPoint,
		};	
		await this.app.vault.adapter.mkdir(base); */
		const pkgEntry: WorkerResponse["content"][string]["files"] = [];
		for (const f of info.files) {
			const final = base + "/" + computeName(f, true);
			// if (/pragmatic/i.test(strippedName)) console.log(strippedName, final);
			const text = (() => {
				const decoder = new TextDecoder("utf-8");
				return decoder.decode(f.content ?? new ArrayBuffer(0));
			})();
			if (text.split("\n")[0].match(/@flow/i)) continue;
			if (final.endsWith(".json")) continue;
			try {
				const transformed = transformImportsAndExports(
					text,
					{
						vaultRoot: vaultRoot,
						vaultFiles,
						outerBaseDir: base,
						dependencies: info.deps ?? [],
						latestVersions: Object.fromEntries([...latest.entries()]),
						version: extractVersion(pkg),
						importPaths: Object.fromEntries(
							[...resolved.entries()].map(([k, vv]) => {
								const base = `${libDir}/${k}`;
								return [
									k,
									{
										vaultRoot: vaultRoot,
										baseDir: base,
										files: vv.files.map((a) => computeBase(a, base)),
										entryPoint: vv.entryPoint,
										dependencies: vv.deps ?? [],
										latest: latest.get(stripName(k)) ?? extractVersion(k),
									},
								];
							})
						),
					},
					final,
					{	
					}
				);
				pkgEntry.push({
					path: base + "/" + computeName(f, true),
					transformed,
				});
			} catch (e) {
				continue;
			}
		}
		finalFiles[pkg] = {
			entryPoint: info.entryPoint,
			latest: latest.get(strippedName)!,
			baseDir: base,
			files: pkgEntry,
			dependencies: info.deps,
		};
	}
	const msg: WorkerResponse = {
		id,
		package: paackage,
		version: rootEntry.version,
		content: finalFiles,
		latest: Object.fromEntries(
			Object.entries(finalFiles).map(([ak, av]) => [ak, av.latest])
		),
	};
	postMessage(msg);
};
