import jscodeshift from "jscodeshift";
import { ASTPath } from "jscodeshift";
import type { namedTypes as N } from "ast-types";
import { convertExports, convertImportOrRequire, convertImportToDcRequire, convertRelative, convertRequireCallToImport, createTransformContext, ExportArray, ImportArray, mustIdent, replaceJsxElement, replaceWithIdent, TransformOptions } from "./ast-util";

export function transformImportsAndExports(
	source: string,
	opts: TransformOptions,
	filename?: string
): string {
	const j = jscodeshift.withParser("tsx");
	const ctx = createTransformContext(j);
	const n = j.types.namedTypes;
	const isIdentifier = (node: any): node is N.Identifier =>
		n.Identifier.check(node as N.Node);
	const isStringLiteral = (node: any): node is N.StringLiteral =>
		n.StringLiteral.check(node as N.Node);
	const isMemberExpression = (node: any): node is N.MemberExpression =>
		n.MemberExpression.check(node as N.Node);
	const isOptionalMemberExpression = (
		node: any
	): node is N.OptionalMemberExpression =>
		n.OptionalMemberExpression.check(node as N.Node);
	const isObjectProperty = (node: any): node is N.ObjectProperty =>
		n.ObjectProperty.check(node as N.Node);
	const root = j(source);
	let dcImports: N.ImportSpecifier[] = [];
	let dcHooks: N.ImportSpecifier[] = [];
	let dcExports: ExportArray = [];
	let allDecls: N.ExportAllDeclaration[] = [];

	root.find(j.ImportDeclaration).forEach((path: ASTPath<N.ImportDeclaration>) => {
		const node = path.node;
		const src = String(node.source.value);
		const res = convertImportOrRequire(
			ctx,
			src,
			node.specifiers as ImportArray,
			opts,
			filename
		);
		dcImports.push(...res.dcImports);
		dcHooks.push(...res.hooks);
		if (res.shouldRemove) {
			j(path).remove();
		} else if (res.specs.length) {
			path.replace(...res.specs);
		} else {
			j(path).remove();
		}
	});

	root.find(j.ExpressionStatement).forEach(
		(path: ASTPath<N.ExpressionStatement>) => {
		const node = path.node;
		if (n.CallExpression.check(node.expression)) {
			const callExpr = node.expression as N.CallExpression;
			const args = callExpr.arguments;
			if (
				n.MemberExpression.check(callExpr.callee) &&
				args.length == 3 &&
				isIdentifier(args[0]) &&
				args[0].name == "exports"
			) {
			const ident = mustIdent(
				ctx,
				callExpr.arguments[1] as N.StringLiteral
			);
			let value: N.ExpressionStatement | null = null;
			if (ident.name != "__esModule") {
				const objEx = callExpr.arguments[2] as N.ObjectExpression;
				const val = objEx.properties.find((prop): prop is N.ObjectProperty => {
					if (!isObjectProperty(prop)) return false;
					const key = (prop as N.ObjectProperty).key;
					if (!isIdentifier(key)) return false;
					return key.name == "value" || key.name == "get";
				});
				if (val) {
					const key = val.key as N.Identifier;
					if (key.name == "value") {
						value = j.expressionStatement(val.value as any);
					} else if (key.name == "get") {
						const body = val.value as N.FunctionExpression;
						value = j.expressionStatement(
							j.callExpression(
								j.functionExpression(
									null,
									[],
									body.body,
									body.generator,
									body.async
								),
								[]
							)
						);
					}
					dcExports.push(
						j.exportNamedDeclaration(
							j.variableDeclaration("const", [
								j.variableDeclarator(ident, value?.expression),
							])
						)
					);
				}
				j(path).remove();
			} else {
				j(path).remove();
			}
			}
		}
	});

	root.find(j.VariableDeclaration).forEach(
		(path: ASTPath<N.VariableDeclaration>) => {
		const node = path.node;
		const res = convertRequireCallToImport(ctx, node);
		if (res.length) {
			path.replace(
				...res.map(([mod, specs]) =>
					j.importDeclaration(specs, j.stringLiteral(mod))
				)
			);
		}
	});

	root.find(j.CallExpression).forEach((path: ASTPath<N.CallExpression>) => {
		const node = path.node;
		const calleeIdent = isIdentifier(node.callee) ? node.callee : null;
		if (
			calleeIdent &&
			(dcImports.find(
				(a) =>
					n.Identifier.check(a.imported) &&
					a.imported.name == calleeIdent.name
			) != null ||
				dcHooks.find(
					(a) =>
						n.Identifier.check(a.imported) &&
						a.imported.name == calleeIdent.name
				) != null)
		) {
			const nm = j.memberExpression(ctx.dc, calleeIdent);
			path.replace(j.callExpression(nm, node.arguments));
		} else if (
			isIdentifier(node.callee) &&
			node.callee.name == "require" &&
			isStringLiteral(node.arguments[0])
		) {
			let entry = convertRelative(
				(node.arguments[0] as N.StringLiteral).value,
				opts,
				filename
			);
			if (entry) {
				const awaiter = j.awaitExpression(
					j.callExpression(j.memberExpression(ctx.dc, ctx.dcRequire), [
						j.stringLiteral(entry!),
					])
				);
				path.replace(awaiter);
			}
		}
	});

	root.find(j.AssignmentExpression).forEach(
		(path: ASTPath<N.AssignmentExpression>) => {
		const node = path.node;
		const isModuleExports = (
			target: N.Node | null | undefined
		): target is N.MemberExpression | N.OptionalMemberExpression => {
			if (!target) return false;
			if (isMemberExpression(target)) {
				if (isIdentifier(target.property) && isIdentifier(target.object)) {
					return (
						target.object.name == "module" &&
						target.property.name == "exports"
					);
				} else if (isMemberExpression(target.object)) {
					return isModuleExports(target.object);
				}
			} else if (isOptionalMemberExpression(target)) {
				if (isIdentifier(target.property) && isIdentifier(target.object)) {
					return (
						target.object.name == "module" &&
						target.property.name == "exports"
					);
				} else if (
					isOptionalMemberExpression(target.object) ||
					isMemberExpression(target.object)
				) {
					return isModuleExports(target.object);
				}
			}
			return false;
		};
		const isExports = (
			target: N.Node | null | undefined
		): target is N.MemberExpression | N.OptionalMemberExpression => {
			if (!target) return false;
			if (isMemberExpression(target)) {
				if (isIdentifier(target.property) && isIdentifier(target.object)) {
					return target.object.name == "exports";
				}
			} else if (isOptionalMemberExpression(target)) {
				if (isIdentifier(target.property) && isIdentifier(target.object)) {
					return target.object.name == "exports";
				}
			}
			return false;
		};
		if (isModuleExports(node.left)) {
			let me = node.left as N.MemberExpression;
			if (isMemberExpression(me.object) && isIdentifier(me.object.property)) {
				const prop = isIdentifier(me.property)
					? me.property
					: j.identifier((me.property as N.StringLiteral).value);
				const vd = j.variableDeclaration("const", [
					j.variableDeclarator(prop, node.right as any),
				]);
				const final = j.exportNamedDeclaration(vd);
				dcExports.push(final);
				j(path).remove();
			} else {
				const final = j.exportDefaultDeclaration(node.right as any);
				dcExports.push(final);
				const parent = path.parentPath ?? path.parent;
				if (
					parent &&
					(n.ExpressionStatement.check(parent.node) ||
						n.AssignmentExpression.check(parent.node) ||
						n.ConditionalExpression.check(parent.node))
				) {
					j(parent).remove();
				} else {
					j(path).remove();
				}
			}
		} else if (isExports(node.left)) {
			let me = node.left as N.MemberExpression;
			const prop = isIdentifier(me.property)
				? me.property
				: j.identifier((me.property as N.StringLiteral).value);
			const vd = j.variableDeclaration("const", [
				j.variableDeclarator(prop, node.right as any),
			]);
			const final = j.exportNamedDeclaration(vd);
			dcExports.push(final);

			const parent = path.parentPath ?? path.parent;
			if (
				parent &&
				(n.ExpressionStatement.check(parent.node) ||
					n.AssignmentExpression.check(parent.node) ||
					n.ConditionalExpression.check(parent.node) ||
					n.ObjectProperty.check(parent.node))
			) {
				if (n.ObjectProperty.check(parent.node)) {
					path.replace(j.nullLiteral());
				} else {
					parent.replace(j.expressionStatement(j.nullLiteral()));
				}
			} else {
				j(path).remove();
			}
		}
	});

	root.find(j.JSXOpeningElement).forEach(
		(path: ASTPath<N.JSXOpeningElement>) => {
		let toReplace = replaceJsxElement(ctx, path, dcImports);
		if (toReplace)
			path.replace(
				j.jsxOpeningElement(toReplace, path.node.attributes, path.node.selfClosing)
			);
	});

	root.find(j.JSXClosingElement).forEach(
		(path: ASTPath<N.JSXClosingElement>) => {
		let toReplace = replaceJsxElement(ctx, path, dcImports);
		if (toReplace) path.replace(j.jsxClosingElement(toReplace));
	});

	root.find(j.ExportNamedDeclaration).forEach(
		(path: ASTPath<N.ExportNamedDeclaration>) => {
		const node = path.node;
		if (node.declaration) {
			dcExports.push(node);
			path.replace(node.declaration);
		} else {
			const specifiers = node.specifiers ?? [];
			if (node.source && specifiers.length) {
				const entry = convertRelative(String(node.source.value), opts, filename);
				if (entry) {
				const awaiter = j.awaitExpression(
					j.callExpression(j.memberExpression(ctx.dc, ctx.dcRequire), [
						j.stringLiteral(entry!),
					])
				);
				const specs = replaceWithIdent(
					ctx,
					specifiers as N.ExportSpecifier[],
					awaiter
				);
				const exportSpecifiers = n.VariableDeclaration.check(specs)
					? (specs as N.VariableDeclaration).declarations.flatMap(
							(a) => {
							const fin: N.ExportSpecifier[] = [];

							if (n.Identifier.check(a)) {
								fin.push(j.exportSpecifier(a, a));
							} else if (n.VariableDeclarator.check(a) && n.ObjectPattern.check(a.id)) {
								const objPattern = a.id as N.ObjectPattern;
								fin.push(
									...objPattern.properties.flatMap((b: any) => {
										if (
											n.ObjectProperty.check(b as N.Node) &&
											n.Identifier.check((b as N.ObjectProperty).value) &&
											(n.Identifier.check((b as N.ObjectProperty).key) ||
												n.StringLiteral.check((b as N.ObjectProperty).key))
										) {
											return [
												j.exportSpecifier(
													(b as N.ObjectProperty).value as any,
													(b as N.ObjectProperty).key as any
												),
											];
										}
										return [];
									})
								);
							}
							return fin;
						}
						)
					: [];
				dcExports.push(j.exportNamedDeclaration(null, exportSpecifiers));
					path.replace(specs);
				} else {
					dcExports.push(node);
					j(path).remove();
				}
			} else {
				dcExports.push(node);
				j(path).remove();
			}
		}
	});

	root.find(j.ExportAllDeclaration).forEach(
		(path: ASTPath<N.ExportAllDeclaration>) => {
		allDecls.push(path.node);
		j(path).remove();
	});

	root.find(j.ExportDefaultDeclaration).forEach(
		(path: ASTPath<N.ExportDefaultDeclaration>) => {
		const node = path.node;
		dcExports.push(node);
		j(path).remove();
	});

	const originalExports = convertExports(
		ctx,
		dcExports.filter((a) => !(a as any).source),
		opts,
		filename
	);

	opts.isSecondPass = true;
	const aggregatedAll = j.objectExpression(
		allDecls.map((a) => {
			const convertedSource = convertRelative(
				String(a.source.value),
				opts,
				filename
			);
			if (convertedSource) {
				const spreads = j.spreadElement(
					convertImportToDcRequire(ctx, j.stringLiteral(convertedSource!))
				);
				return spreads;
			} else {
				return j.spreadElement(j.objectExpression([]));
			}
		})
	);
	if (originalExports.argument && n.ObjectExpression.check(originalExports.argument)) {
		(originalExports.argument as N.ObjectExpression).properties.push(
			...aggregatedAll.properties
		);
	}

	root.get().node.program.body.push(originalExports);
	return root.toSource();
}

