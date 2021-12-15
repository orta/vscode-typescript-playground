import * as vscode from "vscode"
import { Section, Example, ExamplesOverview, getExamples } from "../../webview/getExamplesJSON"

const examplesToTree = (response: ExamplesOverview) => {
  const tree: any = {}

  //   "3-7": {
  //     "Fixits": {
  //       "big-number-literals": {
  //         "path": [
  //           "3-7",
  //           "Fixits"
  //         ],
  //         "title": "Big number literals",
  //         "name": "Big number literals.ts",
  //         "lang": "en",
  //         "id": "big-number-literals",
  //         "sortIndex": 1,
  //         "hash": "825910677db5ef34b5903dbbe9633e95",
  //         "compilerSettings": {
  //           "target": 99
  //         }
  //       },
  //       "const-to-let": {

  response.examples.forEach((ex: any) => {
    for (let index = 0; index < ex.path.length; index++) {
      // Setup
      let top = ex.path[0]
      if (top) {
        tree[top] ||= {}
      }
      let mid = ex.path[1]
      if (mid) {
        tree[top][mid] ||= {}
      }
      let end = ex.path[2]
      if (end) {
        tree[top][mid][end] ||= {}
      }

      // Adding example
      if (end) {
        tree[top][mid][end][ex.id] = ex
        return
      }
      if (mid) {
        tree[top][mid][ex.id] = ex
        return
      }
      tree[top][ex.id] = ex
    }
  })
  return tree
}

export class ExamplesTreeProvider implements vscode.TreeDataProvider<any> {
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>()
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event

  private tree: any
  constructor() {
    getExamples().then((examples) => {
      this.tree = examplesToTree(examples)
      console.log("-------------", this.tree)
      this._onDidChangeTreeData.fire(this.tree)
    })
  }

  getTreeItem(element: any): vscode.TreeItem {
    if (!element) {
      return new Item("Downloading", "", vscode.TreeItemCollapsibleState.None)
    }

    if ("hash" in element) {
      return new Item(element.title, element.id, vscode.TreeItemCollapsibleState.None)
    } else {
      return new Item(element, element, vscode.TreeItemCollapsibleState.Expanded)
    }
  }

  getChildren(element?: any): Thenable<vscode.TreeItem[]> {
    if (!element && this.tree) {
      // Top level
      const keys = Object.keys(this.tree)
      return Promise.resolve(keys.map((k) => new Item(k, k, vscode.TreeItemCollapsibleState.Expanded)))
    } else if (!element) {
      // NOOP for empty
      return Promise.resolve([])
    }

    if ("hash" in element) {
      return Promise.resolve([])
    } else {
      return Promise.resolve([new Item(element, element, vscode.TreeItemCollapsibleState.Expanded)])
    }
  }
}

class Item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly oneliner: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState)
    this.tooltip = `${this.label} ${this.oneliner}`
    this.description = this.oneliner
  }

  //   iconPath = {
  //     light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
  //     dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  //   }
}
