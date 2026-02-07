import pathutils from "@chainner/node-path";
import { types } from "recast";
import { namedTypes as N } from "ast-types";
import type {NodePath} from "ast-types/lib/node-path";
import * as K from "ast-types/lib/gen/kinds";
const b = types.builders;
const t = types.namedTypes;

export type LVal =
	| N.Identifier
	| N.MemberExpression
	| N.RestElement
	| N.AssignmentPattern
	| N.ArrayPattern
	| N.ObjectPattern
	| N.TSParameterProperty
	| N.TSAsExpression
	| N.TSSatisfiesExpression
	| N.TSTypeAssertion
	| N.TSNonNullExpression;

export type ImportArray = (
	| N.ImportSpecifier
	| N.ImportDefaultSpecifier
	| N.ImportNamespaceSpecifier
)[];
export type ExportArray = (
	| N.ExportDefaultDeclaration
	| N.ExportNamedDeclaration
)[];

export const exts = [
	".js",
	".jsx",
	".ts",
	".tsx",
	".mjs",
	".d.ts",
	"package.json",
];
export interface TransformOptions {
	vaultFiles: string[];
	vaultRoot: string;
	outerBaseDir: string;
	isSecondPass?: boolean;
	version?: string;
	importPaths: {
		[k: string]: {
			baseDir: string;
			files: string[];
			entryPoint: string;
			dependencies: string[];
			latest: string;
		};
	};
	dependencies: string[];
	latestVersions: {
		[k: string]: string;
	};
}
export interface TransformRequest {
	possiblePaths: string[];
}

export const dc = b.identifier("dc");
export const dcJsx = b.jsxIdentifier("dc");
export const dcRequire = b.identifier("require");

export const stripName = (k: string) => {
	const lio = k.lastIndexOf("@");
	if (lio > 0) {
		return k.substring(0, lio);
	}
	return k;
};

export const dcMember = (ident: N.Identifier) => b.memberExpression(dc, ident);
export const mustIdent = (
	item: N.StringLiteral | N.Identifier | N.JSXIdentifier | N.TSTypeParameter
) => {
	if (t.StringLiteral.check(item)) return b.identifier(item.value as string);
	else return item;
};
export function replaceWithIdent(
	specs: ImportArray | N.ExportSpecifier[],
	src: K.ExpressionKind
) {
	let filteredSpecs =specs
		.filter(
			(s) =>
				(t.ImportSpecifier.check(s) &&
					mustIdent(s.imported).name != "default") ||
				(t.ExportSpecifier.check(s) && mustIdent(s.local!).name != "default")
		) as (N.ImportSpecifier | N.ExportSpecifier)[];
	let mappedSpecs = filteredSpecs
		.map((s: N.ImportSpecifier | N.ExportSpecifier) => {
			let i: N.Identifier | N.JSXIdentifier | N.TSTypeParameter;
			if (t.ExportSpecifier.check(s)) i = mustIdent(s.exported);
			else i = mustIdent(s.imported);
			const prop = b.objectProperty(i, s.local ?? i);
			prop.shorthand = i.name == s.local?.name;
			return prop;
		});

	let defaults = specs
		.filter(
			(s) =>
				t.ImportNamespaceSpecifier.check(s) ||
				t.ImportDefaultSpecifier.check(s) ||
				(t.ExportSpecifier.check(s) && mustIdent(s.exported).name == "default")
		)
		.map((s) => s.local!);
	let destructuredDefaultImports = specs.filter(
		(s) =>
			t.ImportSpecifier.check(s) && mustIdent(s.imported!).name == "default"
	) as N.ImportSpecifier[];
	let destructuredDefaultExports = specs.filter(
		(s) => t.ExportSpecifier.check(s) && mustIdent(s.local!).name == "default"
	) as N.ExportSpecifier[];
	let mappedDefaults = defaults.map((m) => b.variableDeclarator(m, src));
	let declarators: N.VariableDeclarator[] = [];
	declarators.push(
		...destructuredDefaultImports.map((a) =>
			b.variableDeclarator(a.local ?? a.imported, src)
		)
	);
	declarators.push(
		...destructuredDefaultExports.map((a) =>
			b.variableDeclarator(mustIdent(a.exported), src)
		)
	);
	if (mappedSpecs.length)
		declarators.push(b.variableDeclarator(b.objectPattern(mappedSpecs), src));
	declarators.push(...mappedDefaults);
	return declarators.length
		? b.variableDeclaration("const", declarators)
		: b.expressionStatement(src);
}

