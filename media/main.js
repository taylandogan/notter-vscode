//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();
    const searchInput = document.getElementById("search-input");
    const treeView = document.getElementById("tree-view");
    const loadingSpinner = document.getElementById("loading-spinner");

    // --- MAPPINGS ---
    // TODO: Fix the file-icons
    const fileIconMappings = {
        ".py": "devicon-python-plain",
        ".js": "devicon-javascript-plain",
        ".ts": "devicon-typescript-plain",
        ".hs": "devicon-haskell-plain",
        ".java": "devicon-java-plain",
        ".c": "devicon-c-plain",
        ".cpp": "devicon-cplusplus-plain",
        ".cs": "devicon-csharp-plain",
        ".go": "devicon-go-plain",
        ".php": "devicon-php-plain",
        ".rb": "devicon-ruby-plain",
        ".rs": "devicon-rust-plain",
        ".swift": "devicon-swift-plain",
        ".sql": "devicon-azuresqldatabase-plain",
        ".xml": "devicon-xml-plain",
        ".html": "devicon-html5-plain",
        ".css": "devicon-css3-plain",
        ".json": "devicon-json-plain",
        ".md": "devicon-markdown-original",
        ".txt": "devicon-readthedocs-original",
        ".gitignore": "devicon-git-plain",
    };

    const oldState = vscode.getState() || { notes: [], expandedNodes: {} };
    let notes = oldState.notes;
    let expandedNodes = oldState.expandedNodes || {};
    updateTreeView(notes);

    // --- FUNCTIONS ---
    function collapseAllNodes() {
        treeView.querySelectorAll(".parent-node").forEach(parentNode => {
            const chevronIcon = parentNode.querySelector(".chevron-icon");
            const childrenContainer = parentNode.querySelector(".child-node")?.closest("ul");

            // Get the node ID from the text content
            const nodeText = parentNode.querySelector(".node-text").textContent;
            const nodeId = findNodeIdByText(nodeText);

            chevronIcon.classList.replace("codicon-chevron-down", "codicon-chevron-right");
            childrenContainer.style.display = "none"; // hide children

            // Update the expanded state
            if (nodeId) {
                expandedNodes[nodeId] = false;
            }
        });

        // Save the state
        vscode.setState({ notes: notes, expandedNodes: expandedNodes });
    }

    function expandAllNodes() {
        treeView.querySelectorAll(".parent-node").forEach(parentNode => {
            const chevronIcon = parentNode.querySelector(".chevron-icon");
            const childrenContainer = parentNode.querySelector(".child-node")?.closest("ul");

            // Get the node ID from the text content
            const nodeText = parentNode.querySelector(".node-text").textContent;
            const nodeId = findNodeIdByText(nodeText);

            chevronIcon.classList.replace("codicon-chevron-right", "codicon-chevron-down");
            childrenContainer.style.display = ""; // show children

            // Update the expanded state
            if (nodeId) {
                expandedNodes[nodeId] = true;
            }
        });

        // Save the state
        vscode.setState({ notes: notes, expandedNodes: expandedNodes });
    }

    function clearTreeView() {
        while (treeView.firstChild) {
            treeView.removeChild(treeView.firstChild);
        }
    }

    function updateTreeView(notes) {
        clearTreeView();
        notes.forEach(fileNoteRoot => treeView.appendChild(buildFileNoteTree(fileNoteRoot)));
        vscode.setState({ notes: notes });
    }

    function collapseExpand(expandTree) {
        if (expandTree == true) {
            expandAllNodes();
        } else {
            collapseAllNodes();
        }
    }

    function buildFileNoteTree(fileNoteRoot) {
        const li = document.createElement("li");

        // Create a text span instead of directly setting textContent
        const textSpan = document.createElement("span");
        textSpan.classList.add("node-text");

        // Set innerHTML instead of textContent to handle HTML tags
        textSpan.innerHTML = getTextContent(fileNoteRoot);

        // Add the text span to the li
        li.appendChild(textSpan);

        const iconSpan = document.createElement("span");
        li.prepend(iconSpan); // prepend to put it before the label

        const chevronIconSpan = document.createElement("span");
        li.prepend(chevronIconSpan); // prepend to put it before the label

        if (fileNoteRoot.hasOwnProperty("children") && fileNoteRoot.children.length > 0) {
            li.classList.add("parent-node")
            const ul = document.createElement("ul");

            // Get the appropriate file icon based on the file extension
            const fileIcon = getFileIcon(fileNoteRoot);
            iconSpan.classList.add("node-icon", "devicon", fileIcon);
            chevronIconSpan.classList.add("node-icon", "codicon", "chevron-icon", "codicon-chevron-right");

            fileNoteRoot.children.forEach(childNode => ul.appendChild(buildFileNoteTree(childNode)));
            li.appendChild(ul);

            // Generate a unique ID for this node based on its path
            const nodeId = fileNoteRoot.label;

            // Check if this node was previously expanded
            const wasExpanded = expandedNodes[nodeId] === true;

            // Set initial state based on saved preference
            if (wasExpanded) {
                ul.style.display = ""; // show children
                chevronIconSpan.classList.remove("codicon-chevron-right");
                chevronIconSpan.classList.add("codicon-chevron-down");
            } else {
                ul.style.display = "none"; // hide children
            }

            li.addEventListener('click', function(e) {
                e.stopPropagation();
                const isExpanded = ul.style.display !== 'none';

                if (isExpanded) {
                    ul.style.display = 'none';
                    chevronIconSpan.classList.remove("codicon-chevron-down");
                    chevronIconSpan.classList.add("codicon-chevron-right");
                    expandedNodes[nodeId] = false;
                } else {
                    ul.style.display = '';
                    chevronIconSpan.classList.remove("codicon-chevron-right");
                    chevronIconSpan.classList.add("codicon-chevron-down");
                    expandedNodes[nodeId] = true;
                }

                // Save the state
                vscode.setState({ notes: notes, expandedNodes: expandedNodes });
            });
        } else {
            li.classList.add("child-node");
            // TODO: Add an icon for how critical the note is, use iconSpan
            chevronIconSpan.classList.add("node-icon", "codicon", "chevron-icon");
            chevronIconSpan.style.display = 'none'; // Hide the placeholder span

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
        if (noteTreeNode.hasOwnProperty("children")) {
            const parts = noteTreeNode.label.split(/[/\\]/); // Split on both / and \

            // Get the last two parts of the path
            const fileName = parts.pop(); // Get the filename
            const parentDir = parts.pop(); // Get the parent directory

            // Format as "parentDir/filename"
            textContent = parentDir ? `${parentDir}/${fileName}` : fileName;
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

        // For parent nodes, use the label to get the extension
        if (noteTreeNode.hasOwnProperty("children")) {
            const parts = noteTreeNode.label.split(/[/\\]/);
            const fileName = parts.pop();
            extension = getExtension(fileName);
        }
        // For child nodes, use the filepath
        else if (noteTreeNode.hasOwnProperty("filepath") && noteTreeNode.filepath) {
            extension = getExtension(noteTreeNode.filepath);
        }

        return extension;
    }

    function getFileIcon(noteTreeNode) {
        let fileType = getFileExtension(noteTreeNode);
        const icon = fileIconMappings[fileType] || "devicon-readthedocs-original";
        return icon;
    }

    function clearSearchInput() {
        let previousValue = searchInput.value;
        searchInput.value = "";

        if (previousValue) {
            updateTreeView(notes);
        }
    }

    // --- EVENTS ---
    // Handle click event for parent collapse/expand
    document.querySelectorAll(".parent-node").forEach(parentNode => {
        const chevronIcon = parentNode.querySelector(".chevron-icon");
        const childrenContainer = parentNode.querySelector(".child-node")?.closest("ul");

        parentNode.addEventListener("click", (event) => {
            event.stopPropagation(); // prevent event from bubbling up to parent nodes
            if (event.target !== parentNode) {
                return;
            }
            if (childrenContainer.style.display == "none") {
                chevronIcon.classList.replace("codicon-chevron-right", "codicon-chevron-down");
                childrenContainer.style.display = ""; // show children
            } else {
                chevronIcon.classList.replace("codicon-chevron-down", "codicon-chevron-right");
                childrenContainer.style.display = "none"; // hide children
            }
        });
    });

    // Handle search input
    searchInput.addEventListener("input", function() {
        let searchValue = searchInput.value.toLowerCase();

        // select all child-node li elements
        let childNodes = document.querySelectorAll('.child-node');

        childNodes.forEach(function(node) {
            // Reset display before actually determining if the node should be visible
            node.style.display = '';

            // convert to lower case for case insensitive search
            let nodeText = node.textContent.toLowerCase();

            // hide the element if it doesn't include the search value
            if (nodeText.includes(searchValue)) {
                node.style.display = '';

                // also make sure to display its parent and siblings if found
                let parent = node.closest('.parent-node');
                if (parent) {
                    parent.style.display = '';
                }
            } else {
                node.style.display = 'none';
            }
        });

        // for parent nodes that don't have any visible child nodes
        let parentNodes = document.querySelectorAll('.parent-node');
        parentNodes.forEach(function(node) {
            // Reset display before actually determining if the node should be visible
            node.style.display = '';

            // Hide parents if all their children are hidden
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

        // Helper function to handle spinner and message processing
        function handleMessageWithSpinner(message, action) {
            if (message.showSpinner && loadingSpinner) {
                loadingSpinner.classList.add('visible');
            }
            action();
            if (message.showSpinner && loadingSpinner) {
                loadingSpinner.classList.remove('visible');
            }
        }

        switch (message.type) {
            case "updateNotes":
                handleMessageWithSpinner(message, () => {
                    notes = message.notes;
                    updateTreeView(notes);
                });
                break;
            case "collapseExpand":
                handleMessageWithSpinner(message, () => {
                    collapseExpand(message.expandTree);
                });
                break;
            case "clearSearchInput":
                handleMessageWithSpinner(message, () => {
                    clearSearchInput();
                });
                break;
            case "showSpinner":
                if (loadingSpinner) {
                    loadingSpinner.classList.add('visible');
                }
                break;
            case "hideSpinner":
                if (loadingSpinner) {
                    loadingSpinner.classList.remove('visible');
                }
                break;
        }
    });

    // Helper function to find a node ID by its text content
    function findNodeIdByText(text) {
        // Find the node in the notes array that matches this text
        for (const note of notes) {
            if (getTextContent(note) === text) {
                return note.label;
            }

            // Check children if they exist
            if (note.children && Array.isArray(note.children)) {
                for (const child of note.children) {
                    if (getTextContent(child) === text) {
                        return child.label;
                    }
                }
            }
        }
        return null;
    }
}());
