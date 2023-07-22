//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();
    const searchInput = document.getElementById("search-input");
    const treeView = document.getElementById("tree-view");

    // --- MAPPINGS ---
    // TODO: Fix the file-icons
    const fileIconMappings = {
        ".py": "codicon-python",
        ".js": "codicon-javascript",
        ".ts": "codicon-typescript",
        '.hs': "codicon-haskell",
        ".java": "codicon-java",
        ".c": "codicon-c",
        ".cpp": "codicon-cpp",
        ".cs": "codicon-csharp",
        ".go": "codicon-go",
        ".php": "codicon-php",
        ".rb": "codicon-ruby",
        ".rs": "codicon-rust",
        ".swift": "codicon-swift",
        ".vb": "codicon-visual-studio",
        ".xml": "codicon-xml",
        ".html": "codicon-html",
        ".css": "codicon-css",
        ".json": "codicon-json",
        ".md": "codicon-markdown",
        ".txt": "codicon-file",
        ".gitignore": "codicon-git",
    };

    const oldState = vscode.getState() || { notes: [] };
    let notes = oldState.notes;
    updateTreeView(notes);

    // --- FUNCTIONS ---
    function updateTreeView(notes) {
        console.log("UPDATE TREE VIEW CALLED: ", notes)
        notes.forEach(fileNoteRoot => treeView.appendChild(buildFileNoteTree(fileNoteRoot)));
        vscode.setState({ notes: notes });
    }

    function buildFileNoteTree(fileNoteRoot) {
        const li = document.createElement("li");
        li.textContent = getTextContent(fileNoteRoot);

        const iconSpan = document.createElement("span");
        li.prepend(iconSpan); // prepend to put it before the label

        const chevronIconSpan = document.createElement("span");
        li.prepend(chevronIconSpan); // prepend to put it before the label

        if (fileNoteRoot.hasOwnProperty("children") && fileNoteRoot.children.length > 0) {
            li.classList.add("parent-node")
            const ul = document.createElement("ul");
            ul.style.display = 'none'; // Initially hide the children

            // TODO: Integrate a source for file icons and fetch it here
            // const fileIcon = getFileIcon(fileNoteRoot);
            iconSpan.classList.add("node-icon", "codicon", "codicon-file");
            chevronIconSpan.classList.add("node-icon", "codicon", "codicon-chevron-right");

            fileNoteRoot.children.forEach(childNode => ul.appendChild(buildFileNoteTree(childNode)));
            li.appendChild(ul);

            li.addEventListener('click', function(e) {
                e.stopPropagation();
                if (ul.style.display === 'none') {
                    ul.style.display = '';
                    chevronIconSpan.classList.remove("codicon-chevron-right");
                    chevronIconSpan.classList.add("codicon-chevron-down");
                } else {
                    ul.style.display = 'none';
                    chevronIconSpan.classList.remove("codicon-chevron-down");
                    chevronIconSpan.classList.add("codicon-chevron-right");
                }
            });
        } else {
            li.classList.add("child-node");
            // TODO: Add an icon for how critical the note is, use iconSpan
            chevronIconSpan.classList.add("node-icon", "codicon");
            chevronIconSpan.style.visibility = 'hidden'; // Hide the placeholder span

            li.onclick = function(event) {
                event.stopPropagation(); // Stop the click event from bubbling up to the parent
                vscode.postMessage({
                    type: "goToLocation",
                    filepath: fileNoteRoot.filepath,
                    line: fileNoteRoot.line
                });
            };
        }

        return li;
    }

    function getTextContent(noteTreeNode) {
        let textContent = "";
        if (noteTreeNode.hasOwnProperty("children") && noteTreeNode.hasOwnProperty("filepath")) {
            const parts = noteTreeNode.filepath.split(/[/\\]/); // Split on both / and \
            const fileName = parts.pop();
            const pathStr = parts.pop();

            textContent = `<strong>${fileName}</strong> - ${pathStr}`;
        } else {
            textContent = noteTreeNode.label;
        }
        return textContent;
    }

    function getExtension(filepath) {
        // Get the last segment from the file path
        const base = filepath.split(/[/\\]/).pop();

        // If the base starts with ".", it's a hidden file with no extension
        if (base.startsWith(".")) {
            return "";
        }

        // Find the last index of "."
        const index = base.lastIndexOf(".");

        // If there's no dot, or it's at the beginning or end, then there's no extension
        if (index === -1 || index === 0 || index === base.length - 1) {
            return "";
        }

        // Otherwise, get the substring from the last index of "."
        return base.substring(index);
    }

    function getFileExtension(noteTreeNode) {
        let extension = "";
        if (noteTreeNode.hasOwnProperty("filepath") && noteTreeNode.filepath) {
            extension = getExtension(noteTreeNode.filepath);
        }
        return extension;
    }

    function getFileIcon(noteTreeNode) {
        let fileType = getFileExtension(noteTreeNode);
        return fileIconMappings[fileType] || "codicon-file";
    }

    // --- EVENTS ---
    // Handle click event for parent collapse/expand
    document.querySelectorAll(".parent-node").forEach(parentNode => {
        parentNode.addEventListener("click", (event) => {
            event.stopPropagation(); // prevent event from bubbling up to parent nodes
            if (event.target !== parentNode) {
                return;
            }

            console.log("COLLAPSE: ", parentNode)
            const icon = parentNode.querySelector(".node-icon");
            const children = parentNode.querySelector(".child-node");
            if (parentNode.classList.contains("collapsed")) {
                parentNode.classList.remove("collapsed");
                icon.classList.replace("codicon-chevron-right", "codicon-chevron-down");
                children.style.display = ""; // show children
            } else {
                parentNode.classList.add("collapsed");
                icon.classList.replace("codicon-chevron-down", "codicon-chevron-right");
                children.style.display = "none"; // hide children
            }
        });
    });

    // Handle search input
    searchInput.addEventListener("input", function() {
        let searchValue = searchInput.value.toLowerCase();

        // select all child-node li elements
        let childNodes = document.querySelectorAll('.child-node');

        childNodes.forEach(function(node) {
            // convert to lower case for case insensitive search
            let nodeText = node.textContent.toLowerCase();

            // hide the element if it doesn't include the search value
            if (nodeText.includes(searchValue)) {
                node.style.display = '';

                // also make sure to display its parent and siblings if found
                let parent = node.closest('.parent-node');
                if (parent) parent.style.display = '';
            } else {
                node.style.display = 'none';
            }
        });

        // for parent nodes that don't have any visible child nodes
        let parentNodes = document.querySelectorAll('.parent-node');
        parentNodes.forEach(function(node) {
            let childNodes = node.querySelectorAll('.child-node');
            let allChildrenHidden = Array.from(childNodes).every(childNode => childNode.style.display === 'none');
            if (allChildrenHidden) {
                node.style.display = 'none';
            } else {
                node.style.display = '';
            }
        });
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "updateNotes":
                {
                    updateTreeView(message.notes);
                    break;
                }
        }
    });
}());
