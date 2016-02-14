import * as path from "path";
import * as ts from "typescript";

const supportedNodeKinds = [
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.PropertyDeclaration,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.EnumMember,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.MethodSignature,
    ts.SyntaxKind.PropertySignature,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.FunctionExpression];

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

export function findFirstChildOfKindDepthFirst(node: ts.Node, kinds = supportedNodeKinds): ts.Node {
    let children = node.getChildren();
    for (let c of children) {
        if (nodeIsOfKind(c, kinds)) {
            return c;
        }

        const matching = findFirstChildOfKindDepthFirst(c, kinds);
        if (matching) {
            return matching;
        }
    }

    return null;
}

export function findChildrenOfKind(node: ts.Node, kinds = supportedNodeKinds) {
    let children: ts.Node[] = [];

    node.getChildren().forEach(c => {
        if (nodeIsOfKind(c, kinds)) {
            children.push(c);
        }

        children = children.concat(findChildrenOfKind(c, kinds));
    });

    return children;
}

export function findNonVoidReturnInCurrentScope(node: ts.Node) {
    let returnNode: ts.ReturnStatement;

    const children = node.getChildren();

    returnNode = <ts.ReturnStatement>children.find(n => n.kind === ts.SyntaxKind.ReturnStatement);

    if (returnNode) {
        if (returnNode.getChildren().length > 1) {
            return returnNode;
        }
    }

    for (let child of children) {
        if (child.kind === ts.SyntaxKind.FunctionDeclaration || child.kind === ts.SyntaxKind.FunctionExpression || child.kind === ts.SyntaxKind.ArrowFunction) {
            continue;
        }

        returnNode = findNonVoidReturnInCurrentScope(child);
        if (returnNode) {
            return returnNode;
        }
    }

    return returnNode;
}

export function findVisibleChildrenOfKind(node: ts.Node, kinds = supportedNodeKinds) {
    let children = findChildrenOfKind(node, supportedNodeKinds);

    return children.filter(child => {
        if (child.modifiers && child.modifiers.find(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
            return false;
        }

        if (child.kind === ts.SyntaxKind.ClassDeclaration ||
            child.kind === ts.SyntaxKind.InterfaceDeclaration ||
            child.kind === ts.SyntaxKind.FunctionDeclaration) {
                if (!child.modifiers || !child.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                    return false;
                }
            }

        return true;
    });
}

export function nodeIsOfKind(node: ts.Node, kinds = supportedNodeKinds) {
    return !!node && !!kinds.find(k => node.kind === k);
}

export function findFirstParent(node: ts.Node, kinds = supportedNodeKinds) {
    let parent = node.parent;
    while (parent) {
        if (nodeIsOfKind(parent, kinds)) {
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
        return "{*}";
    }

    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }

    return "{" + typeName + "}";
}