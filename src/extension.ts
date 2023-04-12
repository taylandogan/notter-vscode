import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { configCheck } from './utils';
import { checkNotterVersion, fetchTodos, initNotter } from './interface';
import { SRC_PATH_CONFIG_LABEL, USERNAME_CONFIG_LABEL, EMAIL_CONFIG_LABEL } from './constants';
import { Comment } from './model';


export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "notter-vscode" is now active!');
	let comments: {[key: string]: Comment[]} = {};
	const noteProvider = new NoteProvider(comments);
	vscode.window.registerTreeDataProvider('notterTreeView', noteProvider);

	const notterTreeView = vscode.window.createTreeView('notterTreeView', {
		treeDataProvider: noteProvider
	});

	// Register the onDidChangeSelection event handler
	notterTreeView.onDidChangeSelection(async (note) => {
		if (!note.selection || note.selection.length === 0) {
		  return;
		}

		const selectedNote = note.selection[0];
		// Do not do anything if the selected item has a child
		if (selectedNote.children !== undefined || selectedNote.filepath === undefined || selectedNote.line === undefined) {
			return;
		}

		console.log(selectedNote);
		// Open the file and reveal the line containing the selected todo
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(selectedNote.filepath));
		const textEditor = await vscode.window.showTextDocument(document);

		// vscode.Position is zero-indexed, so (selectedNote.line - 1)
		const position = new vscode.Position(selectedNote.line - 1, 0);
		textEditor.selection = new vscode.Selection(position, position);
		textEditor.revealRange(new vscode.Range(position, position));
	  });

	let version_check = vscode.commands.registerCommand('notter.version', async () => {
		try {
			let version = await checkNotterVersion();
			vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
		} catch(err) {
			vscode.window.showErrorMessage("Please make sure that notter is installed and available in your PATH: " + err);
		}
	});

	let init_notter = vscode.commands.registerCommand('notter.init', async () => {
		try {
			if ( !configCheck(USERNAME_CONFIG_LABEL) || !configCheck(EMAIL_CONFIG_LABEL) || !configCheck(SRC_PATH_CONFIG_LABEL) ) {
				return;
			}

			// TODO: Add a check for the username and email format they should not include a space
			const username: string = vscode.workspace.getConfiguration('notter').get<string>(USERNAME_CONFIG_LABEL);
			const email: string = vscode.workspace.getConfiguration('notter').get<string>(EMAIL_CONFIG_LABEL);
			const [initialized, message]: [boolean, string] = await initNotter(username, email);

			if (initialized) {
				vscode.window.showInformationMessage(`${message}`, { modal: false });
			} else {
				vscode.window.showErrorMessage(`Notter could not be initialized: ${message}`);
			}
		} catch(err) {
			vscode.window.showErrorMessage("Error while initializing notter: " + err);
		}
	});

	let discover_notes = vscode.commands.registerCommand('notter.discover', async () => {
		try {
			if (!configCheck(SRC_PATH_CONFIG_LABEL)) { return; }

			comments = await fetchTodos();
			noteProvider.refresh(comments);
			vscode.window.showInformationMessage(`Notes updated`, { modal: false });
		} catch(err) {
			vscode.window.showErrorMessage("Error while discovering notes: " + err);
		}
	});

	context.subscriptions.push(version_check);
	context.subscriptions.push(discover_notes);
	context.subscriptions.push(init_notter);
	context.subscriptions.push(notterTreeView);
}

export function deactivate() {}
