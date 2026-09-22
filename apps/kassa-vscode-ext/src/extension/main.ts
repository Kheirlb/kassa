import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as path from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { DslLibraryFileSystemProvider } from './fileSystemProvider.js';

let client: LanguageClient;

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log("[kassa-ext] activate(), registering file system provider...");
    DslLibraryFileSystemProvider.register(context);
    console.log("[kassa-ext] activate(), starting language client...");
    client = await startLanguageClient(context);
    context.subscriptions.push(
        vscode.commands.registerCommand('catCoding.start', () => {
            const panel = vscode.window.createWebviewPanel(
                'catCoding',
                'Cat Coding',
                vscode.ViewColumn.Two,
                {}
            );

            panel.webview.html = getWebviewContent();
        })
    )
}

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
</body>
</html>`;
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

async function startLanguageClient(context: vscode.ExtensionContext): Promise<LanguageClient> {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'kassa' },
            { scheme: 'builtin', language: 'kassa' }
        ]
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'kassa',
        'Kassa Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    console.log("[kassa-ext] starting LanguageClient...");
    await client.start();
    return client;
}
