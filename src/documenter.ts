import * as vs from "vscode";
import * as ts from "typescript";
import * as utils from "./utilities";

import { LanguageServiceHost } from "./languageServiceHost";

export class Documenter implements vs.Disposable {
    private _languageServiceHost: LanguageServiceHost;
    private _services: ts.LanguageService;
    private _program: ts.Program;
    
    constructor() {
        this._languageServiceHost = new LanguageServiceHost();
        this._services = ts.createLanguageService(
            this._languageServiceHost, ts.createDocumentRegistry());
            
        this._program = this._services.getProgram();
    }

    documentThis(editor: vs.TextEditor, edit: vs.TextEditorEdit, commandName: string) {
        if (!this._checkLanguageSupport(editor.document, commandName)) {
            return;
        }

        const selection = editor.selection;
        const carat = selection.start;

        const sourceFile = this._getSourceFile(editor.document);
        
        const position = ts.getPositionOfLineAndCharacter(sourceFile, carat.line, carat.character)
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        
        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current carat position");
            return;
        }
        
        const sb = new utils.StringBuilder();
        
        const docLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
        } else {
            this._showFailureMessage(commandName, "at the current carat position");
        }
    }
    
    documentEverything(editor: vs.TextEditor, edit: vs.TextEditorEdit, visibleOnly: boolean, commandName: string) {
        if (!this._checkLanguageSupport(editor.document, commandName)) {
            return;
        }
        
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
    
    private _showFailureMessage(commandName: string, condition: string) {
        vs.window.showErrorMessage(`Sorry! '${commandName}' wasn't able to produce documentation ${condition}.`);
    }
    
    private _checkLanguageSupport(document: vs.TextDocument, commandName: string) {
        if (document.languageId !== "javascript" &&
            document.languageId !== "typescript") {
                vs.window.showWarningMessage(`Sorry! '${commandName}' currently supports JavaScript and TypeScript only.`);
                return false;
            }
            
        return true;
    }
    
    private _insertDocumentation(sb: utils.StringBuilder, position: ts.LineAndCharacter, editor: vs.TextEditor, edit: vs.TextEditorEdit, sourceFile: ts.SourceFile) {
        const location = new vs.Position(position.line, position.character);
        const indentStartLocation = new vs.Position(position.line, 0);
        
        const indent = editor.document.getText(new vs.Range(
             indentStartLocation,
             location
        ));

        edit.insert(location, sb.toCommentString(indent));
        
        const newText = editor.document.getText();
        sourceFile.update(newText, <ts.TextChangeRange>{
            newLength: newText.length,
            span: <ts.TextSpan>{
                start: 0,
                length: newText.length
            }
        });
    }
    
    private _getSourceFile(document: vs.TextDocument) {
        const fileName = utils.fixWinPath(document.fileName);
        const fileText = document.getText();
        this._languageServiceHost.addFile(fileName, fileText);
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
                sb.appendLine("(description)");
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                this._emitMethodDeclaration(sb, <ts.MethodDeclaration>node);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, <ts.ConstructorDeclaration>node);
                break;
            default:
                return;
        }
        
        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    }

    private _emitClassDeclaration(sb: utils.StringBuilder, node: ts.ClassDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        
        sb.appendLine(`@class ${ node.name.getText() }`)
        
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    
    private _emitPropertyDeclaration(sb: utils.StringBuilder, node: ts.PropertyDeclaration | ts.AccessorDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        
        if (node.type) {
            sb.append(`@type ${ utils.formatTypeName(node.type.getText()) }`);
        }
    }
    
    private _emitInterfaceDeclaration(sb: utils.StringBuilder, node: ts.InterfaceDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        
        sb.appendLine(`@interface ${ node.name.text }`);
        
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    
    private _emitEnumDeclaration(sb: utils.StringBuilder, node: ts.EnumDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        
        sb.appendLine(`@enum {number}`);
    }
    
    private _emitMethodDeclaration(sb: utils.StringBuilder, node: ts.MethodDeclaration | ts.FunctionDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        
        if (node.getFullText().indexOf("return") !== -1) {
            /**
             * TODO: I assume this check will break for named nested functions?
             * Will test soon.
             */
            sb.append("@returns");
            if (node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            
            sb.appendLine(" (description)");
        }
    }
    
    private _emitParameters(sb: utils.StringBuilder, node:
        ts.MethodDeclaration | ts.FunctionDeclaration | ts.ConstructorDeclaration) {
            
        if (!node.parameters) return;
        
        node.parameters.forEach(parameter => {
            const name = parameter.name.getText();
            const isOptional = parameter.questionToken || parameter.initializer;
            const isArgs = !!parameter.dotDotDotToken;
            const initializerValue = parameter.initializer ? parameter.initializer.getText() : null;
            
            let typeName = null;
            
            if (parameter.initializer) {
                if (/^[0-9]/.test(initializerValue)) {
                    typeName = "{number}";
                }
                else if (initializerValue.indexOf("\"") !== -1 ||
                        initializerValue.indexOf("'") !== -1 ||
                        initializerValue.indexOf("`") !== -1) {
                    typeName = "{string}";
                }
            }
            else if (parameter.type) {
                typeName = utils.formatTypeName(isArgs ? "..." : "" + parameter.type.getFullText());
            }

            sb.append("@param ");
            
            if (typeName) {
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

            sb.appendLine(" (description)");
        });
    }
    
    private _emitConstructorDeclaration(sb: utils.StringBuilder, node: ts.ConstructorDeclaration) {
        sb.appendLine(`Creates an instance of ${
            (<ts.ClassDeclaration>node.parent).name.getText()
        }.`);
        sb.appendLine();
        
        this._emitParameters(sb, node);
    }

    private _emitTypeParameters(sb: utils.StringBuilder, node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.MethodDeclaration | ts.FunctionDeclaration) {
        if (!node.typeParameters) return;
        
        node.typeParameters.forEach(parameter => {
            sb.appendLine(`@template ${ parameter.name.getText() }`);
        });
    }
    
    private _emitHeritageClauses(sb: utils.StringBuilder, node: ts.ClassLikeDeclaration | ts.InterfaceDeclaration) {
        if (!node.heritageClauses) return;
        
        node.heritageClauses.forEach((clause) => {
            const heritageType = clause.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";
            
            clause.types.forEach(t => {
                sb.appendLine(`${ heritageType } ${ utils.formatTypeName(t.expression.getText()) }`);
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
        this._services.dispose();
    }
}
        
