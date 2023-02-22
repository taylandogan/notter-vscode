import * as vscode from 'vscode';
import { Comment } from './model';
import { execShell } from "./utils";

export const getGitUsername = async (): Promise<string|null> => {
	try {
		return await execShell("git config user.name");
	} catch (err) {
		return null;
	}
}

export const getGitEmail = async (): Promise<string|null> => {
	try {
		return await execShell("git config user.email");
	} catch (err) {
		return null;
	}
}

export const checkNotterVersion = async (): Promise<string|null> => {
	try {
		return await execShell('notter --version');
	} catch (err) {
		return null;
	}
}

export const discoverNotes = async (): Promise<string> => {
    try {
        return await execShell('notter discover');
    } catch (err) {
        return "[]";
    }
}

export const initNotter = async (): Promise<[boolean, string]> => {
    try {
        let output = await execShell('notter --init');
        return [true, "Notter instance initialized properly"];
    } catch (err) {
        return [false, err];
    }
}

export const fetchNotes = async (): Promise<{[key: string]: [number, string]}> => {
	let noteDict = {};

	try {
		const discoveredComments: string = await discoverNotes();
		const foundComments = JSON.parse(discoveredComments).map((comment: any) => {
			return new Comment(comment.filepath, comment.text, comment.line, comment.type, comment.multiline);
		});

		for (const comment of foundComments) {
			if (comment.filepath in noteDict) {
				noteDict[comment.filepath].push([comment.line, comment.text]);
			} else {
				noteDict[comment.filepath] = [[comment.line, comment.text]];
			}
		}
	} catch (err) {
		vscode.window.showErrorMessage("Error while fetching notes: " + err);
	}

	return noteDict;
}
