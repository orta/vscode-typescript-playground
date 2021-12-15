import * as vscode from "vscode"
import { debounce } from "ts-debounce"

import { getTSConfigForConfig } from "./playground/exporter"
import { getCompilerOptionsFromParams, getDefaultSandboxCompilerOptions } from "./sandbox/compilerOptions"
import { getInitialCode } from "./sandbox/getInitialCode"
import { Sidebar } from "./sidebar/webviewProvider"
import { configureForEnv } from "./workspace"
import { OpenInVisualEditorCodeLensProvider } from "./tsconfig/codeActions"
// import { LocalStorageService } from "./storage"
import { VFS } from "../lib/VFS"
import { initialCode } from "./initialCode"

export function activate(context: vscode.ExtensionContext) {
  console.log("started ts playground")
  configureForEnv(context)

  const memFs = new VFS()
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider("playfs", memFs, { isCaseSensitive: true }))
  memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer(initialCode), { create: true, overwrite: true })

  const compilerDefaults = getTSConfigForConfig(getDefaultSandboxCompilerOptions(false, {}))
  memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerDefaults), { create: true, overwrite: true, readonly: true })

  console.log("Started playground")

  let addToWorkspaceD = vscode.commands.registerCommand("vscode-typescript-playground.addPlaygroundToWorkspace", () => {
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse("playfs:/"), name: "TypeScript Playground" })
  })

  let openEditorD = vscode.commands.registerCommand("vscode-typescript-playground.openVisualTSConfigEditor", () => {
    vscode.commands.executeCommand("workbench.action.openSettings", { target: "MEMORY", query: "@ext:Orta.tspl" })
  })

  const codeEditor = new OpenInVisualEditorCodeLensProvider()
  const codelensD = vscode.languages.registerCodeLensProvider({ pattern: "/tsconfig.json" }, codeEditor)

  let startNewD = vscode.commands.registerCommand("vscode-typescript-playground.startNewPlayground", () => {
    const isDev = true
    if (isDev) {
      return vscode.commands.executeCommand("vscode-typescript-playground.addPlaygroundToWorkspace")
    } else {
      return vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse("playfs:/"), {
        forceNewWindow: !isDev,
        forceLocalWindow: isDev,
      })
    }
  })

  const updateTSViews = (doc: vscode.TextDocument) => {
    const diags = vscode.languages.getDiagnostics(doc.uri)
    sidebar.updateTS(doc.getText(), diags)

    // vscode.commands.executeCommand("typescript.tsserverRequest", "emit-output", { file: "^/playfs/index.tsx" }).then((r) => {
    //   console.log("Sent")
    //   console.log(r)
    // })
  }
  const debouncedUpdateTSView = debounce(updateTSViews, 300)

  const sidebar = new Sidebar(context.extensionUri, () => {
    vscode.workspace.textDocuments.forEach((d) => {
      if (d.fileName.endsWith("index.tsx")) {
        updateTSViews(d)
      }
    })
  })

  // You can trigger via:
  // open vscode-insiders://Orta.vscode-typescript-playground/
  const extensionId = "Orta.vscode-typescript-playground"

  const uriHandlerD = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      console.log("Handle URI: ", uri)
      const code = getInitialCode("Failed", uri)
      const localURL = vscode.Uri.parse(`playfs:/index.tsx`)
      if (code !== "Failed") {
        memFs.writeFile(localURL, toBuffer(code), { create: true, overwrite: true })
      }

      // Show the main index
      vscode.workspace.openTextDocument(localURL).then((doc) => {
        if (doc) {
          vscode.window.showTextDocument(doc, { preview: false })
        }
      })

      // Show the right sidebar
      vscode.commands.executeCommand("workbench.view.extension.ts-playground")

      // TODO: This needs TS which means it has to run in the worker to be accurate to the playground
      const fakeTS = { optionDeclarations: [] } as any

      const params = new URLSearchParams(uri.query)
      const defaults = getDefaultSandboxCompilerOptions(false, {})
      const paramConfig = getCompilerOptionsFromParams(defaults, fakeTS, params)
      const compilerOpts = getTSConfigForConfig(paramConfig)
      memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerOpts), {
        create: true,
        overwrite: true,
        readonly: true,
      })
    },
  })

  context.subscriptions.push(
    startNewD,
    addToWorkspaceD,
    openEditorD,
    codelensD,
    vscode.window.registerWebviewViewProvider(Sidebar.viewType, sidebar, { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand("vscode-typescript-playground.showSidebar", () => {}),
    vscode.workspace.onDidChangeTextDocument((e) => debouncedUpdateTSView(e.document)),
    uriHandlerD
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}

const toBuffer = (text: string) => Uint8Array.from(Array.from(text).map((letter) => letter.charCodeAt(0)))
