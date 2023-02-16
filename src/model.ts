export class Comment {
	filepath: string;
	text: string;
	line: number;
	type: string;
	multiline: boolean;

	constructor(filepath: string, text: string, line: number, type: string, multiline: boolean) {
		this.filepath = filepath;
		this.text = text;
		this.line = line;
		this.type = type;
		this.multiline = multiline;
	}
}
