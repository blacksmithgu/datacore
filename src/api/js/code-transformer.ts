import { ParserOptions } from "@babel/parser";
import { parse, visit, types, print } from "recast";
import { parse as doParse } from "@babel/parser";
import * as K from "ast-types/lib/gen/kinds";
import type { namedTypes as N, Visitor } from "ast-types";
import {
    convertExports,
    convertImportOrRequire,
    convertImportToDcRequire,
    convertRelative,
    convertRequireCallToImport,
    dc,
    dcRequire,
    ExportArray,
    LVal,
    mustIdent,
    replaceJsxElement,
    replaceWithIdent,
    TransformOptions,
} from "./ast-util";
import { VisitorMethods } from "ast-types/lib/path-visitor";
const b = types.builders;
const t = types.namedTypes;

export function transformImportsAndExports(
    src: string,
    opts: TransformOptions,
    srcPath: string,
    other: ParserOptions = {}
) {
    let dcImports: N.ImportSpecifier[] = [];
    let dcHooks: N.ImportSpecifier[] = [];
    let dcExports: ExportArray = [];
    let allDecls: N.ExportAllDeclaration[] = [];
    const ast = parse(src, {
        parser: {
            parse(source: string) {
                return doParse(source, {
                    ...other,
                    plugins: ["jsx", "typescript"],
                    allowAwaitOutsideFunction: true,
                    allowReturnOutsideFunction: true,
                    errorRecovery: true,
                    sourceType: "module",
										tokens: true
                });
            },
        },
    });
    const visitor: Visitor = {
        visitImportDeclaration(path) {
            let node = path.node;
            let src: string = node.source.value as string;
            const res = convertImportOrRequire(src, node.specifiers, opts, srcPath);
            dcImports.push(...res.dcImports);
            dcHooks.push(...res.hooks);
            if (res.shouldRemove) {
                path.replace();
            } else {
                path.replace(...res.specs);
            }
            /* if (plugin != null && src.split("/").length == 2) */
            /* else if (resolveRelativeTo != null) {
					if (src.startsWith("./") || src.startsWith("..")) {
						let apath = pathutils.join(resolveRelativeTo, src);
						const awaiter = b.awaitExpression(
							b.callExpression(b.memberExpression(dc, dcRequire), [
								b.stringLiteral(apath),
							])
						);
						const specs = replaceWithIdent(
							node.specifiers as ImportArray,
							awaiter
						);
						path.replaceWith(specs);
					} else if (plugin != null && src.split("/").length == 2) {
						otherImports.push(src);
					}
				} */
            //console.log("p", node, dcImports);
						this.traverse(path, visitor as VisitorMethods);
        },
        visitExpressionStatement(path) {
            const node = path.node;
            if (t.CallExpression.check(node.expression)) {
                if (t.MemberExpression.check(node.expression.callee)) {
                    if (t.Identifier.check(node.expression.arguments[0])) {
                        if (node.expression.arguments[0].name == "exports" && node.expression.arguments.length == 3) {
                            const ident = mustIdent(node.expression.arguments[1] as N.StringLiteral);
                            let value: N.ExpressionStatement | null = null;
                            if (ident.name != "__esModule") {
                                const objEx = node.expression.arguments[2] as N.ObjectExpression;
                                const val: N.ObjectProperty | undefined = objEx.properties.find(
                                    (a) =>
                                        t.ObjectProperty.check(a) &&
                                        t.Identifier.check(a.key) &&
                                        (a.key.name == "value" || a.key.name == "get")
                                ) as N.ObjectProperty;
                                if (val) {
                                    const key = val.key as N.Identifier;
                                    if (key.name == "value") {
                                        value = b.expressionStatement(val.value as K.ExpressionKind);
                                    } else if (key.name == "get") {
                                        const body = val.value as N.FunctionExpression;
                                        value = b.expressionStatement(
                                            b.callExpression(
                                                b.functionExpression(null, [], body.body, body.generator, body.async),
                                                []
                                            )
                                        );
                                    }
                                    dcExports.push(
                                        b.exportNamedDeclaration(
                                            b.variableDeclaration("const", [
                                                b.variableDeclarator(ident, value?.expression),
                                            ])
                                        )
                                    );
                                }
                                path.replace();
                            } else {
                                path.replace();
                            }
                        }
                    }
                }
            }
						this.traverse(path, visitor as VisitorMethods);
        },
        visitVariableDeclaration(path) {
            const node = path.node;
            const res = convertRequireCallToImport(node);
            if (res.length) {
                path.replace(...res.map(([mod, specs]) => b.importDeclaration(specs, b.stringLiteral(mod))));
            }
						this.traverse(path, visitor as VisitorMethods);
        },
        visitCallExpression(path) {
            const node = path.node;

            if (
                dcImports.find(
                    (a) => t.Identifier.check(a.imported) && a.imported.name == (node.callee as N.Identifier).name
                ) != null ||
                dcHooks.find(
                    (a) => t.Identifier.check(a.imported) && a.imported.name == (node.callee as N.Identifier).name
                ) != null
            ) {
                const nm = b.memberExpression(dc, node.callee as N.Identifier);
                path.replace(b.callExpression(nm, node.arguments));
            } else if (
                t.Identifier.check(node.callee) &&
                node.callee.name == "require" &&
                t.StringLiteral.check(node.arguments[0])
            ) {
                let entry = convertRelative((node.arguments[0] as N.StringLiteral).value, opts, srcPath);
                if (entry) {
                    const awaiter = b.awaitExpression(
                        b.callExpression(b.memberExpression(dc, dcRequire), [b.stringLiteral(entry!)])
                    );
                    path.replace(awaiter);
                } else {
                }
            }
						this.traverse(path, visitor as VisitorMethods);
        },
        visitAssignmentExpression(path) {
            const node = path.node;
            const isModuleExports = (node: LVal | N.OptionalMemberExpression): boolean => {
                if (t.MemberExpression.check(node)) {
                    if (t.Identifier.check(node.property) && t.Identifier.check(node.object)) {
                        return node.object.name == "module" && node.property.name == "exports";
                    } else if (t.MemberExpression.check(node.object)) {
                        return isModuleExports(node.object);
                    }
                }
                return false;
            };
            const isExports = (node: LVal | N.OptionalMemberExpression): boolean => {
                if (t.MemberExpression.check(node)) {
                    if (t.Identifier.check(node.property) && t.Identifier.check(node.object)) {
                        return node.object.name == "exports";
                    }
                }
                return false;
            };
            if (isModuleExports(node.left as LVal)) {
                let me = node.left as N.MemberExpression;
                if (t.MemberExpression.check(me.object) && t.Identifier.check(me.object.property)) {
                    const prop = t.Identifier.check(me.property)
                        ? me.property
                        : b.identifier((me.property as N.StringLiteral).value);
                    const vd = b.variableDeclaration("const", [b.variableDeclarator(prop, node.right)]);
                    const final = b.exportNamedDeclaration(vd);
                    dcExports.push(final);
                    path.replace();
                } else {
                    const final = b.exportDefaultDeclaration(node.right);
                    dcExports.push(final);
                    if (
                        t.ExpressionStatement.check(path.parent) ||
                        t.AssignmentExpression.check(path.parent) ||
                        t.ConditionalExpression.check(path.parent)
                    ) {
                        path.parentPath.remove();
                    } else {
                        path.replace();
                    }
                }
            } else if (isExports(node.left as LVal)) {
                let me = node.left as N.MemberExpression;
                const prop = t.Identifier.check(me.property)
                    ? me.property
                    : b.identifier((me.property as N.StringLiteral).value);
                const vd = b.variableDeclaration("const", [b.variableDeclarator(prop, node.right)]);
                const final = b.exportNamedDeclaration(vd);
                dcExports.push(final);

                /* {
						let par = path.parentPath;
						path.remove();
						while (
							(t.isExpressionStatement(par.node) ||
								t.isAssignmentExpression(par.node) ||
								t.isConditionalExpression(par.node)) 
						) {
							if (par.parentPath) par = par.parentPath;
							else break;
						}
						if(par && !t.isProgram(par.node))
							try {
							par.remove();
						} catch(e) {
							console.debug(e)
						}
					} */
                if (
                    t.ExpressionStatement.check(path.parent) ||
                    t.AssignmentExpression.check(path.parent) ||
                    t.ConditionalExpression.check(path.parent) ||
                    t.ObjectProperty.check(path.parent)
                ) {
                    if (t.ObjectProperty.check(path.parent)) path.replace(b.nullLiteral());
                    else path.parentPath.replace(b.expressionStatement(b.nullLiteral()));
                } else {
                    path.replace();
                }
            }
						this.traverse(path, visitor as VisitorMethods);
        },
        visitJSXOpeningElement(path) {
            let toReplace = replaceJsxElement(path, dcImports);
            if (toReplace) path.replace(b.jsxOpeningElement(toReplace, path.node.attributes, path.node.selfClosing));
						this.traverse(path, visitor as VisitorMethods);
        },
        visitJSXClosingElement(path) {
            let toReplace = replaceJsxElement(path, dcImports);
            if (toReplace) path.replace(b.jsxClosingElement(toReplace));
						this.traverse(path, visitor as VisitorMethods);
        },
        visitExportNamedDeclaration(path) {
            const node: N.ExportNamedDeclaration = path.node;
            if (node.declaration) {
                dcExports.push(node);
                path.replace(node.declaration);
            } else {
                if (node.source && node.specifiers && node.specifiers.length) {
                    let entry = convertRelative(node.source.value as string, opts, srcPath);
                    if (entry) {
                        const awaiter = b.awaitExpression(
                            b.callExpression(b.memberExpression(dc, dcRequire), [b.stringLiteral(entry!)])
                        );
                        const specs = replaceWithIdent(node.specifiers as N.ExportSpecifier[], awaiter);
                        dcExports.push(
                            b.exportNamedDeclaration(
                                null,
                                (specs as N.VariableDeclaration).declarations.flatMap((a) => {
                                    const fin: N.ExportSpecifier[] = [];
                                    if (t.Identifier.check(a)) {
                                        fin.push(b.exportSpecifier(a, a));
                                    } else if (t.VariableDeclarator.check(a) && t.ObjectPattern.check(a.id)) {
                                        fin.push(
                                            ...a.id.properties.map((rc) => {
                                                const c = rc as N.ObjectProperty;
                                                return b.exportSpecifier(
                                                    c.value as N.Identifier,
                                                    c.key as K.IdentifierKind
                                                );
                                            })
                                        );
                                    }
                                    return fin;
                                })
                            )
                        );
                        path.replace(specs);
                    } else {
                        dcExports.push(node);
                        path.replace();
                    }
                } else {
                    dcExports.push(node);
                    path.replace();
                }
            }
						this.traverse(path, visitor as VisitorMethods);
        },
        visitExportAllDeclaration(path) {
            allDecls.push(path.node);
            path.replace();
						this.traverse(path, visitor as VisitorMethods);
        },
        visitExportDefaultDeclaration(path) {
            const node: N.ExportDefaultDeclaration = path.node;
            dcExports.push(node);
            path.replace();
						this.traverse(path, visitor as VisitorMethods);
        },
    };
    visit(ast, visitor);
    const originalExports = convertExports(
        dcExports.filter((a) => !(a as any).source),
        opts,
        srcPath
    );
    const aggregatedAll = b.objectExpression(
        allDecls.map((a) => {
            const convertedSource = convertRelative(a.source.value as string, { ...opts, isSecondPass: true }, srcPath);
            if (convertedSource) {
                const spreads = b.spreadElement(convertImportToDcRequire(b.stringLiteral(convertedSource!)));
                return spreads;
            } else {
                return b.spreadElement(b.objectExpression([]));
            }
        })
    );
    if (t.ObjectExpression.check(originalExports.argument)) {
        originalExports.argument.properties.push(...aggregatedAll.properties);
    }
    // file.ast.program.body.unshift(b.variableDeclaration("let", [b.variableDeclarator(b.identifier("exports"), b.objectExpression([]))]))
    ast.program.body.push(originalExports);

    visit(ast, {
        visitAssignmentExpression(path) {
            const orig = visitor.visitAssignmentExpression as Function;
            orig.call(this, path);
        },
    });

    return print(ast).code;
}

