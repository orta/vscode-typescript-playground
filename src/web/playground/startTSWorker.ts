import { Uri } from "vscode";

export const startTSWorker = async (extensionUri: Uri, version: string) => {
    // const workerPath = Uri.joinPath(extensionUri, '/tsworker.js') + "?version=" + version
    // const myWorker = new Worker("file:/" + Uri.joinPath(extensionUri, '/tsworker.js').fsPath + "?version="+version);
    // myWorker.onerror = (err) => {
    //     console.error(err)
    // }
    // myWorker.onmessage = (msg) => {
    //     console.log(msg)
    // }


    // const res = await fetch( workerPath)
    // const blob = await res.blob()
    // const code = `/******/ (() => { // webpackBootstrap
    //     /******/ 	"use strict";
    //     var __webpack_exports__ = {};
        
    //     // @ts-ignore
    //     const params = new URLSearchParams(self.search);
    //     if (!params.get("version")) {
    //         throw new Error("Did not get a version in the query for TypeScript");
    //     }
    //     console.log("first")
    //     importScripts("https://typescript.azureedge.net/cdn/" + params.get("version") + "/typescript/lib/typescript.js");
    //     console.log("second")
    //     // @ts-ignore
    //     console.log(ts);
        
    //     var __webpack_export_target__ = exports;
    //     for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
    //     if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
    //     /******/ })()
    //     ;
    //     //# sourceMappingURL=tsworker.js.map`
    //     const blob = new Blob([code], {type: 'application/javascript'})
    // const blobUrl = URL.createObjectURL(blob)
    // const myWorker = new Worker(blobUrl);
    // console.log("started")

    // myWorker.onerror = (err) => {
    //     debugger
    //     console.log("werr")
    //     console.error(err)
    // }
    // myWorker.onmessage = (msg) => {
    //     console.log(msg)
    // }

    // console.log({ myWorker })
    // first.onchange = function() {
    //   myWorker.postMessage([first.value, second.value]);
    //   console.log('Message posted to worker');
    // }

}