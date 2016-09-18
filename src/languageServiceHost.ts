import * as vs from "vscode";
import * as path from "path";
import * as ts from "typescript";
import * as utils from "./utilities";

export class LanguageServiceHost implements ts.LanguageServiceHost {
    private _fileNames: string[];
    private _files: ts.Map<{ text: string; version: number; }>;

    constructor() {
        this._fileNames = [];
        this._files = {};
    }

    setCurrentFile(fileName: string, fileText: string) {
        for (let fileName in this._files) {
            delete this._files[fileName].text;
        }

        if (this._files[fileName]) {
            this._files[fileName].version++;
            this._files[fileName].text = fileText;
        }
        else {
            this._files[fileName] = { text: fileText, version: 0 };
        }
    }

    getScriptFileNames() {
        return this._fileNames;
    }

    getScriptVersion(fileName: string) {
        return this._files[fileName] && this._files[fileName].version.toString();
    }

    getScriptSnapshot(fileName: string) {
        return ts.ScriptSnapshot.fromString(this._files[fileName] ? this._files[fileName].text : "");
    }

    getCurrentDirectory() {
        return vs.workspace.rootPath ?
            utils.fixWinPath(path.resolve(vs.workspace.rootPath)) : process.cwd();
    }

    getDefaultLibFileName(options: ts.CompilerOptions) {
        return ts.getDefaultLibFilePath(options);
    }

    getCompilationSettings(): ts.CompilerOptions {
        return {};
    }
}