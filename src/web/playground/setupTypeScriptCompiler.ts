type TS = typeof import("typescript")
import fetchProgress from 'fetch-progress'

type UIDelegate = {
    started: () => void
    progress: (progress: { total: number, transferred: number }) => void
    finished: () => void
    ready: (ts: TS) => void
    error: (error: Error) => void
}

// This doesn't work ATM due to the security policy not allowing 

// export const setupTypeScriptVersionFetch = (version: string, ui: UIDelegate) =>
//     fetch(`https://typescript.azureedge.net/cdn/${version}/typescript/lib/typescript.js`)
//         .then(
//             fetchProgress({
//                 onProgress(progress) {
//                     ui.progress(progress)
//                 },
//                 onError(err: Error) { ui.error(err) },
//             })
//         )
//         .then(r => r.text())
//         .then(src => {
//             ui.finished()
//             const ts  = eval(src)
//             ui.ready(ts)
//             return ts
//         });


export const setupTypeScriptVersionImport = (version: string, ui: UIDelegate) => {}
    // import(`https://typescript.azureedge.net/cdn/${version}/typescript/lib/typescript.js`).then(r => r)