export function replaceJsxElement(
	path: NodePath<N.JSXOpeningElement | N.JSXClosingElement>,
	dcImports: N.ImportSpecifier[]
) {
	const node = path.node;
	const nname = node.name as N.JSXIdentifier;
	if (
		dcImports.find(
			(a) => t.Identifier.check(a.imported) && a.imported.name == nname.name
		)
	) {
		let me = b.jsxMemberExpression(dcJsx, b.jsxIdentifier(nname.name));
		return me;
	}
	return null;
}
export function convertImportToDcRequire(src: string | N.StringLiteral) {
	const finalSource =
		typeof src != "string" && t.StringLiteral.check(src)
			? src
			: b.stringLiteral(src);
	return b.awaitExpression(
		b.callExpression(b.memberExpression(dc, dcRequire), [finalSource])
	);
}
export function declToObjectProperty(decl: N.Declaration | null): N.ObjectProperty[] {
	if (decl == null) return [];
	if (t.VariableDeclaration.check(decl)) {
		return decl.declarations.map((a) => {
			const rid =
				t.Identifier.check(a) ||
				t.JSXIdentifier.check(a) ||
				t.TSTypeParameter.check(a)
					? a
					: a.id;
			const rinit = t.VariableDeclarator.check(a) ? a.init : rid;
			let prop = b.objectProperty(
				rid as K.IdentifierKind,
				rinit as K.ExpressionKind
			);
			prop.shorthand = true;
			return prop;
		});
	} else if (t.FunctionDeclaration.check(decl)) {
		let prop = b.objectProperty(decl.id!, decl.id!);
		prop.shorthand = true;
		return [prop];
	}
	return [];
}

export function convertExports(
	exports: ExportArray,
	opts: TransformOptions,
	filename?: string
) {
	let singleDefault: K.ExpressionKind | null = null;
	const objEx = b.objectExpression(
		exports
			.flatMap<N.ObjectProperty | N.SpreadElement | null>((e) => {
				if (t.ExportNamedDeclaration.check(e)) {
					if (Array.isArray(e.specifiers) && e.specifiers?.length) {
						return (
							e.specifiers as (
								| N.ExportSpecifier
								| N.ExportNamespaceSpecifier
								| N.ExportDefaultSpecifier
							)[]
						).map((a) => {
							if (t.ExportNamespaceSpecifier.check(a)) {
								const convertedSource = convertRelative(
									(e.source as N.StringLiteral).value,
									opts,
									filename
								);
								return b.objectProperty(
									a.exported,
									convertImportToDcRequire(b.stringLiteral(convertedSource!))
								);
							} else if (t.ExportSpecifier.check(a)) {
								if ((a.exported as N.Identifier).name == "default") {
									singleDefault = a.local!;
									return null;
								}
								return b.objectProperty(a.exported, a.local ?? a.exported);
							}
							return null;
						});
					} else if (declToObjectProperty(e.declaration!).length) {
						return declToObjectProperty(e.declaration!);
					}
				} else {
					if (!singleDefault) singleDefault = e.declaration as K.ExpressionKind;
				}
				return [];
			})
			.filter((a) => !!a)
	);
	const sd = singleDefault as any;
	if (sd) {
		if (t.FunctionDeclaration.check(sd) || t.VariableDeclaration.check(sd)) {
			if (t.FunctionDeclaration.check(sd)) {
				return b.returnStatement(
					b.functionExpression(
						sd.id,
						sd.params,
						sd.body,
						sd.generator,
						sd.async
					)
				);
			}
			return b.returnStatement(singleDefault);
		} else if (t.Expression.check(sd)) {
			return b.returnStatement(singleDefault);
		}
	}
	const rs = b.returnStatement(objEx);
	return rs;
}

