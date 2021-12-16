import * as vscode from "vscode"
import { Section, Example, ExamplesOverview, getExamples } from "../../webview/getExamplesJSON"

const examplesToTree = (response: ExamplesOverview) => {
  const tree: Record<string, Item> = {}

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

  const item = (name: string, state: vscode.TreeItemCollapsibleState) => new Item(name, name, {}, state)

  response.examples.forEach((ex: any) => {
    for (let index = 0; index < ex.path.length; index++) {
      // Setup
      let top = ex.path[0]
      if (top) {
        tree[top] ||= item(top, vscode.TreeItemCollapsibleState.Collapsed)
      }
      let mid = ex.path[1]
      if (mid) {
        tree[top].children[mid] ||= item(mid, vscode.TreeItemCollapsibleState.Collapsed)
      }
      let end = ex.path[2]
      if (end) {
        tree[top].children[mid].children[end] ||= item(end, vscode.TreeItemCollapsibleState.Expanded)
      }

      // Adding example
      if (end) {
        tree[top].children[mid].children[end]
        return
      }
      if (mid) {
        tree[top].children[mid].examples.push(ex)
        return
      }
      tree[top].examples.push(ex)
    }
  })
  return tree
}

export class ExamplesTreeProvider implements vscode.TreeDataProvider<Item> {
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>()
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event

  private tree!: Record<string, Item>

  constructor() {
    getExamples().then((examples) => {
      this.tree = examplesToTree(examples)
      console.log({ tree: this.tree })
      this._onDidChangeTreeData.fire(this.tree)
    })
  }

  getTreeItem(element: Item): vscode.TreeItem {
    if (!element) {
      return new Item("Downloading", "", {}, vscode.TreeItemCollapsibleState.None)
    }
    return element
  }

  getChildren(element?: Item) {
    let children: Item[] = []
    if (!element && this.tree) {
      // Top level
      const keys = Object.keys(this.tree)
      children = keys.map((k) => this.tree[k]).reverse()
    } else if (element && element.examples.length) {
      children = element.examples.map((e) => {
        const item = new Item(e.name, e.name, {}, vscode.TreeItemCollapsibleState.None)
        item.iconPath = new vscode.ThemeIcon("file")
        item.command = { title: "Open", command: "vscode-typescript-playground.openExampleWithID", arguments: [e.id] }
        return item
      })
    } else if (element) {
      children = element.kids()
    }
    return Promise.resolve(children)
  }
}

class Item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly oneliner: string,
    public readonly children: Record<string, Item>,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState)
    this.tooltip = `${this.label} ${this.oneliner}`
    // this.description = this.oneliner
  }

  public examples: Example[] = []

  kids() {
    const keys = Object.keys(this.children)
    return keys.map((k) => this.children[k])
  }

  //   iconPath = {
  //     light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
  //     dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  //   }
}
