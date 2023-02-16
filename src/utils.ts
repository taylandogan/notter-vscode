import * as child_process from 'child_process';

export const execShell = (cmd: string, use_venv: boolean = false) =>
new Promise<string>((resolve, reject) => {
	if (use_venv) {
		cmd = "source ./venv/bin/activate; " + cmd
	}
	child_process.exec(cmd, {cwd: "/Users/taylan/personal/notter", env: {"SRC_PATH": "/Users/taylan/personal/notter/src"}}, (err, out) => {
		if (err) {
			return reject(err);
		}
		return resolve(out);
	});
});
