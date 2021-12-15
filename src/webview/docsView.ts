import { getExampleSourceCode } from "../web/examples/getExampleSourceCode"
import { createDesignSystem } from "./createDesignSystem"
import { getExamples } from "./getExamplesJSON"
import { vscode } from "./vscodeWorker"

export const setupDocsView = async () => {
  const docsContainer = document.getElementById("docs-container")!
  const docsDiv = docsContainer.children.item(0)!
  const examples = await getExamples()
  const ds = createDesignSystem()(docsDiv)

  ds.clear()
  examples.sections.forEach((d) => {
    ds.subtitle(d.name)
    ds.p(d.subtitle)

    examples.examples
      .filter((e) => e.path[0] === d.id || e.path[0].replace("-", ".") === d.id)
      .forEach((ex) => {
        ds.button({
          label: ex.name,
          onclick: async (e) => {
            const button = e.target as HTMLButtonElement
            button.disabled = true

            const content = await getExampleSourceCode("en", ex.id)
            vscode.postMessage({ msg: "update-index", code: content.code, example: content.example })
            button.disabled = false
          },
        })
      })
  })
}
