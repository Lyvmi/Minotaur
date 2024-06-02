const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let savedTitle = "";
let savedBody = "";
let isNoteOpened = false;
let notes_directory = "/home/lyvmi/Notas";

const body = document.querySelector("body"),
    toggle = body.querySelector(".toggle"),
    folder_container = body.querySelector(".folder-container"),
    note_container = body.querySelector(".note-container"),
    save = body.querySelector(".bxs-save"),
    save_cloud = body.querySelector(".bx-cloud-upload"),
    clear_note = body.querySelector(".bx-trash"),
    folder_tree = body.querySelector('.folder-tree'),
    currentPathDisplay = document.getElementById('current-path'),
    noteName = body.querySelector('.note-name'),
    noteTitle = body.querySelector('.note-title'),
    noteBody = body.querySelector('.note-body'),
    markdown_toggle = body.querySelector(".bxl-markdown"),
    zero_md = body.querySelector(".zero-md"),
    md_text = body.querySelector(".md-text"),
    open_file = body.querySelector(".bx-file-find"),
    open_folder = body.querySelector(".bxs-folder-open"),
    new_note = body.querySelector("#new-note");


toggle.addEventListener("click", () => {
    folder_container.classList.toggle("close");
    toggle.classList.toggle("close");
    note_container.classList.toggle("close");

    if (toggle.classList.contains("bx-chevron-right")) {
        toggle.classList.remove("bx-chevron-right");
        toggle.classList.add("bx-chevron-left");
    } else {
        toggle.classList.remove("bx-chevron-left");
        toggle.classList.add("bx-chevron-right");
    }
});



markdown_toggle.addEventListener("click", () => {
    markdown_toggle.classList.toggle("active");
    if (markdown_toggle.classList.contains("active")) {
        text = body.querySelector(".note-body").value;
        md_text.innerHTML = text;
        noteBody.style.display = "none";
        zero_md.style.display = "block";
    } else {
        noteBody.style.display = "block";
        zero_md.style.display = "none";
    }
});

clear_note.addEventListener("click", () => {
    noteTitle.value = "";
    noteBody.value = "";
});

new_note.addEventListener("click", () => {
    noteName.innerHTML = "";
    noteTitle.value = "";
    noteBody.value = "";
    isNoteOpened = false;
})

// Function to generate directory tree HTML
function buildDirectoryTreeHTML(directoryPath, callback) {
    fs.readdir(directoryPath, (err, list) => {
        if (err) return callback(err);

        const ulElement = document.createElement('ul'); // Create the root <ul> element

        let pending = list.length;

        if (!pending) {
            return callback(null, ulElement);  // Return an empty list if the directory is empty
        }
        list.forEach(file => {
            const filePath = path.join(directoryPath, file);
            fs.stat(filePath, (err, stat) => {
                if (err) return callback(err);
                if (stat && stat.isDirectory()) {
                    buildDirectoryTreeHTML(filePath, (err, childUlElement) => {
                        if (err) return callback(err);
                        const liElement = document.createElement('li'); // Create <li> for folder
                        const folderElement = document.createElement('span'); // Create <span> for folder name
                        folderElement.textContent = file;
                        folderElement.classList.add('folder');
                        folderElement.appendChild(childUlElement);
                        liElement.appendChild(folderElement);
                        ulElement.appendChild(liElement);

                        if (!--pending) {
                            callback(null, ulElement);
                        }
                    });
                } else {
                    // Create the anchor element for files
                    const liElement = document.createElement('li');
                    const aElement = document.createElement('a');
                    aElement.textContent = file;
                    aElement.href = "#";
                    aElement.dataset.filepath = filePath;
                    aElement.addEventListener('click', (event) => {
                        event.preventDefault(); // Prevent default anchor behavior
                        event.stopPropagation(); // Stop event propagation
                        openItem(filePath, false);
                    });
                    aElement.addEventListener('dblclick', (event) => {
                        event.preventDefault(); // Prevent default anchor behavior
                        event.stopPropagation(); // Stop event propagation
                        openItem(filePath, true);
                    });
                    liElement.appendChild(aElement);
                    ulElement.appendChild(liElement);

                    if (!--pending) {
                        callback(null, ulElement);
                    }
                }
            });
        });
    });
}

