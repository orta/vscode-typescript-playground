import * as vscode from "vscode"
import {
    CancellationToken,
    Uri,
    window,
    Webview,
    WebviewView,
    WebviewViewProvider,
    WebviewViewResolveContext,
    ViewColumn
  } from "vscode";
  import { getUri } from "./getUri";
  

  export class Sidebar implements WebviewViewProvider {
    public static readonly viewType = 'vscode-typescript-playground.sidebarView';
    private _view?: vscode.WebviewView;
  
    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
      webviewView: vscode.WebviewView,
      context: vscode.WebviewViewResolveContext,
      _token: vscode.CancellationToken,
    ) {

      this._view = webviewView;

      webviewView.webview.options = {
        enableScripts: true,
  
        localResourceRoots: [
          this._extensionUri
        ]
      };
  
      webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);
  
      webviewView.webview.onDidReceiveMessage(data => {
        console.log("Recieved", { data })
        switch (data.type) {
          case 'colorSelected':
            {
              vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
              break;
            }
        }
      });
    }
  


  //   public static show(extensionUri: Uri) {
	// 	const column = window.activeTextEditor
	// 		? window.activeTextEditor.viewColumn
	// 		: undefined;

	// 	const panel = window.createWebviewPanel(
	// 		Sidebar.viewType,
	// 		"Sidebar",
	// 		{ viewColumn : ViewColumn.Beside, preserveFocus: true}, 
  //           {enableScripts: true }
	// 	);

	// 	panel.webview.html = this._getWebviewContent(panel.webview, extensionUri);


	// }
  
    private  _getWebviewContent(webview: Webview, extensionUri: Uri) {
      const mainUri = getUri(webview, extensionUri, ["dist", "web", "webview.js"]);
      const stylesUri = getUri(webview, extensionUri, ["src", "webview", "style.css"]);
      const version = "4.4.4"
      const ts = "https://typescript.azureedge.net/cdn/" + version + "/typescript/lib/typescript.js"
      return `
              <!DOCTYPE html>
              <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="${mainUri}"></script>
                      <script src="${ts}"></script>
                      <link rel="stylesheet" href="${stylesUri}">
                  </head>
                  <body>
                  <vscode-panels activeid="tab-1" aria-label="With Active Tab">
                  <vscode-panel-tab id="tab-1">.JS</vscode-panel-tab>
                  <vscode-panel-tab id="tab-2">.D.TS</vscode-panel-tab>
                  <vscode-panel-tab id="tab-3">ERRORS</vscode-panel-tab>
                  <vscode-panel-view id="view-1">Problems content.</vscode-panel-view>
                  <vscode-panel-view id="view-2">Output content.</vscode-panel-view>
                  <vscode-panel-view id="view-3">Debug content.</vscode-panel-view>
                </vscode-panels>
                  </body>
              </html>
          `;
    }

    updateJS(js: string ){
      if (this._view) {
        this._view.show?.(true); 
        this._view.webview.postMessage({ command: 'updateJS', js });
      }
    }
  }
  