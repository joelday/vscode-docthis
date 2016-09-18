import * as vs from "vscode";
import * as openurl from "openurl";
import * as serializeError from "serialize-error";
import * as childProcess from "child_process";

import { Documenter } from "./documenter";
import { StringBuilder } from "./utilities";

let documenter: Documenter;

function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new Documenter();
    }
}

function languageIsSupported(document: vs.TextDocument) {
    return (document.languageId === "javascript" ||
        document.languageId === "typescript" ||
        document.languageId === "javascriptreact" ||
        document.languageId === "typescriptreact");
}

function verifyLanguageSupport(document: vs.TextDocument, commandName: string) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage(`Sorry! '${commandName}' currently supports JavaScript and TypeScript only.`);
        return false;
    }

    return true;
}

function reportError(error: Error, action: string) {
     vs.window.showErrorMessage(`Sorry! '${action}' encountered an error.`, "Report Issue").then(() => {
        try {
            const sb = new StringBuilder();
            sb.appendLine("Platform: " + process.platform);
            sb.appendLine();
            sb.appendLine("Steps to reproduce the error:");
            sb.appendLine();
            sb.appendLine("Code excerpt that reproduces the error (optional):");
            sb.appendLine();
            sb.appendLine("Exception:");
            sb.appendLine(JSON.stringify(serializeError(error)));

            const uri = `https://github.com/joelday/vscode-docthis/issues/new?title=${
                encodeURIComponent(`Exception thrown in '${action}': ${error.message}`)
            }&body=${
                encodeURIComponent(sb.toString())
            }`;

            if (process.platform !== "win32") {
                openurl.open(uri, openErr => { console.error("Failed to launch browser", openErr); });
            } else {
                childProcess.spawnSync("cmd", [
                    "/c",
                    "start",
                    uri.replace(/[&]/g, "^&")
                ]);
            }
        }
        catch (reportErr) {
            reportError(reportErr, "Report Error");
        }
    });
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
        reportError(e, commandName);
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
        if (change.text !== "*") {
            return;
        }

        const testRange = new vs.Range(
            new vs.Position(change.range.start.line, change.range.start.character - 2),
            new vs.Position(change.range.end.line, change.range.end.character + 1));

        if (e.document.getText(testRange) === "/**") {
            setTimeout(() => {
                editor.edit(edit => {
                    try {
                        lazyInitializeDocumenter();
                        documenter.automaticDocument(editor, edit);
                    }
                    catch (ex) {
                        console.error("docthis: Failed to document at current position.");
                    }
                });
            }, 0);
        }
    }));

    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentThis", (editor, edit) => {
        const commandName = "Document This";

        runCommand(commandName, editor.document, () => {
            documenter.documentThis(editor, edit, commandName);
        });
    }));

    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverything", (editor, edit) => {
        const commandName = "Document Everything";

        runCommand(commandName, editor.document, () => {
            documenter.documentEverything(editor, edit, false, commandName);
        });
    }));

    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverythingVisible", (editor, edit) => {
        const commandName = "Document Everything Visible";

        runCommand(commandName, editor.document, () => {
            documenter.documentEverything(editor, edit, true, commandName);
        });
    }));

    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.traceTypeScriptSyntaxNode", (editor, edit) => {
        const commandName = "Trace TypeScript Syntax Node";

        runCommand(commandName, editor.document, () => {
            documenter.traceNode(editor, edit);
        });
    }));
}