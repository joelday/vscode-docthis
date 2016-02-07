import * as path from "path";
import * as ts from "typescript";

export function fixWinPath(filePath: string) {
    if (path.sep === "\\") {
        return filePath.replace(/\\/g, "/");
    }
    
    return filePath;
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

export function formatTypeName(typeName: string) {
    typeName = typeName.trim();
    
    if (typeName === "") {
        return null;
    }
    
    if (typeName === "any") {
        return "*";
    }
    
    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }
    
    return "{" + typeName + "}";
}