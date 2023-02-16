import * as vscode from 'vscode';


class FileTreeItem extends vscode.TreeItem {
	children: FileTreeItem[]|undefined;

	constructor(label: string, children?: FileTreeItem[]) {
	  super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
	  this.children = children;
	}
  }


export class NoteProvider implements vscode.TreeDataProvider<FileTreeItem> {
	onDidChangeTreeData?: vscode.Event<FileTreeItem|null|undefined>|undefined;

	data: FileTreeItem[];

	constructor(comments: {[key: string]: [number, string]}) {
		this.data = [];

		vscode.window.showInformationMessage(JSON.stringify(comments));
		for (const [filepath, notes] of Object.entries(comments)) {
			let noteItems = notes.map((note) => {
				return new FileTreeItem(`${note[0]}: ${note[1]}`);
			});

			this.data.push(new FileTreeItem(filepath, noteItems));
		}
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
