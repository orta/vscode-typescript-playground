// @ts-ignore
import { env, ExtensionContext, UIKind, ExtensionRuntime} from "vscode";

export let isWeb: boolean;

export function configureForEnv(context: ExtensionContext): string {
    const workspaceId = getWorkspaceId(context);
    isWeb = env.uiKind === UIKind.Web;
    console.warn(
        // @ts-ignore
        `Running on the ${isWeb ? 'web' : 'desktop'} workspaceId=${workspaceId}; storageUri=${context.globalStorageUri.toString(true)}`,
    );

    return workspaceId;
}

const workspaceIdRegex = /\/workspaceStorage\/(?<id>[^/]+)/i;

function getWorkspaceId(context: ExtensionContext): string {
    if (context.storageUri === undefined) {return '';}

    const match = workspaceIdRegex.exec(context.storageUri.path);

    let workspaceId;
    if (!match?.groups?.id) {
        workspaceId = context.storageUri.path;
        const index = indexOfDifference(context.globalStorageUri.path, workspaceId);

        const extensionSuffix = `/${context.extension.id}`;
        if (workspaceId.endsWith(extensionSuffix)) {
            workspaceId = workspaceId.slice(index, -extensionSuffix.length);
        } else {
            workspaceId = workspaceId.substr(index);
        }
    } else {
        workspaceId = match.groups.id;
    }

    // Removes trailing index added by https://github.com/microsoft/vscode-internalbacklog/issues/2188
    if (/-[0-9]$/.test(workspaceId)) {
        return workspaceId.slice(0, -2);
    }
    return workspaceId;
}



export function indexOfDifference(a: string, b: string): number {
    if (a === b) {return -1;}

    let i = 0;
    while (a[i] === b[i]) {
        i++;
    }
    return i;
}
