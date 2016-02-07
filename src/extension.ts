import * as vs from "vscode"; 
import { Documenter } from "./documenter";

export function activate(context: vs.ExtensionContext): void {
    let documenter = new Documenter();
    context.subscriptions.push(documenter);
    
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentThis", (editor, edit) => {
        try {
            documenter.documentThis(editor, edit);
        }
        catch (e) {
            console.error(e);
        }
    }));
}