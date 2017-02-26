import * as ts from "typescript";
import * as utils from "./utilities";
import { Documenter, includeTypes, inferTypes, enableHungarianNotationEvaluation } from "./documenter";

/**
 * PhpDocumenter
 */
export class PhpDocumenter extends Documenter {
    constructor() {
        super();
    }

    protected _emitReturns(sb: utils.SnippetStringBuilder, node: ts.MethodDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.appendLine();
            sb.append("@return");
            if (includeTypes() && node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            else if (includeTypes() && inferTypes()) {
                sb.append(" " + this._inferReturnTypeFromName(node.name.getText()));
            }

            sb.append(" ");
            sb.appendSnippetTabstop();

            sb.appendLine();
        }

    }

    protected _inferReturnTypeFromName(name: string): string {
        if (this._isNameBooleanLike(name)) {
            return "bool";
        }

        return "";
    }

    protected _emitParameters(sb: utils.SnippetStringBuilder, node:
        ts.MethodDeclaration | ts.FunctionDeclaration | ts.ConstructorDeclaration | ts.FunctionExpression | ts.ArrowFunction) {

        if (!node.parameters) {
            return;
        }

        node.parameters.forEach(parameter => {
            let name = parameter.name.getText();
            const isArgs = !!parameter.dotDotDotToken;
            const initializerValue = parameter.initializer ? parameter.initializer.getText() : null;

            let typeName = "mixed";
            let parts = parameter.getText().split(" ");

            if (parts.length === 2) {
                typeName = parts[0];
                name = parts[1];
            }
            else if (includeTypes()) {
                if (parameter.initializer && !parameter.type) {
                    if (/^[0-9]/.test(initializerValue)) {
                        typeName = "int";
                    }
                    else if (initializerValue.indexOf("\"") !== -1 ||
                        initializerValue.indexOf("'") !== -1 ||
                        initializerValue.indexOf("`") !== -1) {
                        typeName = "string";
                    }
                    else if (initializerValue.indexOf("true") !== -1 ||
                        initializerValue.indexOf("false") !== -1) {
                        typeName = "boolean";
                    }
                }
                else if (parameter.type) {
                    typeName = utils.formatTypeName((isArgs ? "..." : "") + parameter.type.getFullText().trim());
                }
                else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(name)) {
                    typeName = this._getHungarianNotationType(name);
                }
                else if (inferTypes()) {
                    typeName = this._inferParamTypeFromName(name);
                }
            }

            sb.append("@param ");

            if (includeTypes()) {
                sb.appendSnippetPlaceholder(typeName + " ");
            }

            sb.append(name);

            sb.append(" ");
            sb.appendSnippetTabstop();

            sb.appendLine();
        });
    }

    protected _emitModifiers(sb: utils.SnippetStringBuilder, node: ts.Node) {
        return;
    }

    protected _inferParamTypeFromName(name: string): string {
        if (this._isNameFunctionLike(name)) {
            return "callback";
        }

        if (this._isNameBooleanLike(name)) {
            return "boolean";
        }

        return "mixed";
    }

    protected _emitClassDeclaration(sb: utils.SnippetStringBuilder, node: ts.ClassDeclaration) {
        super._emitDescriptionHeader(sb);
        sb.append("@author ");
        sb.appendSnippetTabstop();
        sb.appendLine();

        sb.append("@package ");
        sb.appendSnippetTabstop();
        sb.appendLine();
    }

    protected _emitPropertyDeclaration(sb: utils.SnippetStringBuilder, node: ts.PropertyDeclaration | ts.AccessorDeclaration) {
        if (includeTypes()) {
            let parts = node.getText().split(" ");
            let name = parts[parts.length - 1];
            let varType = "mixed";

            if (parts.length === 3) {
                varType = parts[1];
            }

            super._emitDescriptionHeader(sb);
            sb.append("@var ");
            sb.appendSnippetPlaceholder(varType);
            sb.append(" " + name.replace(";", "") + " ");
            sb.appendSnippetTabstop();
        }
    }
}
