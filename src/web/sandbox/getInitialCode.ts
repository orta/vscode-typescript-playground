import * as vscode from 'vscode';

import { decompressFromEncodedURIComponent } from "./vendor/lzstring.min"

export const getInitialCode = (fallback: string, location: vscode.Uri) => {
    // Old school support
    if (location.fragment.startsWith("src")) {
        const code = location.fragment.replace("src=", "").trim()
        return decodeURIComponent(code)
    }

    // New school support
    if (location.fragment.startsWith("code")) {
        const code = location.fragment.replace("code/", "").trim()
        let userCode = decompressFromEncodedURIComponent(code)
        // Fallback incase there is an extra level of decoding:
        // https://gitter.im/Microsoft/TypeScript?at=5dc478ab9c39821509ff189a
        if (!userCode) { userCode = decompressFromEncodedURIComponent(decodeURIComponent(code)) }
        return userCode
    }

    return fallback
}
