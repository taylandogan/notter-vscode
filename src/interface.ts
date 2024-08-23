import * as vscode from 'vscode';
import { Comment } from './model';
import { execShell } from "./utils";
import { SRC_PATH_CONFIG } from './constants';

export const initNotter = async (srcFolder: string, username: string, email: string): Promise<[boolean, string]> => {
	try {
		let output = await execShell(`notter --init ${username} ${email} ${srcFolder}` );
		return [true, "Notter instance initialized properly"];
	} catch (err) {
		console.debug(err);
		return [false, err];
	}
}

export const checkNotterVersion = async (srcFolder: string): Promise<string|null> => {
	try {
		return await execShell(`notter ${srcFolder} --version`);
	} catch (err) {
		console.debug(err);
		return null;
	}
}

export const discoverNotes = async (srcFolder: string): Promise<string> => {
    try {
        return await execShell(`notter ${srcFolder} discover`);
    } catch (err) {
		console.debug(err);
        return "[]";
    }
}


export const fetchTodos = async (): Promise<{[key: string]: Comment[]}> => {
	let noteDict = {};
	const srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG);

	try {
		const discoveredComments: string = await discoverNotes(srcFolder);
		const foundComments = JSON.parse(discoveredComments).map((comment: any) => {
			return new Comment(comment.filepath, comment.text, comment.line, comment.type, comment.multiline);
		});

		for (const comment of foundComments) {
			// Skip non-TODO notes
			if (comment.type !== "TODO") {
				continue;
			}

			// This should never happen but skip todo if it does not include src path in filepath
			if (!comment.filepath.includes(srcFolder)) {
				continue;
			}

			if (comment.filepath in noteDict) {
				noteDict[comment.filepath].push(comment);
			} else {
				noteDict[comment.filepath] = [comment];
			}
		}
	} catch (err) {
		vscode.window.showErrorMessage("Error while fetching notes: " + err);
	}

	return noteDict;
}
