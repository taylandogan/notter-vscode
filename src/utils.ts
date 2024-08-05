import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { SRC_PATH_CONFIG_LABEL } from './constants';

const path = require('path');
const projectDirectory = path.dirname(path.resolve(__dirname));
const binDirectory = path.join(projectDirectory, 'bin');

export const execShell = (cmd: string, withEnv: boolean = true) =>
new Promise<string>((resolve, reject) => {
	let injectedEnv = withEnv ? {"SRC_PATH": vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG_LABEL)} : {};
	let childProcess = child_process.exec(cmd, {cwd: `${binDirectory}`, env: injectedEnv}, (err, stdout, stderr) => {
		if (err) {
			childProcess.stderr.on('data', (data) => {
				vscode.window.showErrorMessage(data);
			});
			return reject(stderr);
		}
		childProcess.stdout.on('data', (data) => {
			vscode.window.showInformationMessage(data);
		});
		return resolve(stdout);
	});
});

export const getCurrentWorkingDirectory = () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		throw new Error('No workspace folder is open');
	}

	const firstWorkspaceFolder = workspaceFolders[0];
	const fullPath = firstWorkspaceFolder.uri.fsPath;
	console.log(`Full path of the first workspace folder: ${fullPath}`);
	return fullPath;
}

export const getNotterConfiguration = (): vscode.WorkspaceConfiguration => {
    return vscode.workspace.getConfiguration('notter');
};

export const setNotterConfiguration = async (label: string, value: any) => {
	const config = getNotterConfiguration();
	await config.update(label, value, vscode.ConfigurationTarget.Workspace);
}

export const isConfigured = (label: string) => {
	let config = getNotterConfiguration();
	console.debug(`Notter config: ${JSON.stringify(config)}`);
	let configValue = config.get(label);
	if (!configValue) {
		return false;
	}
	return true;
}

export const setWorkingDirectory = async (): Promise<string> => {
	const currentWorkingDirectory = getCurrentWorkingDirectory();
	await setNotterConfiguration(SRC_PATH_CONFIG_LABEL, currentWorkingDirectory)
	return currentWorkingDirectory;
}
