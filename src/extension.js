"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const sidebar_1 = require("./sidebar");
const interface_1 = require("./interface");
async function activate(context) {
    console.log('Congratulations, your extension "notter-vscode" is now active!');
    let comments = {};
    const noteProvider = new sidebar_1.NoteProvider(comments);
    vscode.window.registerTreeDataProvider('notter', noteProvider);
    const git_user_check = vscode.commands.registerCommand('notter.gituser', async () => {
        try {
            const username = await (0, interface_1.getGitUsername)();
            const email = await (0, interface_1.getGitEmail)();
            if (username === null) {
                vscode.window.showErrorMessage("Please make sure that Git user.name config is defined");
            }
            if (email === null) {
                vscode.window.showErrorMessage("Please make sure that Git user.email config is defined");
            }
            vscode.window.showInformationMessage(`Using Git user: ${username} / ${email}`, { modal: false });
        }
        catch (err) {
            vscode.window.showErrorMessage("Please make sure that Git user.name and user.email configs are defined");
        }
    });
    let version_check = vscode.commands.registerCommand('notter.version', async () => {
        try {
            let version = await (0, interface_1.checkNotterVersion)();
            vscode.window.showInformationMessage(`You are using Notter ${version}`, { modal: false });
        }
        catch (err) {
            vscode.window.showErrorMessage("Please make sure that notter is installed and available in your PATH: " + err);
        }
    });
    let init_notter = vscode.commands.registerCommand('notter.init', async () => {
        try {
            // await execShell('notter --init');
            await (0, interface_1.initNotter)();
            // if (initialized) {
            // 	vscode.window.showInformationMessage(`${message}`, { modal: false });
            // 	this.comments = await fetchNotes();
            // 	noteProvider.refresh();
            // } else {
            // 	vscode.window.showErrorMessage(`Notter could not be initialized: ${message}`);
            // }
        }
        catch (err) {
            vscode.window.showErrorMessage("Error while initializing notter: " + err);
        }
    });
    let discover_notes = vscode.commands.registerCommand('notter.discover', async () => {
        try {
            this.comments = await (0, interface_1.fetchNotes)();
            noteProvider.refresh();
            vscode.window.showInformationMessage("Notes refreshed", { modal: false });
        }
        catch (err) {
            vscode.window.showErrorMessage("Error while discovering notes: " + err);
        }
    });
    context.subscriptions.push(git_user_check);
    context.subscriptions.push(version_check);
    context.subscriptions.push(discover_notes);
    context.subscriptions.push(init_notter);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map