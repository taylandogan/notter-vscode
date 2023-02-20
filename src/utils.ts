import * as child_process from 'child_process';

const path = require('path');
const projectDirectory = path.dirname(path.resolve(__dirname));
const binDirectory = path.join(projectDirectory, 'bin');

export const execShell = (cmd: string, use_venv: boolean = false) =>
new Promise<string>((resolve, reject) => {
	child_process.exec(cmd, {cwd: `${binDirectory}`, env: {"SRC_PATH": "/Users/taylan/personal/notter/src"}}, (err, out) => {
		if (err) {
			return reject(err);
		}
		return resolve(out);
	});
});
