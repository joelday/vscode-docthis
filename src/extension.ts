import * as vs from "vscode";
import * as path from "path";

import { Documenter } from "./documenter";

let documenter: Documenter;

function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new Documenter();
    }
}

function languageIsSupported(document: vs.TextDocument) {
    return (document.languageId === "javascript" ||
        document.languageId === "typescript" ||
        document.languageId === "vue" ||
        document.languageId === "javascriptreact" ||
        document.languageId === "typescriptreact" ||
        path.extname(document.fileName) === ".vue");
}

function verifyLanguageSupport(document: vs.TextDocument, commandName: string) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage(`Sorry! '${commandName}' currently supports JavaScript and TypeScript only.`);
        return false;
    }

    return true;
}

function runCommand(commandName: string, document: vs.TextDocument, implFunc: () => void) {
    if (!verifyLanguageSupport(document, commandName)) {
        return;
    }

    try {
        lazyInitializeDocumenter();
        implFunc();
    }
    catch (e) {
        debugger;
        console.error(e);
    }
}

export function activate(context: vs.ExtensionContext): void {
    context.subscriptions.push(vs.workspace.onDidChangeTextDocument(e => {
        if (!vs.workspace.getConfiguration().get("docthis.automaticForBlockComments", true)) {
            return;
        }

        if (!languageIsSupported(e.document)) {
            return;
        }

        const editor = vs.window.activeTextEditor;
        if (editor.document !== e.document) {
            return;
        }

        if (e.contentChanges.length > 1) {
            return;
        }

        const change = e.contentChanges[0];
        if (change.text === "* */") {
            lazyInitializeDocumenter();
            setTimeout(() => {
                try {
                    documenter.automaticDocument(editor);
                }
                catch (ex) {
                    vs.window.showErrorMessage("docthis: Failed to document at current position: " + ex.message);
                    console.error("docthis: Failed to document at current position.");
                }
            }, 0);
        }
    }));

    context.subscriptions.push(vs.commands.registerCommand("docthis.documentThis", () => {
        const commandName = "Document This";

        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.documentThis(vs.window.activeTextEditor, commandName);
        });
    }));

    context.subscriptions.push(vs.commands.registerCommand("docthis.traceTypeScriptSyntaxNode", () => {
        const commandName = "Trace TypeScript Syntax Node";

        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.traceNode(vs.window.activeTextEditor);
        });
    }));
}