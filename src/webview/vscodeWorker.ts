export type VSCode = {
  // postMessage<T extends Message = Message>(message: T): void;
  postMessage(message: any): void
  getState(): any
  setState(state: any): void
}

declare function acquireVsCodeApi(): VSCode
export const vscode = acquireVsCodeApi()
