import pathutils from "@chainner/node-path";
import { Archive, TarEntry } from "@obsidize/tar-browserify";
import pako from "pako";
import { exts, stripName } from "../ast-util";
import { WorkerRequest } from "./types";
type PackageExport = {
	import: string | string[];
	node: string | string[];
	default: string | string[];
};
type PackageExports = {
	[k: string]: PackageExport | string;
};
export const computeName = (f: TarEntry, stripFirst?: boolean): string => {
	let name: string;
	/* if (f.fileNamePrefix && !f.fileName.includes(f.fileNamePrefix)) name = f.fileNamePrefix + "/" + f.fileName;
	else */ name = f.fileName;
	name = name.replaceAll("//", "/");
	return name
		.split("/")
		.slice(name.startsWith("package/") && stripFirst ? 1 : 0)
		.join("/");
};
export const computeBase = (f: TarEntry, base: string): string => {
	const rname = f.fileName
		.split("/")
		.slice(f.fileName.startsWith("package/") ? 1 : 0)
		.join("/");
	return base + "/" + rname;
};
export async function getPackage(
	this: void,
	pkg: string,
	version: string
): Promise<{
	files: TarEntry[];
	latest: string;
	realVersion: string;
}> {
	if (pkg.split("/").length > 2) {
		pkg = pkg.split("/").slice(0, 2).join("/");
	}
	const registryManifest = await fetch(`https://registry.npmjs.org/${pkg}`)
		.then((a) => a.json())
		.catch((a) => {
			console.error(a);
		});
	const latest =
		registryManifest["dist-tags"]?.latest ??
		Object.keys(registryManifest.versions)[
			Object.keys(registryManifest.versions).length - 1
		];
	if (version == "latest") version = latest;
	let tarUrl = registryManifest.versions[version].dist.tarball;
	return {
		latest,
		realVersion: version,
		files: await fetch(tarUrl)
			.catch((e) => {
				console.error(e);
				throw e;
			})
			.then(async (r) => {
				const ab = r.arrayBuffer();
				// console.log(ab);
				const a = await ab;
				const unzipped = pako.ungzip(a);
				const extracted = await Archive.extract(unzipped);
				return await Promise.all(extracted.entries);
			}),
	};
}
export type ResolvedPackage = {
	files: TarEntry[];
	version: string;
	entryPoint: string;
	package: any;
	deps: string[];
};
export async function resolve(
	this: void,
	pkg: string,
	v = "latest",
	lvi: WorkerRequest["lvi"]
): Promise<{
	rootEntry: {
		version: string;
		entryPoint: string;
	};
	latest: Map<string, string>;
	map: Map<string, ResolvedPackage>;
}> {
	const queue: [string, string][] = [[pkg, v]];
	let visited = new Map<string, ResolvedPackage>();
	const latest = new Map<string, string>();
	let rootEntry: { version: string; entryPoint: string };
	while (queue.length > 0) {
		let [cur, version] = queue.shift()!;
		if (!visited.has(`${cur}@${version}`)) {
			const {
				files: tar,
				realVersion,
				latest: lv,
			} = await getPackage(cur, version);
			const packageFile = tar.find(
				(a) =>
					computeName(a).startsWith("package/package.json") ||
					(computeName(a).split("/").length == 2 &&
						computeName(a).endsWith("package.json"))
			);
			if (!packageFile) continue;
			const packageJson = ((s: TarEntry) => {
				const decoder = new TextDecoder("utf-8");
				try {
					return JSON.parse(decoder.decode(s.content!));
				} catch (ex) {
					return null;
				}
			})(packageFile);
			if (!packageJson) continue;
			const modFiles: TarEntry[] = [];

			modFiles.push(...tar);
			if (cur == pkg || cur.startsWith(pkg)) {
				rootEntry = { entryPoint: packageJson.module, version: realVersion };
			}
			const moduleFiles = modFiles.filter(
				(a) =>
					!!packageJson.module &&
					computeName(a).startsWith(
						"package/" +
							pathutils.posix.dirname(packageJson.module.replace(/^\.\//gm, ""))
					)
			);
			const exported = modFiles.filter(
				(a) =>
					!!packageJson.exports &&
					Object.values(packageJson.exports)
						.map((b: PackageExport | [PackageExport, unknown]) => {
							if (Array.isArray(b)) return b[0];
							else return b;
						})
						.map((e) => {
							return Object.fromEntries(
								Object.entries(e).flatMap(([, vc], __i, arr) =>
									(Array.isArray(vc) ? vc : [vc]).map((c) =>
										arr.map(([vk1]) => [vk1, c])
									)
								)
							);
						})
						.flatMap((b) => {
							if (b.import?.startsWith("./")) {
								b.import = b.import.substring(2);
							}
							return b;
						})

						.some((b) => computeName(a).startsWith("package/" + b.import))
			);
			const fileFiles = modFiles.filter(
				(a) =>
					!!packageJson.files &&
					packageJson.files
						.map((b: string) => {
							if (b.startsWith("/")) return "package" + b;
							return "package/" + b;
						})
						.some((b: string) => computeName(a).startsWith(b))
			);
			const filtered = [...moduleFiles, ...exported, ...fileFiles];
			latest.set(cur, lv);
			const mappedPeers = Object.fromEntries(
				await Promise.all(
					Object.entries<string>({ ...packageJson.peerDependencies })
						.filter(
							([kk]) => kk != "react" && kk != "react-dom" && kk != "preact"
						)
						.map(async ([kk, vv]) => {
							const splitSemver = vv
								.replace(/[~\^\*<=>]/gm, "")
								.split(".")
								.map((a) => parseInt(a)) as [number, number, number];
							let latest: string | null = null;
							if (Object.keys(lvi).length) latest = lvi[kk];
							if (!latest || !Object.keys(lvi).length)
								latest = (await getPackage(kk, version)).latest;
							const splitLatest = (latest
								?.split(".")
								?.map((a) => parseInt(a)) ?? [0, 65536, 0]) as [
								number,
								number,
								number
							];
							if (
								splitSemver[0] >= splitLatest[0] &&
								splitSemver[1] <= splitLatest[1]
							)
								return [kk, latest];
							else return [kk, vv];
						})
				)
			);
			visited.set(`${cur}@${realVersion}`, {
				package: packageJson,
				version: packageJson.version,
				entryPoint: packageJson.module || packageJson.main,
				deps: Object.entries({
					...packageJson.dependencies,
					...mappedPeers,
				}).map(([kk, vv]: [string, string]) =>
					[kk, vv.replace(/[~\^\*]/gm, "")].join("@")
				),
				files: (filtered.length ? filtered : tar).filter(
					(a) =>
						(exts.includes(pathutils.extname(computeName(a))) ||
							computeName(a).endsWith("package.json")) &&
						!computeName(a).endsWith("map") &&
						a.isFile() &&
						!computeName(a).includes("umd") &&
						a.content?.byteLength
				),
			});

			queue.push(
				...Object.entries<string>({
					...(packageJson.dependencies ?? {}),
					...mappedPeers,
				})
					.filter(
						([kk]) => kk != "react" && kk != "react-dom" && kk != "preact"
					)
					.map(
						([kk, vv]) =>
							[kk, vv.replace(/[~\^\*<=>]/gm, "")] as [string, string]
					)
			);
		}
	}
	return {
		map: visited,
		rootEntry: rootEntry!,
		latest,
	};
}
