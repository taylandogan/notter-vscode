import * as vscode from 'vscode';
import { Comment } from './model';
import { SRC_PATH_CONFIG_LABEL } from './constants';


class FileTreeItem extends vscode.TreeItem {
	children: FileTreeItem[]|undefined;
	filepath: string;
	line: number;
	type: string;

	constructor(label: string, children?: FileTreeItem[], filepath?: string, line?: number, type?: string) {
	  super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
	  this.children = children;
	  this.filepath = filepath;
	  this.line = line;
	  this.type = type;
	}
  }


export class NoteProvider implements vscode.TreeDataProvider<FileTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG_LABEL);
	data: FileTreeItem[];

	constructor(comments: {[key: string]: Comment[]}) {
		this.data = this.buildTree(comments);
	}

	buildTree(comments: {[key: string]: Comment[]}): FileTreeItem[] {
		let data: FileTreeItem[] = [];

		for (const [filepath, notes] of Object.entries(comments)) {
			let noteItems: FileTreeItem[] = notes.map((note) => {

				return new FileTreeItem(`${note.line}: ${note.text}`, undefined, note.filepath, note.line, note.type);
			});

			data.push(new FileTreeItem(filepath.replace(this.srcFolder, ""), noteItems));
		}

		return data;
	}

	refresh(comments: {[key: string]: Comment[]}): void {
		this.data = this.buildTree(comments);
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FileTreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
	  return element;
	}

	getChildren(element?: FileTreeItem|undefined): FileTreeItem[] {
	  if (element === undefined) {
		return this.data;
	  }

	  return element.children;
	}
  }
