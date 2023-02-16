"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const child_process = require("child_process");
function activate(context) {
    console.log('Congratulations, your extension "notter-vscode" is now active!');
    const execShell = (cmd) => new Promise((resolve, reject) => {
        child_process.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });
    const git_user_check = vscode.commands.registerCommand('extension.gituser', async () => {
        try {
            const username = await execShell("git config --get user.name");
            const email = await execShell("git config --get user.email");
            vscode.window.showInformationMessage(`Using Git user: ${username} / ${email}`, { modal: false });
        }
        catch (err) {
            vscode.window.showErrorMessage("Please make sure that Git user.name and user.email configs are defined");
        }
    });
    let version_check = vscode.commands.registerCommand('notter.version', async () => {
        try {
            let version = await execShell('notter --version');
            vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
        }
        catch (err) {
            vscode.window.showErrorMessage("Could not find a Notter instance");
        }
    });
    context.subscriptions.push(git_user_check);
    context.subscriptions.push(version_check);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map