const sep_regex = /\/|\\/;
export function convertRelative(
	src: string,
	opts: TransformOptions,
	filename?: string
) {
	const { importPaths, version, dependencies: deps } = opts;
	let ext = pathutils.extname(filename!);
	if (ext == ".ts" && filename?.endsWith(".d.ts")) {
		ext = ".d.ts";
		// ext = ".js"
	}
	if (
		filename &&
		(pathutils.isAbsolute(filename) || pathutils.win32.isAbsolute(filename))
	)
		filename = filename
			.split(sep_regex)
			.slice(filename.split(sep_regex).indexOf(".obsidian"))
			.join("/");
	let base = src;
	let key = `${base}@${version}`;
	let aux: string | null = null;
	if (
		src.split("/").length > 2 &&
		!src.startsWith("./") &&
		!src.startsWith("..")
	) {
		base = src.split("/").slice(0, 2).join("/");
		key = `${base}@${version}`;
		if (!importPaths[key]) key = deps.find((a) => a.startsWith(base))!;
		aux = src.split("/").slice(2).join("/");
	}
	if (!importPaths[key] && !src.startsWith("./") && !src.startsWith("..")) {
		let nk = deps.find((a) => {
			return a.startsWith(base);
		});
		if (nk) key = nk;
		else key = `${base}@${opts.latestVersions[base]}`;
	}
	if (!aux && importPaths[key]?.entryPoint) {
		return pathutils.posix.join(
			importPaths[key].baseDir,
			importPaths[key].entryPoint
		);
	}

	let entry: string | undefined = importPaths[key]?.files?.find(
		(a) =>
			a.endsWith(importPaths[key].entryPoint) &&
			!a.includes("cjs") &&
			exts.includes(pathutils.extname(a))
	);
	if (aux) {
		const split = aux.split("/");
		/* entry = importPaths[key]?.files?.map((a) => {
			return [a, aux
				.split("/")
				.filter(
					(b, i, arr) =>
						exts.some((c) => a.endsWith(b + c)) || a.includes(`/${b}/`) || a.includes(`${b}/`)
				).length] as [string, number];
		}).reduce((pv, cv) => pv[1] <= cv[1] ? cv : pv, ["", 0])[0]; */
		const lastSegment = split[split.length - 1];
		const rest = split.slice(0, -1);
		entry = importPaths[key]?.files?.find(
			(a) =>
				exts.some((b) => a.endsWith(lastSegment + b)) &&
				rest.every((b) => a.includes(`/${b}/`))
		);
	}
	if ((src.startsWith("./") || src.startsWith("..")) && filename) {
		entry = pathutils
			.join(pathutils.dirname(filename), src)
			.replace(/\\/g, "/");

		if (!exts.includes(pathutils.extname(entry))) {
			const tmp = entry.replace(/\\/g, "/");
			let splitDir = pathutils.dirname(tmp).split(/\/|\\/);
			let chopped = splitDir.slice(splitDir.indexOf("libs") + 1);
			if (!chopped.length) {
				chopped = splitDir;
			}

			// scuffed sliding window algorithm i guess..?
			let libName: string | null = null;
			outer: for (let i = 0; i < chopped.length; i++) {
				for (let j = 1; j <= 2; j++) {
					const libStart = chopped.slice(0, j).join("/");
					if (libStart in importPaths) {
						libName = libStart;
						break outer;
					}
				}
			}
			if (libName && (key.startsWith("./") || key.startsWith(".."))) {
				key = libName;
			}

			entry = importPaths[libName!]?.files?.find(
				(a) => a != filename && a == pathutils.posix.normalize(tmp + ext)
			);

			if (!entry) {
				console.warn("undefined relative entry ->", src, `(${filename})`);
			}
		}
	}
	if (!entry)
		entry =
			importPaths[key] && importPaths[key].entryPoint
				? importPaths[key]?.baseDir + "/" + importPaths[key]?.entryPoint
				: undefined;
	if (!entry && importPaths[key]?.files?.length == 1) {
		entry = importPaths[key].files[0];
	}
	if (!entry) {
		if (aux) {
			entry = importPaths[key]?.files?.find((a) =>
				aux
					.split("/")
					.every(
						(b, i, arr) =>
							exts.some((c) => a.endsWith(b + c)) || a.includes(`${b}/`)
					)
			);
		}
	}
	if (!entry) {
		entry = importPaths[key]?.files?.find(
			(a) => a.endsWith("index.js") && !a.includes("cjs")
		);
	}
	return entry;
}
export type ImportConvertResult = {
	hooks: N.ImportSpecifier[];
	otherReact: ImportArray;
	specs: N.Node[];
	dcImports: N.ImportSpecifier[];
	shouldRemove: boolean;
};
export function convertRequireCallToImport(
	node: N.VariableDeclaration | N.AssignmentExpression
): [mod: string, specs: ImportArray][] {
	const ret: [string, ImportArray][] = [];
	if (t.VariableDeclaration.check(node)) {
		for (let d of node.declarations) {
			const ad = d as N.VariableDeclarator;
			if (
				t.CallExpression.check(ad.init) &&
				t.Identifier.check(ad.init.callee) &&
				ad.init.callee.name == "require"
			) {
				let mod = (ad.init.arguments[0] as N.StringLiteral).value;
				let specs: ImportArray = [];
				if (t.ObjectPattern.check(ad.id)) {
					for (let p of ad.id.properties) {
						if (t.RestElement.check(p)) {
						} else {
							const prop = p as N.ObjectProperty;
							specs.push(
								b.importSpecifier(
									prop.value as K.IdentifierKind,
									prop.key as K.IdentifierKind
								)
							);
						}
					}
				} else if (t.Identifier.check(ad.id)) {
					specs.push(b.importDefaultSpecifier(ad.id));
				}
				ret.push([mod, specs]);
			}
		}
	} /* else if (t.isAssignmentExpression(node)) {
		if (t.isIdentifier(node.left)) {
			ret.specs.push(b.importDefaultSpecifier(node.left));
		} 
	}*/
	return ret;
}
export function convertImportOrRequire(
	src: string,
	specifiers: ImportArray = [],
	opts: TransformOptions,
	filename?: string
): ImportConvertResult {
	let specs: ImportConvertResult = {
		hooks: [],
		otherReact: [],
		specs: [],
		dcImports: [],
		shouldRemove: false,
	};
	if (["react", "preact", "preact/hooks", "preact/compat"].includes(src)) {
		let hooks = specifiers.filter(
			(s) =>
				t.ImportSpecifier.check(s) &&
				t.Identifier.check(s.imported) &&
				s.imported.name.startsWith("use")
		) as N.ImportSpecifier[];
		let other: ImportArray = specifiers.filter(
			(
				s:
					| N.ImportSpecifier
					| N.ImportDefaultSpecifier
					| N.ImportNamespaceSpecifier
					| N.ImportSpecifier
			) =>
				(t.ImportSpecifier.check(s) &&
					t.Identifier.check(s.imported) &&
					!(s.imported.name as string).startsWith("use")) ||
				t.ImportDefaultSpecifier.check(s) ||
				t.ImportNamespaceSpecifier.check(s)
		) as ImportArray;
		specs.hooks.push(...hooks);
		/* let hookSpecs = replaceWithIdent(
					hooks,
					dcMember(b.identifier("hooks"))
				); */
		let otherSpecs = replaceWithIdent(
			specifiers,
			dcMember(b.identifier("preact"))
		);
		const finalReplacement = [];
		// if (hookSpecs.declarations.length) finalReplacement.push(hookSpecs);
		finalReplacement.push(otherSpecs);
		specs.specs = finalReplacement;
	} else if (src == "react-dom") {
		specs.specs = [
			replaceWithIdent(
				specifiers as ImportArray,
				dcMember(b.identifier("preact"))
			),
		];
	} else if (src.startsWith("react/jsx-")) {
		specs.specs = [
			replaceWithIdent(
				specifiers as ImportArray,
				dcMember(b.identifier("jsxRuntime"))
			),
		];
	} else if (src === "#datacore") {
		specs.dcImports.push(...(specifiers as N.ImportSpecifier[]));
		specs.shouldRemove = true;
	} else if (
		opts.vaultFiles.find((a) => a.startsWith(src)) ||
		src.includes("#") ||
		src.includes("^")
	) {
		const awaiter = b.awaitExpression(
			b.callExpression(b.memberExpression(dc, dcRequire), [
				b.stringLiteral(src),
			])
		);
		specs.specs = [replaceWithIdent(specifiers as ImportArray, awaiter)];
	} else {
		let entry = convertRelative(src, opts, filename);
		if (entry) {
			const awaiter = b.awaitExpression(
				b.callExpression(b.memberExpression(dc, dcRequire), [
					b.stringLiteral(entry!),
				])
			);
			specs.specs = [replaceWithIdent(specifiers as ImportArray, awaiter)];
		} else {
			specs.shouldRemove = true;
		}
	}
	return specs;
}

