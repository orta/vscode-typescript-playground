import "@vscode/webview-ui-toolkit/dist/toolkit"

type VSCode = {
  // postMessage<T extends Message = Message>(message: T): void;
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};
declare function acquireVsCodeApi(): VSCode

// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

window.addEventListener("load", main);
function main() {
  setVSCodeMessageListener();
  vscode.postMessage("OK")
}


function setVSCodeMessageListener() {
  window.addEventListener("message", (event) => {
    const command = event.data.command;
    console.log(event.data)
    switch (command) {
      case "updateJS":
        console.log("updating JS")
        const v1 = document.getElementById("view-1")
        if(v1) {
          v1.textContent = event.data.js
        } else {
          console.log("no v1")
        }
        break;
    }
  });
}