// Function to display directory contents
function displayDirectoryContents(directoryPath) {
    buildDirectoryTreeHTML(directoryPath, (err, ulElement) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        folder_tree.innerHTML = ''; // Clear previous contents
        folder_tree.appendChild(ulElement); // Append the generated HTML

        // Add event listeners to new folder elements
        const folders = document.querySelectorAll('.folder');
        folders.forEach(folder => {
            folder.addEventListener('click', (e) => {
                e.stopPropagation();
                folder.classList.toggle('show');
                const childUl = folder.querySelector('ul');
                if (childUl) {
                    childUl.classList.toggle('show');
                }
            });
        });

        // Update current path display
        currentPathDisplay.textContent = directoryPath;
    });
}

// Function to open a file or directory
function openItem(filePath, open_file) {
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error accessing file/directory:', err);
            return;
        }

        if (stats.isDirectory()) {
            displayDirectoryContents(filePath);
        } else {
            if ((filePath.endsWith('.md')) || (filePath.endsWith(".txt"))) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        return;
                    }

                    // Extract file name from file path
                    const fileName = path.basename(filePath);

                    if (open_file) {
                        isNoteOpened = true;
                        noteContent = data.split("---...---.-.-");
                        noteName.innerHTML = fileName;
                        noteTitle.value = noteContent[0];
                        noteBody.value = noteContent[1];
                        savedTitle = noteContent[0];
                        savedBody = noteContent[1];
                    }
                    // Display file name and contents
                });
            }
            else {
                console.log('Error: Selected file is not a .txt file.');
                return;
            }

        }
    });
}

// Event listener for opening the root directory
document.getElementById('reload').addEventListener('click', () => {
    displayDirectoryContents(notes_directory);
});

// Initial display: open root directory
displayDirectoryContents(notes_directory);

// Save button click event listener

save.addEventListener("click", () => {
    const note_name = noteName.innerHTML;
    const title = noteTitle.value;
    const note_body = noteBody.value;
    if (!isNoteOpened) {
        ipcRenderer.send('save-note', { title: title, body: note_body });
    } else {
        const filePath = path.join(notes_directory, `${note_name}`);
        fs.writeFile(filePath, `${title}---...---.-.-${note_body}`, (err) => {
            if (err) {
                console.error('Error saving file:', err);
            } else {
                console.log('File saved successfully:', filePath);
                savedTitle = noteTitle.value;
                savedBody = noteBody.value;
                noteName.classList.remove("notSaved");
            }
        });
    }
});


// Save to cloud button click event listener

save_cloud.addEventListener("click", () => {
    const title = noteTitle.value;
    const note_body = noteBody.value;
    console.log("Note saved!");
    console.log(title);
    console.log(note_body);
});


// Function to open a file dialog and read the file
function openFileDialog() {
    ipcRenderer.invoke('show-open-file-dialog').then(result => {
        if (!result.canceled) {
            openItem(result.filePaths[0], true);
        }
    }).catch(err => {
        console.error('Error opening file dialog:', err);
    });
}

// Function to open a folder dialog and set it as the new root directory
function openFolderDialog() {
    ipcRenderer.invoke('show-open-folder-dialog').then(result => {
        if (!result.canceled) {
            notes_directory = result.filePaths[0];
            displayDirectoryContents(notes_directory);
        }
    }).catch(err => {
        console.error('Error opening folder dialog:', err);
    });
}

// Event listeners for the file and folder dialog buttons
open_file.addEventListener('click', openFileDialog);
open_folder.addEventListener('click', openFolderDialog);

function isSaved() {
    if ((noteBody.value != savedBody || noteTitle.value != savedTitle) && isNoteOpened){
        noteName.classList.add("notSaved");
    }
    else{
        noteName.classList.remove("notSaved");
    }
}

setInterval(isSaved, 100);