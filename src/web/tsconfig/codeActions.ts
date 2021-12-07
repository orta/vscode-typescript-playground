import * as vscode from "vscode";

export class OpenInVisualEditorCodeLensProvider implements vscode.CodeLensProvider {
    public provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken) {

        const workbench = {
            title: "Open in Visual Editor",
            command: "vscode-typescript-playground.openVisualTSConfigEditor",
            arguments: [],
        }
        const zero = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))
        return [new vscode.CodeLens(zero, workbench)];

    }
}
