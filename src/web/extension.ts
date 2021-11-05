// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { VFS } from '../lib/VFS';
import { getTSConfigForConfig } from './playground/exporter';
import { getDefaultSandboxCompilerOptions } from './sandbox/compilerOptions';
import { getInitialCode } from './sandbox/getInitialCode';
import { Sidebar } from './sidebar/webviewProvider';
import {transpileModule} from "typescript"

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const memFs = new VFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('playfs', memFs, { isCaseSensitive: true }));
    
    
    memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer('// Base'), { create: true, overwrite: true });
    
    const compilerDefaults = getTSConfigForConfig(getDefaultSandboxCompilerOptions(false, {}))
    memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerDefaults), { create: true, overwrite: true, readonly: true });

    console.log('Started playground');

    let disposable = vscode.commands.registerCommand('vscode-typescript-playground.startNewPlayground', () => {
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('playfs:/'), name: "TypeScript Playground" });

        // const descriptor = {
        //     uri: vscode.Uri.parse("playfs:/"),
        // }

        return vscode.commands.executeCommand('vscode.openFolder', undefined, {
            forceNewWindow: true,
            forceLocalWindow: false,
        });
    });

    context.subscriptions.push(disposable);

    const provider = new Sidebar(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(Sidebar.viewType, provider),
        vscode.commands.registerCommand('vscode-typescript-playground.showSidebar', () => {}),
        vscode.workspace.onDidChangeTextDocument((e) => {
            const doc = e.document

            const js = transpileModule(doc.getText(), {})
            provider.updateJS(js.outputText)

        })
    );

    // setTimeout(() => {
    //     vscode.commands.executeCommand("vscode-typescript-playground.startNewPlayground")
    // }, 300)



    const extensionId = 'Orta.vscode-typescript-playground';
    // open vscode-insiders://Orta.vscode-typescript-playground/

    context.subscriptions.push(vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
            const code = getInitialCode("Failed", uri)
            if (code !== "Failed") {
                memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer(code), { create: true, overwrite: true });
            }
        }
    }));

}

// this method is called when your extension is deactivated
export function deactivate() { }

const toBuffer = (text: string) => Uint8Array.from(Array.from(text).map(letter => letter.charCodeAt(0)));
