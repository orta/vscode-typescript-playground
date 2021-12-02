import * as vscode from 'vscode';
import { debounce } from 'ts-debounce';
import { VFS } from '../lib/VFS';
import { getTSConfigForConfig } from './playground/exporter';
import { getDefaultSandboxCompilerOptions } from './sandbox/compilerOptions';
import { getInitialCode } from './sandbox/getInitialCode';
import { Sidebar } from './sidebar/webviewProvider';
import { configureForEnv } from './workspace';
import { setupTypeScriptVersionImport } from './playground/setUpTypeScriptCompiler';
import { startTSWorker } from './playground/startTSWorker';

export function activate(context: vscode.ExtensionContext) {
    console.log("---------------")
    console.log("started ts playground")
    configureForEnv(context)

    const memFs = new VFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('playfs', memFs, { isCaseSensitive: true }));

    memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer('// Empty file'), { create: true, overwrite: true });

    const compilerDefaults = getTSConfigForConfig(getDefaultSandboxCompilerOptions(false, {}))
    memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerDefaults), { create: true, overwrite: true, readonly: true });

    console.log('Started playground');

    let disposable2 = vscode.commands.registerCommand('vscode-typescript-playground.addPlaygroundToWorkspace', () => {
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('playfs:/'), name: "TypeScript Playground" });
    })

    let disposable = vscode.commands.registerCommand('vscode-typescript-playground.startNewPlayground', () => {
        const isDev = true
        if (isDev) {
            return vscode.commands.executeCommand('vscode-typescript-playground.addPlaygroundToWorkspace')
        } else {
            return vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse('playfs:/'), {
                forceNewWindow: !isDev,
                forceLocalWindow: isDev,
            });
        }
    });


    // startTSWorker(context.extensionUri, "4.4.4")

    // setupTypeScriptVersionImport("4.4.4", {
    //     finished: () => {
    //         console.log("about to parse")
    //     },
    //     progress: () => {},
    //     ready: () => {
    //         console.log("done")
    //     },
    //     started: () => {},
    //     error: () => {}
    // }).then(r => {
    //     console.log("12313123")
    //     console.log(r)
    // })

    context.subscriptions.push(disposable, disposable2);

    const provider = new Sidebar(context.extensionUri, memFs);

    const updateTSViews = (doc: vscode.TextDocument) => {
        const diags = vscode.languages.getDiagnostics(doc.uri);
        provider.updateTS(doc.getText(), diags)

    }
    const debouncedUpdateTSView = debounce(updateTSViews, 300);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(Sidebar.viewType, provider, { webviewOptions: { retainContextWhenHidden: true } }),
        vscode.commands.registerCommand('vscode-typescript-playground.showSidebar', () => { }),
        vscode.workspace.onDidChangeTextDocument((e) => debouncedUpdateTSView(e.document))
    );

    // You can trigger via:
    // open vscode-insiders://Orta.vscode-typescript-playground/
    const extensionId = 'Orta.vscode-typescript-playground';

    context.subscriptions.push(vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
            console.log("Handle URI: ", uri)
            const code = getInitialCode("Failed", uri)
            if (code !== "Failed") {
                memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer(code), { create: true, overwrite: true });
            }

            // This needs TS which means it has to run in the worker

            // const params = new URLSearchParams(params)
            // const compilerDefaults = getTSConfigForConfig(getDefaultSandboxCompilerOptions(false, {}))
            // memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerDefaults), { create: true, overwrite: true, readonly: true });

        }
    }));

}

// this method is called when your extension is deactivated
export function deactivate() { }

const toBuffer = (text: string) => Uint8Array.from(Array.from(text).map(letter => letter.charCodeAt(0)));
