import * as child_process from 'child_process';
import * as vscode from 'vscode';

const path = require('path');
const projectDirectory = path.dirname(path.resolve(__dirname));
const binDirectory = path.join(projectDirectory, 'bin');

export const execShell = (cmd: string) =>
new Promise<string>((resolve, reject) => {
	let childProcess = child_process.exec(cmd, {cwd: `${binDirectory}`, env: {"SRC_PATH": "/Users/taylan/personal/notter/src"}}, (err, stdout, stderr) => {
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
