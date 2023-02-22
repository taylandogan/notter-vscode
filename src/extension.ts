import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { execShell } from './utils';
import { checkNotterVersion, fetchNotes, getGitEmail, getGitUsername, initNotter } from './interface';


export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "notter-vscode" is now active!');
	let comments: {[key: string]: [number, string]} = {};
	const noteProvider = new NoteProvider(comments);
	vscode.window.registerTreeDataProvider('notter', noteProvider);

	const git_user_check = vscode.commands.registerCommand('notter.gituser', async () => {
		try {
			const username = await getGitUsername();
			const email = await getGitEmail();

			if (username === null) {
				vscode.window.showErrorMessage("Please make sure that Git user.name config is defined");
			}

			if (email === null) {
				vscode.window.showErrorMessage("Please make sure that Git user.email config is defined");
			}

			vscode.window.showInformationMessage(`Using Git user: ${username} / ${email}`, { modal: false });
		} catch (err) {
			vscode.window.showErrorMessage("Please make sure that Git user.name and user.email configs are defined");
		}
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
			const [initialized, message]: [boolean, string] = await initNotter();

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
			comments = await fetchNotes();
			noteProvider.refresh(comments);
			vscode.window.showInformationMessage(`Notes updated`, { modal: false });
		} catch(err) {
			vscode.window.showErrorMessage("Error while discovering notes: " + err);
		}
	});

	context.subscriptions.push(git_user_check);
	context.subscriptions.push(version_check);
	context.subscriptions.push(discover_notes);
	context.subscriptions.push(init_notter);
}

export function deactivate() {}
