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

export const configCheck = (label: string) => {
	let configValue = vscode.workspace.getConfiguration('notter').get(label);
	if (!configValue) {
		vscode.window.showErrorMessage(`Please set ${label} configuration for Notter to work properly`);
		return false;
	}
	return true;
}
