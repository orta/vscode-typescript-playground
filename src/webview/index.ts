import "@vscode/webview-ui-toolkit/dist/toolkit"

import { createSystem, createVirtualCompilerHost } from "./vendor/tsvfs"
import { createDesignSystem } from "./createDesignSystem"
import { setupDocsView } from "./docsView"
import { vscode } from "./vscodeWorker"

const thisTS = () => {
  // @ts-ignore
  return window["ts"] as typeof import("typescript") | undefined
}

// Get access to the VS Code API from within the webview context
window.addEventListener("load", main)

function main() {
  setVSCodeMessageListener()
  setupDocsView()

  // Make a loop checking for when we have access to the typescript API in the global scope
  const interval = setInterval(() => {
    const ts = thisTS()
    if (ts) {
      vscode.postMessage({ msg: "ts-ready", version: ts.version })
      clearInterval(interval)
    }
  }, 300)
}

function setVSCodeMessageListener() {
  // @ts-ignore
  window.addEventListener("message", (event) => {
    const command = event.data.command
    switch (command) {
      case "updateTS":
        const ts = thisTS()
        if (!ts) {
          return
        }

        const ds = createDesignSystem(ts)
        // let result = ts.transpileModule(event.data.ts, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
        const opts = { noLib: true, declaration: true }

        const fsMap = new Map() // await tsvfs.createDefaultMapFromCDN(compilerOptions, ts.version, true, ts)
        fsMap.set("index.tsx", event.data.ts)

        const system = createSystem(fsMap)
        const host = createVirtualCompilerHost(system, opts, ts)

        const program = ts.createProgram({
          rootNames: [...fsMap.keys()],
          options: opts,
          host: host.compilerHost,
        })

        program.emit()

        // js
        const v1 = document.getElementById("view-1")
        if (v1) {
          const jsDS = ds(v1)
          jsDS.clear()
          jsDS.code(fsMap.get("index.js"))
        }

        // dts
        const v2 = document.getElementById("view-2")
        if (v2) {
          // v2.textContent = result.outputText
          const jsDS = ds(v2)
          jsDS.clear()
          jsDS.code(fsMap.get("index.d.ts"))
        }

        // diags
        const v3 = document.getElementById("view-3")
        if (v3) {
          const errorDS = ds(v3)
          errorDS.clear()

          const errorTab = document.getElementById("tab-3")!

          if (event.data.diags.length) {
            errorTab.innerHTML = `ERRORS <vscode-badge appearance="secondary">${event.data.diags.length}</vscode-badge>`
            const diags = event.data.diags as import("vscode").Diagnostic[]
            const tsDiags = diags.filter((d) => d.source === "ts")

            const tsStyleDiags = tsDiags.map((d) => {
              const tsd: import("typescript").DiagnosticRelatedInformation = {
                category: markerToDiagSeverity(d.severity as any),
                code: d.code as any,
                messageText: d.message,
                file: undefined,
                // @ts-ignore the JSONification process destroys the class
                length: d.range[1].character - d.range[0].character,
                // @ts-ignore
                start: d.range[1].character,
              }
              return tsd
            })
            errorDS.listDiags(tsStyleDiags)
          } else {
            errorTab.innerHTML = "ERRORS"
          }
        }

        break
    }
  })
}

const markerToDiagSeverity = (markerSev: string) => {
  switch (markerSev) {
    case "Error":
      return 1
    case "Warning":
      return 0
    case "Hint":
      return 2
    case "Information":
      return 3
    default:
      return 3
  }
}
