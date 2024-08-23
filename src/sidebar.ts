import * as vscode from 'vscode';
import { Comment } from './model';
import { SRC_PATH_CONFIG } from './constants';


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

	private _onDidClearSearchInput: vscode.EventEmitter< undefined | null | void > = new vscode.EventEmitter<undefined | null | void>();
	readonly onDidClearSearchInput: vscode.Event< undefined | null | void> = this._onDidClearSearchInput.event;

	srcFolder: string = vscode.workspace.getConfiguration('notter').get<string>(SRC_PATH_CONFIG);
	data: FileTreeItem[];
	expandTree: boolean;

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

	refresh(comments: {[key: string]: Comment[]}, expandTree: boolean): void {
		this.data = this.buildTree(comments);
		this.expandTree = expandTree;
		this._onDidChangeTreeData.fire();
	}

	clearSearchInputField() : void {
		this._onDidClearSearchInput.fire()
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
