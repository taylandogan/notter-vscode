import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';

export class NoteWebViewProvider implements vscode.WebviewViewProvider {

    private _view?: vscode.WebviewView;
	private _disposables: vscode.Disposable[] = [];

    constructor(
		private readonly _extensionUri: vscode.Uri,
        private _noteProvider: NoteProvider
	) {}

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Post message to WebView content to keep it up to date
        this._noteProvider.onDidChangeTreeData(() => {
            let data = this._noteProvider.data;
            webviewView.webview.postMessage({
                type: "updateNotes",
                notes: data
            });
        });

		// Listen for go to location events
		webviewView.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case "goToLocation":
						{
							// Open the file and reveal the line containing the selected todo
							const document = await vscode.workspace.openTextDocument(vscode.Uri.file(message.filepath));
							const textEditor = await vscode.window.showTextDocument(document);

							// vscode.Position is zero-indexed, so (selectedNote.line - 1)
							const position = new vscode.Position(message.line - 1, 0);
							textEditor.selection = new vscode.Selection(position, position);
							textEditor.revealRange(new vscode.Range(position, position));
							return;
						}
				}
			},
			null,
			this._disposables
		);
	}

    private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));
        const codiconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'codicons', 'codicon.css'));

        // Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-webview-resource: https:; script-src 'nonce-${nonce}'; style-src vscode-webview-resource: 'unsafe-inline'; font-src vscode-webview-resource:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">
                <link href="${codiconUri}" rel="stylesheet">
			</head>
			<body>
                <div id="search-bar">
                    <input type="text" id="search-input" class="search-box" placeholder="Search" />
                </div>


                <ul id="tree-view" class="tree-view"></ul>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

