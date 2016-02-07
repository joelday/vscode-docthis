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

    documentThis(editor: vs.TextEditor, edit: vs.TextEditorEdit) {
        const fileName = utils.fixWinPath(editor.document.fileName);
        const fileText = editor.document.getText();
        
        const selection = editor.selection;
        const carat = selection.start;
        
        this._languageServiceHost.initForFile(fileName, fileText);
        
        const sourceFile = this._services.getSourceFile(fileName);

        const position = ts.getPositionOfLineAndCharacter(sourceFile, carat.line, carat.character)
        const node = utils.findChildForPosition(sourceFile, position);
        
        this._documentNode(node, editor, edit, fileName, sourceFile);
    }
    
    private _documentNode(node: ts.Node, editor: vs.TextEditor, edit: vs.TextEditorEdit, fileName: string, sourceFile: ts.SourceFile) {
        const parent = utils.findFirstParentOfKind(node,
            ts.SyntaxKind.ClassDeclaration |
            ts.SyntaxKind.PropertyDeclaration |
            ts.SyntaxKind.GetAccessor |
            ts.SyntaxKind.SetAccessor |
            ts.SyntaxKind.InterfaceDeclaration |
            ts.SyntaxKind.EnumDeclaration |
            ts.SyntaxKind.MethodDeclaration |
            ts.SyntaxKind.Constructor);
            
        const sb = new utils.StringBuilder();

        switch (parent.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                this._emitClassDeclaration(sb, <ts.ClassDeclaration>parent);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                this._emitPropertyDeclaration(sb, <ts.AccessorDeclaration>parent);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this._emitInterfaceDeclaration(sb, <ts.InterfaceDeclaration>parent);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this._emitEnumDeclaration(sb, <ts.EnumDeclaration>parent);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
                this._emitMethodDeclaration(sb, <ts.MethodDeclaration>parent);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, <ts.ConstructorDeclaration>parent);
                break;
            default:
                vs.window.showErrorMessage("Sorry! 'Document This' wasn't able to produce documentation at the current carat position.");
                return;
        }
        
        const lineAndChar = ts.getLineAndCharacterOfPosition(sourceFile, parent.getStart());
        const location = new vs.Position(lineAndChar.line, lineAndChar.character);
        const indentStartLocation = new vs.Position(lineAndChar.line, 0);
        
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
    
    private _emitClassDeclaration(sb: utils.StringBuilder, node: ts.ClassDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        this._emitModifiers(sb, node);
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    
    private _emitPropertyDeclaration(sb: utils.StringBuilder, node: ts.PropertyDeclaration | ts.AccessorDeclaration) {
        sb.appendLine("(description)");
        sb.appendLine();
        
        if (node.type) {
            sb.append(`@type {${ utils.formatTypeName(node.type.getText()) }}`);
        }
        
        this._emitModifiers(sb, node);
        
        sb.appendLine(" - (description)");
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
        
        if (node.type) {
            sb.appendLine(`@returns {${ utils.formatTypeName(node.type.getText()) }}`);
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
            
            let typeName = "";
            
            if (parameter.initializer) {
                if (/^[0-9]/.test(initializerValue)) {
                    typeName = "number";
                }
                else if (initializerValue.indexOf("\"") !== -1 || initializerValue.indexOf("'") !== -1) {
                    typeName = "string";
                }
            }
            else if (parameter.type) {
                typeName = parameter.type.getFullText();
            }
            
            typeName = utils.formatTypeName(typeName);

            sb.append(`@param {${ isArgs ? "..." : "" }${ typeName }} `);
            
            if (isOptional) {
                sb.append("[");
            }
            
            sb.append(name);
            
            if (parameter.initializer) {
                sb.append("=" + parameter.initializer.getText());
            }
            
            if (isOptional) {
                sb.append("]");
            }

            sb.append(" - (description)");
            sb.appendLine();
        });
    }
    
    private _emitConstructorDeclaration(sb: utils.StringBuilder, node: ts.ConstructorDeclaration) {
        sb.appendLine(`Creates an instance of ${
            (<ts.ClassDeclaration>node.parent).name.getText()
        }.`);
        
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
                sb.appendLine(`${ heritageType } {${ utils.formatTypeName(t.expression.getText()) }}`);
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
        
