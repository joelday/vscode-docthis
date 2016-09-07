import * as vs from "vscode";
import * as ts from "typescript";
import * as utils from "./utilities";

import { LanguageServiceHost } from "./languageServiceHost";

function includeTypes() {
    return vs.workspace.getConfiguration().get("docthis.includeTypes", true);
}

export class Documenter implements vs.Disposable {
    private _languageServiceHost: LanguageServiceHost;
    private _services: ts.LanguageService;
    private _program: ts.Program;

    private _outputChannel: vs.OutputChannel;

    constructor() {
        this._languageServiceHost = new LanguageServiceHost();
        this._services = ts.createLanguageService(
            this._languageServiceHost, ts.createDocumentRegistry());

        this._program = this._services.getProgram();
    }

    automaticDocument(editor: vs.TextEditor, edit: vs.TextEditorEdit) {
        const selection = editor.selection;
        const caret = selection.start;

        const sourceFile = this._getSourceFile(editor.document);
        const newText = editor.document.getText();
        sourceFile.update(newText, <ts.TextChangeRange>{
            newLength: newText.length,
            span: <ts.TextSpan>{
                start: 0,
                length: newText.length
            }
        });

        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);

        const sb = new utils.StringBuilder();

        const foundLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (foundLocation) {
            const foundLocationOffset = editor.document.offsetAt(new vs.Position(foundLocation.line, foundLocation.character));
            const caretOffset = editor.document.offsetAt(caret);
            if (caretOffset > foundLocationOffset) {
                return;
            }

            this._insertDocumentation(sb, caret, editor, edit, sourceFile, false);
        }
    }

    documentThis(editor: vs.TextEditor, edit: vs.TextEditorEdit, commandName: string) {
        const selection = editor.selection;
        const caret = selection.start;

        const sourceFile = this._getSourceFile(editor.document);

        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);

        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current caret position");
            return;
        }

        const sb = new utils.StringBuilder();

        const docLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
        } else {
            this._showFailureMessage(commandName, "at the current caret position");
        }
    }

    documentEverything(editor: vs.TextEditor, edit: vs.TextEditorEdit, visibleOnly: boolean, commandName: string) {
        let sourceFile = this._getSourceFile(editor.document);
        const documentable = visibleOnly ? utils.findVisibleChildrenOfKind(sourceFile) : utils.findChildrenOfKind(sourceFile);

        let showFailure = false;

        documentable.forEach(node => {
            const sb = new utils.StringBuilder();

            const docLocation = this._documentNode(sb, node, editor, sourceFile);
            if (docLocation) {
                this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
            } else {
                showFailure = true;
            }

            sourceFile = this._getSourceFile(editor.document);
        });

        if (showFailure) {
            this._showFailureMessage(commandName, "for everything in the document");
        }
    }

    traceNode(editor: vs.TextEditor, edit: vs.TextEditorEdit) {
        const selection = editor.selection;
        const caret = selection.start;

        const sourceFile = this._getSourceFile(editor.document);

        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);

        const nodes: string[] = [];

        let parent = node;
        while (parent) {
            nodes.push(this._printNodeInfo(parent, sourceFile));
            parent = parent.parent;
        }

        const sb = new utils.StringBuilder();
        nodes.reverse().forEach(n => {
            sb.appendLine(n);
        });

        if (!this._outputChannel) {
            this._outputChannel = vs.window.createOutputChannel("TypeScript Syntax Node Trace");
        }

        this._outputChannel.show();
        this._outputChannel.appendLine(sb.toString());
    }

    private _printNodeInfo(node: ts.Node, sourceFile: ts.SourceFile) {
        const sb = new utils.StringBuilder();
        sb.appendLine(`${ node.getStart() } to ${ node.getEnd() } --- (${node.kind}) ${ (<any>ts).SyntaxKind[node.kind] }`);

        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart()).character;
        for (let i = 0; i < column; i++) {
            sb.append(" ");
        }

        sb.appendLine(node.getText());

        return sb.toString();
    }

    private _showFailureMessage(commandName: string, condition: string) {
        vs.window.showErrorMessage(`Sorry! '${commandName}' wasn't able to produce documentation ${condition}.`);
    }

    // TODO: This is pretty messy...
    private _insertDocumentation(sb: utils.StringBuilder, position: ts.LineAndCharacter, editor: vs.TextEditor, edit: vs.TextEditorEdit, sourceFile: ts.SourceFile, withStart = true) {
        let location = new vs.Position(position.line, position.character);
        const indentStartLocation = new vs.Position(position.line, 0);

        let indentRange = new vs.Range(
            indentStartLocation,
            location
        );

        if (!withStart) {
            if (position.character - 3 >= 0) {
                indentRange = new vs.Range(indentStartLocation, new vs.Position(position.line, position.character - 3));
            }

            const indent = editor.document.getText(indentRange);
            const commentText = sb.toCommentString(indent, withStart);

            const lines = commentText.split("\n");

            const firstLines = lines.splice(0, 2).join("\n");

            edit.insert(location, firstLines);

            const latterLocation = new vs.Position(position.line, position.character);

            edit.insert(latterLocation, "\n" + lines.join("\n"));
        }
        else {
            const indent = editor.document.getText(indentRange);
            const commentText = sb.toCommentString(indent, withStart);

            edit.insert(location, commentText);
        }

        if (withStart) {
            const newText = editor.document.getText();
            try {
                sourceFile.update(newText, <ts.TextChangeRange>{
                    newLength: newText.length,
                    span: <ts.TextSpan>{
                        start: 0,
                        length: newText.length
                    }
                });
            }
            catch (error) {
                console.warn("Error in source file update:", error);
            }
        }
    }

    private _getSourceFile(document: vs.TextDocument) {
        const fileName = utils.fixWinPath(document.fileName);
        const fileText = document.getText();
        this._languageServiceHost.setCurrentFile(fileName, fileText);
        return this._services.getSourceFile(fileName);
    }

    private _documentNode(sb: utils.StringBuilder, node: ts.Node, editor: vs.TextEditor, sourceFile: ts.SourceFile) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                this._emitClassDeclaration(sb, <ts.ClassDeclaration>node);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                this._emitPropertyDeclaration(sb, <ts.AccessorDeclaration>node);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this._emitInterfaceDeclaration(sb, <ts.InterfaceDeclaration>node);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this._emitEnumDeclaration(sb, <ts.EnumDeclaration>node);
                break;
            case ts.SyntaxKind.EnumMember:
                sb.appendLine();
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                this._emitMethodDeclaration(sb, <ts.MethodDeclaration>node);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, <ts.ConstructorDeclaration>node);
                break;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return this._emitFunctionExpression(sb, <ts.FunctionExpression>node, sourceFile);
            default:
                return;
        }

        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    }

    private _emitFunctionExpression(sb: utils.StringBuilder, node: ts.FunctionExpression | ts.ArrowFunction, sourceFile: ts.SourceFile) {
        let targetNode = node.parent;

        if (node.parent.kind !== ts.SyntaxKind.PropertyAssignment &&
            node.parent.kind !== ts.SyntaxKind.BinaryExpression) {

            targetNode = utils.findFirstParent(targetNode, [ts.SyntaxKind.VariableDeclarationList]);
            if (!targetNode) {
                return;
            }
        }

        sb.appendLine();
        sb.appendLine();

        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);

        return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
    }

    private _emitClassDeclaration(sb: utils.StringBuilder, node: ts.ClassDeclaration) {
        sb.appendLine();
        sb.appendLine();

        this._emitModifiers(sb, node);

        sb.appendLine(`@class ${ node.name.getText() }`);

        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }

    private _emitPropertyDeclaration(sb: utils.StringBuilder, node: ts.PropertyDeclaration | ts.AccessorDeclaration) {
        sb.appendLine();
        sb.appendLine();

        if (node.kind === ts.SyntaxKind.GetAccessor) {
            const name = utils.findFirstChildOfKindDepthFirst(node, [ts.SyntaxKind.Identifier]).getText();
            const parentClass = <ts.ClassDeclaration>node.parent;

            let hasSetter = !!parentClass.members.find(c => c.kind === ts.SyntaxKind.SetAccessor &&
                utils.findFirstChildOfKindDepthFirst(c, [ts.SyntaxKind.Identifier]).getText() === name);

            if (!hasSetter) {
                sb.appendLine("@readonly");
            }
        }

        this._emitModifiers(sb, node);

        // JSDoc fails to emit documentation for arrow function syntax. (https://github.com/jsdoc3/jsdoc/issues/1100)
        if (includeTypes() && node.type && node.type.getText().indexOf("=>") === -1) {
            let type = utils.formatTypeName(node.type.getText());

            sb.append(`@type ${ utils.formatTypeName(node.type.getText()) }`);
        }

        this._emitMemberOf(sb, node.parent);
    }

    private _emitInterfaceDeclaration(sb: utils.StringBuilder, node: ts.InterfaceDeclaration) {
        sb.appendLine();
        sb.appendLine();

        this._emitModifiers(sb, node);

        sb.appendLine(`@interface ${ node.name.getText() }`);

        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }

    private _emitEnumDeclaration(sb: utils.StringBuilder, node: ts.EnumDeclaration) {
        sb.appendLine();
        sb.appendLine();

        this._emitModifiers(sb, node);

        sb.appendLine(`@enum {number}`);
    }

    private _emitMethodDeclaration(sb: utils.StringBuilder, node: ts.MethodDeclaration | ts.FunctionDeclaration) {
        sb.appendLine();
        sb.appendLine();

        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
    }

    private _emitMemberOf(sb: utils.StringBuilder, parent: ts.Node) {
        if (parent && (parent.kind === ts.SyntaxKind.ClassDeclaration || parent.kind === ts.SyntaxKind.InterfaceDeclaration))
            sb.appendLine("@memberOf " + (<any>parent)["name"].text);
        }
    }

    private _emitReturns(sb: utils.StringBuilder, node: ts.MethodDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.append("@returns");
            if (includeTypes() && node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }

            sb.appendLine();
        }
    }

    private _emitParameters(sb: utils.StringBuilder, node:
        ts.MethodDeclaration | ts.FunctionDeclaration | ts.ConstructorDeclaration | ts.FunctionExpression | ts.ArrowFunction) {

        if (!node.parameters) return;

        node.parameters.forEach(parameter => {
            const name = parameter.name.getText();
            const isOptional = parameter.questionToken || parameter.initializer;
            const isArgs = !!parameter.dotDotDotToken;
            const initializerValue = parameter.initializer ? parameter.initializer.getText() : null;

            let typeName = "{any}";

            if (includeTypes()) {
                if (parameter.initializer && !parameter.type) {
                    if (/^[0-9]/.test(initializerValue)) {
                        typeName = "{number}";
                    }
                    else if (initializerValue.indexOf("\"") !== -1 ||
                            initializerValue.indexOf("'") !== -1 ||
                            initializerValue.indexOf("`") !== -1) {
                        typeName = "{string}";
                    }
                    else if (initializerValue.indexOf("true") !== -1 ||
                            initializerValue.indexOf("false") !== -1) {
                        typeName = "{boolean}";
                    }
                }
                else if (parameter.type) {
                    typeName = utils.formatTypeName((isArgs ? "..." : "") + parameter.type.getFullText().trim());
                }
            }

            sb.append("@param ");

            if (includeTypes()) {
                sb.append(typeName + " ");
            }

            if (isOptional) {
                sb.append("[");
            }

            sb.append(name);

            if (parameter.initializer && typeName) {
                sb.append("=" + parameter.initializer.getText());
            }

            if (isOptional) {
                sb.append("]");
            }

            sb.appendLine();
        });
    }

    private _emitConstructorDeclaration(sb: utils.StringBuilder, node: ts.ConstructorDeclaration) {
        sb.appendLine(`Creates an instance of ${
            (<ts.ClassDeclaration>node.parent).name.getText()
        }.`);
        sb.appendLine();

        this._emitParameters(sb, node);
        this._emitMemberOf(sb, node.parent);
    }

    private _emitTypeParameters(sb: utils.StringBuilder, node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.MethodDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
        if (!node.typeParameters) return;

        node.typeParameters.forEach(parameter => {
            sb.appendLine(`@template ${ parameter.name.getText() }`);
        });
    }

    private _emitHeritageClauses(sb: utils.StringBuilder, node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration) {
        if (!node.heritageClauses || !includeTypes()) return;

        node.heritageClauses.forEach((clause) => {
            const heritageType = clause.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";

            clause.types.forEach(t => {
                let tn = t.expression.getText();
                if (t.typeArguments) {
                    tn += "<";
                    tn += t.typeArguments.map(a => a.getText()).join(", ");
                    tn += ">";
                }

                sb.append(`${ heritageType } ${ utils.formatTypeName(tn) }`);
                sb.appendLine();
            });
        });
    }

    private _emitModifiers(sb: utils.StringBuilder, node: ts.Node) {
        if (!node.modifiers) return;

        node.modifiers.forEach(modifier => {
            switch (modifier.kind) {
                case ts.SyntaxKind.ExportKeyword:
                    sb.appendLine("@export"); return;
                case ts.SyntaxKind.AbstractKeyword:
                    sb.appendLine("@abstract"); return;
                case ts.SyntaxKind.ProtectedKeyword:
                    sb.appendLine("@protected"); return;
                case ts.SyntaxKind.PrivateKeyword:
                    sb.appendLine("@private"); return;
                case ts.SyntaxKind.StaticKeyword:
                    sb.appendLine("@static"); return;
            }
        });
    }

    dispose() {
        if (this._outputChannel) {
            this._outputChannel.dispose();
        }

        this._services.dispose();
    }
}
