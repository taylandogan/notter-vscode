import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { NoteProvider } from './sidebar';
import { getCurrentWorkingDirectory, isConfigured, setWorkingDirectory } from './utils';
import { checkNotterVersion, exportTodos, fetchTodos, fetchTodosInFile, initNotter } from './interface';
import { SRC_PATH_CONFIG, USERNAME_CONFIG, EMAIL_CONFIG } from './constants';
import { Comment } from './model';
import { NoteWebViewProvider } from './webview';

async function findAlreadyExistingNotterInstance () : Promise<string|null> {
	let workspaceFolder = getCurrentWorkingDirectory();
	if (workspaceFolder !== null) {
		const notterFolderPath = path.join(workspaceFolder, '.notter');
		const notterConfigPath = path.join(notterFolderPath, 'config.json');
		if (fs.existsSync(notterFolderPath) && fs.existsSync(notterConfigPath)) {
			const notterConfigContent = fs.readFileSync(notterConfigPath, {encoding: "utf-8"});
			const notterConfig = JSON.parse(notterConfigContent);
			return notterConfig.src_path
		}
	}
	return null;
}

async function initNotterInWorkspace () {
	try {
		const result = vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Notter',
			cancellable: true
			}, async (progress, token) => {
				token.onCancellationRequested(() => {
					vscode.window.showInformationMessage(`Notter: User canceled the initialization`);
					return false;
				});

				// Set working directory
				try{
					progress.report({ message: 'Setting working directory...', increment: 20 });
					let sourceDirectory = await findAlreadyExistingNotterInstance();

					if (sourceDirectory == null) {
						sourceDirectory = await vscode.window.showInputBox({
							placeHolder: 'Full path to src directory',
							ignoreFocusOut: true,
							prompt: 'Please set your source directory',
							title: 'Notter > Set source directory'
						});
					}

					if (sourceDirectory !== undefined) {
						await setWorkingDirectory(sourceDirectory);
						vscode.window.showInformationMessage(`Notter: Set working directory to: ${sourceDirectory}`);
					} else {
						throw new Error('Please set the source directory in VSCode Workspace Settings for Notter (not via User Settings).')
					}

					// Initialize Notter instance
					progress.report({ message: 'Initializing Notter...' , increment: 30});
					let initialized = await vscode.commands.executeCommand('notter.init');
					if (!initialized) {
						throw new Error(`Could not initialize Notter: init command failed`);
					}

					// Trigger comment discovery
					progress.report({ message: 'Discovering comments/notes...' , increment: 40});
					await vscode.commands.executeCommand('notter.discover');
					progress.report({ message: "Done!" , increment: 10})
					return true;
				} catch (error) {
					vscode.window.showErrorMessage(error);
					return false;
				}
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
		if (!isConfigured(SRC_PATH_CONFIG) ) {
			vscode.window.showErrorMessage(`Please set Notter configurations for Notter to work properly`);
			return;
		}

		try {
			const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG);
			let version = await checkNotterVersion(srcFolder);
			vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
		} catch(err) {
			vscode.window.showErrorMessage("Please make sure that notter is installed and available in your PATH: " + err);
		}
	});

	let initNotterCommand = vscode.commands.registerCommand('notter.init', async () => {
		try {
			if ( !isConfigured(USERNAME_CONFIG) || !isConfigured(EMAIL_CONFIG) || !isConfigured(SRC_PATH_CONFIG) ) {
				vscode.window.showErrorMessage(`Please set Notter configurations for Notter to work properly`);
				return;
			}

			// TODO: Add a check for the username and email format they should not include a space
			const username: string = vscode.workspace.getConfiguration('notter').get<string>(USERNAME_CONFIG);
			const email: string = vscode.workspace.getConfiguration('notter').get<string>(EMAIL_CONFIG);
			const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG);

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
			if (!isConfigured(SRC_PATH_CONFIG)) {
				vscode.window.showErrorMessage(`Please set ' Project Source Folder' configuration in Workspace Settings for Notter to work properly`);
				return;
			}

			comments = await fetchTodos();
			noteProvider.refresh(comments, false);
		} catch(err) {
			vscode.window.showErrorMessage("Error while discovering notes: " + err);
		}
	});

	let discoverNotesFileCommand = vscode.commands.registerCommand('notter.discoverFile', async (filepath: string) => {
		try {
			if (!isConfigured(SRC_PATH_CONFIG)) {
				vscode.window.showErrorMessage(`Please set ' Project Source Folder' configuration in Workspace Settings for Notter to work properly`);
				return;
			}

			let updatedComments = await fetchTodosInFile(filepath);
			if (updatedComments.length == 0) {
				delete comments[filepath];
			} else {
				comments[filepath] = updatedComments;
			}
			noteProvider.refresh(comments, false);
		} catch(err) {
			vscode.window.showErrorMessage("Error while discovering notes: " + err);
		}
	});

	let clearSearchInputCommand = vscode.commands.registerCommand('notter.clearSearchInput', async () => {
		noteProvider.clearSearchInputField();
	});

	let expandTodoTreeCommand = vscode.commands.registerCommand('notter.expand', async () => {
		noteProvider.expand();
	});

	let collapseTodoTreeCommand = vscode.commands.registerCommand('notter.collapse', async () => {
		noteProvider.collapse();
	});

	let exportCommand = vscode.commands.registerCommand('notter.export', async () => {
		const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG);
		await exportTodos(srcFolder);
	});

	context.subscriptions.push(versionCheckCommand);
	context.subscriptions.push(discoverNotesCommand);
	context.subscriptions.push(discoverNotesFileCommand);
	context.subscriptions.push(initNotterCommand);
	context.subscriptions.push(clearSearchInputCommand);
	context.subscriptions.push(expandTodoTreeCommand);
	context.subscriptions.push(collapseTodoTreeCommand);
	context.subscriptions.push(exportCommand);

	// Create the tree view
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('notterTreeView', noteWebViewProvider)
	);

	// Add trigger for discover command whenever a file saved to keep Notter up to date
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		let sourceDirectory = await findAlreadyExistingNotterInstance();
		if (sourceDirectory !== null){
			await vscode.commands.executeCommand('notter.discoverFile', document.fileName);
		}
	}));

	// --- INIT PLUGIN ---
		let result = await initNotterInWorkspace();	// Initialize and discover notes
		if (result == true) {
			noteProvider.triggerTreeUpdate();
		} else {
			noteProvider.refresh({}, false);
	}
}

export function deactivate() {}
