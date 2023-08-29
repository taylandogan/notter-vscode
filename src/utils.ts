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
	if (vscode.workspace.workspaceFolders) {
		return vscode.workspace.workspaceFolders[0].uri.fsPath;
	} else {
		// Handle the case when there is no open workspace
		return null;
	}
}

export const getNotterConfiguration = () => {
	return vscode.workspace.getConfiguration('notter');
}

export const setNotterConfiguration = async (label: string, value: any) => {
	const config = getNotterConfiguration();
	await config.update(label, value, vscode.ConfigurationTarget.Workspace);
}

export const isConfigured = (label: string) => {
	let config = getNotterConfiguration();
	let configValue = config.get(label);
	if (!configValue) {
		return false;
	}
	return true;
}

export const setWorkingDirectory = async () => {
	if (!isConfigured(SRC_PATH_CONFIG_LABEL)) {
		const currentWorkingDirectory = getCurrentWorkingDirectory();

		if (currentWorkingDirectory) {
			await setNotterConfiguration(SRC_PATH_CONFIG_LABEL, currentWorkingDirectory)
		}
	}
}
