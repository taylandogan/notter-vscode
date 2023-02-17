import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { Comment } from './model';
import { execShell } from './utils';


export const fetchNotes = async (): Promise<{[key: string]: [number, string]}> => {
	const discoveredComments = await execShell('notter discover', true);
	const foundComments = JSON.parse(discoveredComments).map((comment: any) => {
		return new Comment(comment.filepath, comment.text, comment.line, comment.type, comment.multiline);
	});

	let noteDict = {};
	for (const comment of foundComments) {
		if (comment.filepath in noteDict) {
			noteDict[comment.filepath].push([comment.line, comment.text]);
		} else {
			noteDict[comment.filepath] = [[comment.line, comment.text]];
		}
	}

	return noteDict;
}


export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "notter-vscode" is now active!');
	let comments: {[key: string]: [number, string]} = await fetchNotes();
	const noteProvider = new NoteProvider(comments);
	vscode.window.registerTreeDataProvider('notter', noteProvider);

	vscode.commands.registerCommand('notter.refresh', () => noteProvider.refresh());

	const git_user_check = vscode.commands.registerCommand('notter.gituser', async () => {
		try {
			const username = await execShell("git config --get user.name");
			const email = await execShell("git config --get user.email");
			vscode.window.showInformationMessage(`Using Git user: ${username} / ${email}`, { modal: false });
		} catch (err) {
			vscode.window.showErrorMessage("Please make sure that Git user.name and user.email configs are defined");
		}
	});

	let version_check = vscode.commands.registerCommand('notter.version', async () => {
		try {
			let version = await execShell('notter --version', true);
			vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
		} catch(err) {
		}
	});

	let discover_notes = vscode.commands.registerCommand('notter.discover', async () => {
		try {
			const notes = await fetchNotes();
			vscode.window.showInformationMessage(JSON.stringify(notes));
		} catch(err) {
		}
	});

	context.subscriptions.push(git_user_check);
	context.subscriptions.push(version_check);
	context.subscriptions.push(discover_notes)
}

export function deactivate() {}
