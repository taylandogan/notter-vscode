import * as vscode from 'vscode';


class FileTreeItem extends vscode.TreeItem {
	children: FileTreeItem[]|undefined;

	constructor(label: string, children?: FileTreeItem[]) {
	  super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
	  this.children = children;
	}
  }


export class NoteProvider implements vscode.TreeDataProvider<FileTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	data: FileTreeItem[];

	constructor(comments: {[key: string]: [number, string]}) {
		this.data = this.buildTree(comments);
	}

	buildTree(comments: {[key: string]: [number, string]}): FileTreeItem[] {
		let data: FileTreeItem[] = [];

		for (const [filepath, notes] of Object.entries(comments)) {
			let noteItems = notes.map((note) => {
				return new FileTreeItem(`${note[0]}: ${note[1]}`);
			});

			data.push(new FileTreeItem(filepath, noteItems));
		}

		return data;
	}

	refresh(comments: {[key: string]: [number, string]}): void {
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
