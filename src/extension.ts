import * as vs from "vscode";
import * as path from "path";

import { Documenter } from "./documenter";
import { TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, Range } from "vscode";

const languages = [
    "javascript",
    "typescript",
    "vue",
    "javascriptreact",
    "typescriptreact"
];

let documenter: Documenter;

function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new Documenter();
    }
}

function languageIsSupported(document: vs.TextDocument) {
    return (languages.findIndex(l => document.languageId === l) !== -1 ||
        path.extname(document.fileName) === ".vue");
}

function verifyLanguageSupport(document: vs.TextDocument, commandName: string) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage(`Sorry! '${commandName}' currently only supports JavaScript and TypeScript.`);
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

// Thanks, @mjbvz!
class DocThisCompletionItem extends CompletionItem {
    constructor(document: TextDocument, position: Position) {
        super("/** Document This */", CompletionItemKind.Snippet);
        this.insertText = "";
        this.sortText = "\0";

        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
        const suffix = line.slice(position.character).match(/^\s*\**\//);
        const start = position.translate(0, prefix ? -prefix[0].length : 0);
        this.range = new Range(
            start,
            position.translate(0, suffix ? suffix[0].length : 0));

        this.command = {
            title: "Document This",
            command: "docthis.documentThis",
            arguments: [true]
        };
    }
}

export function activate(context: vs.ExtensionContext): void {
    const languageEntries = languages.map(l => ({ scheme: "file", language: l }));

    context.subscriptions.push(vs.languages.registerCompletionItemProvider(
        languageEntries,
        {
            provideCompletionItems: (document: TextDocument, position: Position, token: CancellationToken) => {
                const line = document.lineAt(position.line).text;
                const prefix = line.slice(0, position.character);

                if (prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/)) {
                    return [new DocThisCompletionItem(document, position)];
                }

                return;
            }
        },
        "/", "*"));

    context.subscriptions.push(vs.commands.registerCommand("docthis.documentThis", (forCompletion: boolean) => {
        const commandName = "Document This";

        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.documentThis(vs.window.activeTextEditor, commandName, forCompletion);
        });
    }));

    context.subscriptions.push(vs.commands.registerCommand("docthis.traceTypeScriptSyntaxNode", () => {
        const commandName = "Trace TypeScript Syntax Node";

        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.traceNode(vs.window.activeTextEditor);
        });
    }));
}
