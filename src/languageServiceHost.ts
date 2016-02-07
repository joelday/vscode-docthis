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
    private _files: ts.Map<{ version: number; }>;
    private _config: ts.ParsedCommandLine;
    
    constructor() {
        this._fileNames = [];
        this._files = {};
    }
    
    initForFile(fileName: string, fileText: string) {
        this._fileName = fileName;
        
        this._config = resolveAndLoadConfig(this._fileName);
            
        this._fileNames = (this._config ? this._config.fileNames : [this._fileName])
            .map(f => utils.fixWinPath(f));

        if (this._files[fileName]) {
            this._files[fileName].version++;
        }
        
        this._fileNames.forEach(f => {
            if (!this._files[f]) {
                this._files[f] = { version: 0 };
            }
        });
            
        this._editorFileSnapshot = ts.ScriptSnapshot.fromString(fileText);
    }

    getScriptFileNames() {
        return this._fileNames;
    }
    
    getScriptVersion(fileName: string) {
        return this._files[fileName] && this._files[fileName].version.toString();
    }

    getScriptSnapshot(fileName: string) {
        if (fileName === this._fileName) {
            return this._editorFileSnapshot;
        }
        
        if (!fs.existsSync(fileName)) {
            return undefined;
        }

        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    }

    getCurrentDirectory() {
        return vs.workspace.rootPath ?
            utils.fixWinPath(path.resolve(vs.workspace.rootPath)) : process.cwd()
    }
    
    getDefaultLibFileName(options: ts.CompilerOptions) {
        return ts.getDefaultLibFilePath(options);
    }

    getCompilationSettings(): ts.CompilerOptions {
        return this._config ? this._config.options : {};
    }
}

function resolveAndLoadConfig(fileName: string) {
    let tsConfigFileName = resolveTsConfigFileName(fileName);
    if (!tsConfigFileName) {
        return null;
    }
    
    return loadTsConfig(tsConfigFileName);
}

function loadTsConfig(fileName: string) {
    const fileParseResult = ts.parseConfigFileTextToJson(fileName, ts.sys.readFile(fileName));

    return ts.parseJsonConfigFileContent(
        fileParseResult.config,
        ts.sys,
        path.dirname(fileName));
}

function resolveTsConfigFileName(fileName: string): string {
    let searchPath = path.resolve(vs.workspace.rootPath);
    
    if (utils.isUndefined(vs.workspace.rootPath)) {
        return null;
    }
    
    let docPath = path.dirname(fileName);
    
    while (true) {
        let localTsConfig = path.resolve(path.join(docPath, tsConfigFileName));
        if (ts.sys.fileExists(localTsConfig)) {
            return localTsConfig;
        }
        
        if (path.resolve(docPath) === searchPath) {
            break;
        }
        
        docPath = path.join(docPath, "..");
    }
    
    return null;
}