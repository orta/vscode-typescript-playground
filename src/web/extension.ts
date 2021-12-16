import * as vscode from "vscode"
import { debounce } from "ts-debounce"

import { getTSConfigForConfig } from "./playground/exporter"
import { getCompilerOptionsFromParams, getDefaultSandboxCompilerOptions } from "./sandbox/compilerOptions"
import { getInitialCode } from "./sandbox/getInitialCode"
import { Sidebar } from "./sidebar/webviewProvider"
import { configureForEnv, isWeb } from "./workspace"
import { OpenInVisualEditorCodeLensProvider } from "./tsconfig/codeActions"
import { createURLQueryWithCompilerOptions } from "./sandbox/compilerOptions"

// import { LocalStorageService } from "./storage"
import { VFS } from "../lib/VFS"
import { initialCode } from "./initialCode"
import { Example } from "../webview/getExamplesJSON"
import { ExamplesTreeProvider } from "./examples/examplesTreeView"
import { getExampleSourceCode } from "./examples/getExampleSourceCode"

let originalParams = ""
const urlForSite = "https://insiders.vscode.dev/tsplay/"

export function activate(context: vscode.ExtensionContext) {
  console.log("started ts playground")
  configureForEnv(context)

  const memFs = new VFS()
  context.subscriptions.push(vscode.workspace.registerFileSystemProvider("playfs", memFs, { isCaseSensitive: true }))
  memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer(initialCode), { create: true, overwrite: true })

  const compilerDefaults = getTSConfigForConfig(getDefaultSandboxCompilerOptions(false, {}))
  memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerDefaults), { create: true, overwrite: true })

  console.log("Started playground")

  let addToWorkspaceD = vscode.commands.registerCommand("vscode-typescript-playground.addPlaygroundToWorkspace", () => {
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse("playfs:/"), name: "TypeScript Playground" })
  })

  let openEditorD = vscode.commands.registerCommand("vscode-typescript-playground.openVisualTSConfigEditor", () => {
    vscode.commands.executeCommand("workbench.action.openSettings", { target: "MEMORY", query: "@ext:Orta.tspl" })
  })

  let openExampleWithIDD = vscode.commands.registerCommand("vscode-typescript-playground.openExampleWithID", async (id: string) => {
    const content = await getExampleSourceCode("en", id)
    if (content.code) {
      updateIndex(content.code)
    }
  })

  let copyURLD = vscode.commands.registerCommand("vscode-typescript-playground.copyURLForPlayground", () => {
    const code = String(memFs.readFile(vscode.Uri.parse(`playfs:/index.tsx`)))
    const defaultCompilerOptions = getDefaultSandboxCompilerOptions(false, {})
    const currentCompilerOptions = {}
    const query = createURLQueryWithCompilerOptions({ code, defaultCompilerOptions, originalParams, currentCompilerOptions })
    const fullURL = `${urlForSite}${query}`
    // window.history.replaceState({}, "", fullURL)

    vscode.env.clipboard.writeText(fullURL)
    vscode.window.showInformationMessage("Copied to clipboard")
  })

  const shareButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  shareButton.command = "vscode-typescript-playground.copyURLForPlayground"
  shareButton.text = "Copy Playground URL"
  // shareButton.color = new vscode.ThemeColor("textLink.foreground")
  shareButton.tooltip = "Clicking this button will copy the URL with your changes for sharing with others."
  shareButton.show()

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

  const updateTSViews = (doc: vscode.TextDocument, suppressHashChange?: boolean) => {
    const isTSishFile = doc.uri.path.endsWith(".ts") || doc.uri.path.endsWith(".tsx")
    if (!isTSishFile) {
      return
    }

    const code = doc.getText()
    const diags = vscode.languages.getDiagnostics(doc.uri)
    sidebar.updateTS(code, diags)

    // TODO: This doesn't work because we're in a worker
    if (!suppressHashChange && isWeb) {
      //
    }
    // vscode.commands.executeCommand("typescript.tsserverRequest", "emit-output", { file: "^/playfs/index.tsx" }).then((r) => {
    //   console.log("Sent")
    //   console.log(r)
    // })
  }
  const debouncedUpdateTSView = debounce(updateTSViews, 300)

  const ready = () => {
    vscode.workspace.textDocuments.forEach((d) => {
      if (d.fileName.endsWith("index.tsx")) {
        const suppressHashChange = true
        updateTSViews(d, suppressHashChange)
      }
    })
  }

  const updateIndex = (code: string, example?: Example) => {
    memFs.writeFile(vscode.Uri.parse(`playfs:/index.tsx`), toBuffer(code), { create: true, overwrite: true })
    showIndexPage()
  }

  const sidebar = new Sidebar(context.extensionUri, { ready, updateIndex })

  const showIndexPage = () => {
    const localURL = vscode.Uri.parse(`playfs:/index.tsx`)
    vscode.workspace.openTextDocument(localURL).then((doc) => {
      if (doc) {
        vscode.window.showTextDocument(doc, { preview: false })
      }
    })
  }

  // You can trigger via:
  // open vscode-insiders://Orta.vscode-typescript-playground/
  const extensionId = "Orta.vscode-typescript-playground"

  const uriHandlerD = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      originalParams = uri.query

      const code = getInitialCode("Failed", uri)
      const localURL = vscode.Uri.parse(`playfs:/index.tsx`)
      if (code !== "Failed") {
        memFs.writeFile(localURL, toBuffer(code), { create: true, overwrite: true })
      }

      showIndexPage()

      // Show the right sidebar
      vscode.commands.executeCommand("workbench.view.extension.ts-playground")

      // TODO: This needs TS which means it has to run in the worker to be accurate to the playground
      // const fakeTS = { optionDeclarations: [] } as any

      // const params = new URLSearchParams(uri.query)
      // const defaults = getDefaultSandboxCompilerOptions(false, {})
      // const paramConfig = getCompilerOptionsFromParams(defaults, fakeTS, params)
      // const compilerOpts = getTSConfigForConfig(paramConfig)
      // memFs.writeFile(vscode.Uri.parse(`playfs:/tsconfig.json`), toBuffer(compilerOpts), {
      //   create: true,
      //   overwrite: true,
      //   readonly: true,
      // })
    },
  })

  const nodeDependenciesProvider = new ExamplesTreeProvider()
  const tree = vscode.window.registerTreeDataProvider("vscode-typescript-playground.examplesTreeView", nodeDependenciesProvider)

  context.subscriptions.push(
    startNewD,
    addToWorkspaceD,
    openEditorD,
    codelensD,
    vscode.window.registerWebviewViewProvider(Sidebar.viewType, sidebar, { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand("vscode-typescript-playground.showSidebar", () => {
      vscode.commands.executeCommand("workbench.view.extension.ts-playground")
    }),
    vscode.workspace.onDidChangeTextDocument((e) => debouncedUpdateTSView(e.document)),
    uriHandlerD,
    shareButton,
    copyURLD,
    tree,
    openExampleWithIDD
  )
}

// this method is called when your extension is deactivated
export function deactivate() {}

const toBuffer = (text: string) => Uint8Array.from(Array.from(text).map((letter) => letter.charCodeAt(0)))
