import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { isConfigured, setWorkingDirectory } from './utils';
import { checkNotterVersion, fetchTodos, initNotter } from './interface';
import { SRC_PATH_CONFIG_LABEL, USERNAME_CONFIG_LABEL, EMAIL_CONFIG_LABEL } from './constants';
import { Comment } from './model';
import { NoteWebViewProvider } from './webview';


export async function activate(context: vscode.ExtensionContext) {
	console.log('"notter-vscode" is now active!');
	let comments: {[key: string]: Comment[]} = {};
	const noteProvider = new NoteProvider(comments);
	const noteWebViewProvider = new NoteWebViewProvider(context.extensionUri,  noteProvider);

	// --- COMMANDS ---
	let versionCheckCommand = vscode.commands.registerCommand('notter.version', async () => {
		try {
			let version = await checkNotterVersion();
			vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
		} catch(err) {
			vscode.window.showErrorMessage("Please make sure that notter is installed and available in your PATH: " + err);
		}
	});

	let initNotterCommand = vscode.commands.registerCommand('notter.init', async () => {
		try {
			if ( !isConfigured(USERNAME_CONFIG_LABEL) || !isConfigured(EMAIL_CONFIG_LABEL) || !isConfigured(SRC_PATH_CONFIG_LABEL) ) {
				vscode.window.showErrorMessage(`Please set Notter configurations for Notter to work properly`);
				return;
			}

			// TODO: Add a check for the username and email format they should not include a space
			const username: string = vscode.workspace.getConfiguration('notter').get<string>(USERNAME_CONFIG_LABEL);
			const email: string = vscode.workspace.getConfiguration('notter').get<string>(EMAIL_CONFIG_LABEL);
			const [initialized, message]: [boolean, string] = await initNotter(username, email);

			if (!initialized) {
				vscode.window.showErrorMessage(`Notter could not be initialized: ${message}`);
			}

			return initialized;
		} catch(err) {
			vscode.window.showErrorMessage("Error while initializing notter: " + err);
		}
	});

	let discoverNotesCommand = vscode.commands.registerCommand('notter.discover', async () => {
		try {
			if (!isConfigured(SRC_PATH_CONFIG_LABEL)) {
				console.log(`Please set '${SRC_PATH_CONFIG_LABEL}' configuration for Notter to work properly`);
				return;
			}

			comments = await fetchTodos();
			noteProvider.refresh(comments);
		} catch(err) {
			vscode.window.showErrorMessage("Error while discovering notes: " + err);
		}
	});

	context.subscriptions.push(versionCheckCommand);
	context.subscriptions.push(discoverNotesCommand);
	context.subscriptions.push(initNotterCommand);

	// --- FUNCTIONS ---
	let initNotterInWorkspace = async () => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Notter',
			cancellable: false
			}, async (progress) => {
				progress.report({ message: 'Setting working directory...' });
				await setWorkingDirectory();
				progress.report({ message: 'Initializing Notter...' });
				let initialized = await vscode.commands.executeCommand('notter.init');
				if (initialized) {
					progress.report({ message: 'Discovering comments/notes...' });
					await vscode.commands.executeCommand('notter.discover');
				}
		});
	}

	// --- INIT PLUGIN ---

	// Create the tree view
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('notterTreeView', noteWebViewProvider)
	);

	await initNotterInWorkspace();	// Initialize and discover notes

	// Add trigger for discover command whenever a file saved to keep Notter up to date
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		await vscode.commands.executeCommand('notter.discover');
	}));

}

export function deactivate() {}
