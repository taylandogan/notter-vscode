import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { isConfigured, setWorkingDirectory } from './utils';
import { checkNotterVersion, fetchTodos, initNotter } from './interface';
import { SRC_PATH_CONFIG_LABEL, USERNAME_CONFIG_LABEL, EMAIL_CONFIG_LABEL } from './constants';
import { Comment } from './model';
import { NoteWebViewProvider } from './webview';

async function initNotterInWorkspace () {
	try {
		const result = vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Notter',
			cancellable: true
			}, async (progress, token) => {
				token.onCancellationRequested(() => {
					vscode.window.showInformationMessage(`Notter: User canceled the initialization`);
				});

				// Set working directory
				try{
					progress.report({ message: 'Setting working directory...' });
					const sourceDirectory = await vscode.window.showInputBox({
						placeHolder: 'Full path to src directory',
						ignoreFocusOut: true,
						prompt: 'Please set your source directory',
						title: 'Notter > Set source directory'
					});

					if (sourceDirectory !== undefined) {
						await setWorkingDirectory(sourceDirectory);
					} else {
						throw new Error('Please set the source directory in VSCode Workspace Settings for Notter (not via User Settings).')
					}
					vscode.window.showInformationMessage(`Notter: Set working directory to: ${sourceDirectory}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Could not initialize Notter: ${error}`);
					return false;
				}

				// Initialize Notter instance
				progress.report({ message: 'Initializing Notter...' });
				let initialized = await vscode.commands.executeCommand('notter.init');
				if (!initialized) {
					vscode.window.showErrorMessage(`Could not initialize Notter: init command failed`);
					return false;
				}

				// Trigger comment discovery
				progress.report({ message: 'Discovering comments/notes...' });
				await vscode.commands.executeCommand('notter.discover');
				return true;
			});

		return result;
	} catch (error) {
		vscode.window.showErrorMessage(`Error while initializing notter: ${error}`);
		return false;
	}
}

export async function activate(context: vscode.ExtensionContext) {
	let comments: {[key: string]: Comment[]} = {};
	const noteProvider = new NoteProvider(comments);
	const noteWebViewProvider = new NoteWebViewProvider(context.extensionUri,  noteProvider);

	// --- COMMANDS ---
	let versionCheckCommand = vscode.commands.registerCommand('notter.version', async () => {
		if (!isConfigured(SRC_PATH_CONFIG_LABEL) ) {
			vscode.window.showErrorMessage(`Please set Notter configurations for Notter to work properly`);
			return;
		}

		try {
			const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG_LABEL);
			let version = await checkNotterVersion(srcFolder);
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
			const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG_LABEL);
			console.debug(`Username set for Notter: ${username}`);
			console.debug(`Email set for Notter: ${email}`);
			console.debug(`Source path set for Notter: ${srcFolder}`);

			const [initialized, message]: [boolean, string] = await initNotter(srcFolder, username, email);
			console.debug(`Initialized: ${initialized}`);
			console.debug(`Message: ${message}`);

			if (!initialized) {
				vscode.window.showErrorMessage(`Notter could not be initialized: ${message}`);
			}

			vscode.window.showInformationMessage(`Notter instance initialized on folder: ${srcFolder}`);
			return initialized;
		} catch(err) {
			vscode.window.showErrorMessage("Error while initializing notter: " + err);
		}
	});

	let discoverNotesCommand = vscode.commands.registerCommand('notter.discover', async () => {
		try {
			if (!isConfigured(SRC_PATH_CONFIG_LABEL)) {
				vscode.window.showErrorMessage(`Please set ' Project Source Folder' configuration in Workspace Settings for Notter to work properly`);
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
	// Create the tree view
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('notterTreeView', noteWebViewProvider)
	);
	// Add trigger for discover command whenever a file saved to keep Notter up to date
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		await vscode.commands.executeCommand('notter.discover');
	}));

	// --- INIT PLUGIN ---
	try {
		await initNotterInWorkspace();	// Initialize and discover notes
	} catch (err) {
		noteProvider.refresh({});
	}
}

export function deactivate() {}
