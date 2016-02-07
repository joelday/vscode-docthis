import * as path from "path";
import * as ts from "typescript";

export function fixWinPath(filePath: string) {
    if (path.sep === "\\") {
        return filePath.replace(/\\/g, "/");
    }
    
    return filePath;
}

export function isUndefined(obj: any): boolean {
    return typeof obj === "undefined";
}

export function isNullOrUndefined(obj: any): boolean {
    return obj === null || isUndefined(obj);
}

export function firstOrNull<T>(arr: T[], callbackfn: (value: T, index?: number, arr?: T[]) => boolean): T {
    let result: T = null;
    
    arr.every((v, i, a) => {
        let match = callbackfn(v, i, a);
        if (!!match) {
            result = v;
            return false;
        }
        return true;
    });
    
    return result;
}

export function where<T>(arr: T[], callbackfn: (value: T, index?: number, arr?: T[]) => boolean): T[] {
    let results: T[] = [];
    
    arr.forEach((v, i, a) => {
        if (callbackfn(v, i, a)) {
            results.push(v);
        }
    });
    
    return results;
}

export function findChildForPosition(node: ts.Node, position: number): ts.Node {
    let lastMatchingNode: ts.Node;
    
    const findChildFunc = (n: ts.Node) => {
        const start = n.pos;
        const end = n.end;
        
        if (start > position) {
            return;
        }
        
        if (start <= position && end >= position) {
            lastMatchingNode = n;
        }
        
        n.getChildren().forEach(findChildFunc);
    };
    
    findChildFunc(node);
    
    return lastMatchingNode;
}

export function findFirstParentOfKind(node: ts.Node, kind: ts.SyntaxKind) {
    let parent = node.parent;
    while (parent) {
        if ((parent.kind & kind) !== 0) {
            return parent;
        }
        
        parent = parent.parent;
    }
    
    return null;
}

export class StringBuilder {
    private _text = "";
    
    append(text = "") {
        this._text += text;
    }
    
    appendLine(text = "") {
        this._text += text + "\n";
    }
    
    toString() {
        return this._text;
    }
    
    toCommentString(indent = "") {
        let sb = new StringBuilder();
        
        sb.appendLine("/**");
        
        this._text.trim().split("\n").forEach((line) => {
            sb.append(indent + " * ");
            sb.appendLine(line);
        });
        
        sb.appendLine(indent + " */");
        sb.append(indent);
        
        return sb.toString();
    }
}

export function camelCaseToSentenceCase(text: string) {
    return text.replace(/([^A-Z]+)|([A-Z]+[^A-Z]*)/g,
    (word) => {
        return word.toLowerCase() + " "; 
    }).trim();
}

export function vowelPrefixedSentenceCase(name: string) {
    let text = camelCaseToSentenceCase(name);
    return (/^[aeiouAEIOU]/.test(text) ? "an" : "a") + " " + text;
}

export function formatTypeName(typeName: string) {
    if (typeName === "any" || typeName === "") {
        return "*";
    }
    
    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }
    
    return typeName;
}