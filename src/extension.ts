import * as vs from "vscode"; 
import { Documenter } from "./documenter";

export function activate(context: vs.ExtensionContext): void {
    let documenter = new Documenter();
    context.subscriptions.push(documenter);
    
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentThis", (editor, edit) => {
        try {
            documenter.documentThis(editor, edit, "Document This");
        }
        catch (e) {
            console.error(e);
            vs.window.showErrorMessage(`Sorry! 'Document This' encountered an error: ${e.toString()}.`);
        }
    }));
    
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverything", (editor, edit) => {
        try {
            documenter.documentEverything(editor, edit, false, "Document Everything");
        }
        catch (e) {
            console.error(e);
            vs.window.showErrorMessage(`Sorry! 'Document Everything' encountered an error: ${e.toString()}.`);
        }
    }));
    
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverythingVisible", (editor, edit) => {
        try {
            documenter.documentEverything(editor, edit, true, "Document Everything Visible");
        }
        catch (e) {
            console.error(e);
            vs.window.showErrorMessage(`Sorry! 'Document Everything Visible' encountered an error: ${e.toString()}.`);
        }
    }));
    
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.traceTypeScriptSyntaxNode", (editor, edit) => {
        try {
            documenter.traceNode(editor, edit);
        }
        catch (e) {
            console.error(e);
            vs.window.showErrorMessage(`Sorry! 'Trace TypeScript Syntax Node' encountered an error: ${e.toString()}.`);
        }
    }));
}