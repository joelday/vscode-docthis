import * as vs from "vscode";
import * as path from "path";
import * as ts from "typescript";
import * as utils from "./utilities";
import * as fs from "fs";

const tsConfigFileName = "tsconfig.json";

export class LanguageServiceHost implements ts.LanguageServiceHost {
    private _fileName: string;
    private _editorFileSnapshot: ts.IScriptSnapshot;
    private _fileNames: string[];
    private _files: ts.Map<{ text: string; version: number; }>;
    
    constructor() {
        this._fileNames = [];
        this._files = {};
    }
    
    addFile(fileName: string, fileText: string) {
        this._fileName = fileName;

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
            utils.fixWinPath(path.resolve(vs.workspace.rootPath)) : process.cwd()
    }
    
    getDefaultLibFileName(options: ts.CompilerOptions) {
        return ts.getDefaultLibFilePath(options);
    }

    getCompilationSettings(): ts.CompilerOptions {
        return {};
    }
}

// function resolveAndLoadConfig(fileName: string) {
//     let tsConfigFileName = resolveTsConfigFileName(fileName);
//     if (!tsConfigFileName) {
//         return null;
//     }
//     
//     return loadTsConfig(tsConfigFileName);
// }

// function loadTsConfig(fileName: string) {
//     const fileParseResult = ts.parseConfigFileTextToJson(fileName, ts.sys.readFile(fileName));
// 
//     return ts.parseJsonConfigFileContent(
//         fileParseResult.config,
//         ts.sys,
//         path.dirname(fileName));
// }
// 
// function resolveTsConfigFileName(fileName: string): string {
//     let searchPath = path.resolve(vs.workspace.rootPath);
//     
//     if (!vs.workspace.rootPath) {
//         return null;
//     }
//     
//     let docPath = path.dirname(fileName);
//     
//     while (true) {
//         let localTsConfig = path.resolve(path.join(docPath, tsConfigFileName));
//         if (ts.sys.fileExists(localTsConfig)) {
//             return localTsConfig;
//         }
//         
//         if (path.resolve(docPath) === searchPath) {
//             break;
//         }
//         
//         docPath = path.join(docPath, "..");
//     }
//     
//     return null;
// }