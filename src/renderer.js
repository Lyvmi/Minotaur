const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let savedTitle = "";
let savedBody = "";
let isNoteOpened = false;
let deleteMode = false;
let notes_directory = "/home/lyvmi/Notas";

const body = document.querySelector("body"),
    toggle = body.querySelector(".toggle"),
    folder_container = body.querySelector(".folder-container"),
    note_container = body.querySelector(".note-container"),
    save = body.querySelector(".bxs-save"),
    save_cloud = body.querySelector(".bx-cloud-upload"),
    clear_note = body.querySelector(".bx-recycle"),
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
    new_note = body.querySelector("#new-note"),
    new_folder = body.querySelector(".bx-folder-plus"),
    deleteButton = body.querySelector(".bx-trash");

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
    if (isNoteOpened) {
        let confirm = window.confirm("¿Seguro que quieres limpiar la nota?\nNo se guardarán los cambios automaticamente.");
        if (confirm) {
            noteTitle.value = "";
            noteBody.value = "";
        }
    }
    else {
        noteTitle.value = "";
        noteBody.value = "";
    }
});

new_note.addEventListener("click", () => {
    if (isNoteOpened) {
        let confirm = window.confirm("¿Seguro que quieres crear una nueva nota?\nLos cambios no guardados desapareceran.");
        if (confirm) {
            noteName.innerHTML = "";
            noteTitle.value = "";
            noteBody.value = "";
            isNoteOpened = false;
        }
    }
    else {
        noteName.innerHTML = "";
        noteTitle.value = "";
        noteBody.value = "";
        isNoteOpened = false;
    }

})

// Function to generate directory tree HTML
function buildDirectoryTreeHTML(directoryPath, callback) {
    fs.readdir(directoryPath, (err, list) => {
        if (err) return callback(err);;
        list.sort((a, b) => a.localeCompare(b));
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
                        const folderElement = document.createElement('div'); // Create <span> for folder name
                        folderElement.textContent = file;
                        folderElement.classList.add('folder');
                        folderElement.id = file;
                        liElement.appendChild(folderElement);
                        liElement.appendChild(childUlElement);
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
                    aElement.classList.add("file");
                    aElement.dataset.filepath = filePath;
                    aElement.addEventListener('dblclick', (event) => {
                        if (!deleteMode) {
                            event.preventDefault(); // Prevent default anchor behavior
                            event.stopPropagation(); // Stop event propagation
                            openItem(filePath, true);
                        }
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
        const folders = folder_tree.querySelectorAll('.folder');
        folders.forEach(folder => {
            folder.addEventListener('click', (event) => {
                event.stopPropagation();
                if (!deleteMode) {
                    folder.classList.toggle("show");
                    const childUl = folder.nextElementSibling; // Get the next sibling, which should be the <ul>
                    if (childUl) {
                        childUl.classList.toggle('show');
                    }
                }
            });

            folder.addEventListener("contextmenu", (e) => {
                let folderName = folder.innerHTML
                e.preventDefault();
                const x = e.clientX;
                const y = e.clientY;
                ipcRenderer.send("show-context-menu", x, y, folderName);
            });
        });

        // Update current path display
        currentPathDisplay.textContent = directoryPath;
    });
}

// Function to open a file or directory
function openItem(filePath) {
    let element_name = filePath.split("/");
    element_name = element_name.slice(-1);
    let confirm = window.confirm('¿Seguro que quieres cargar la nota "' + element_name + '"?');
    if (confirm) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }

            // Extract file name from file path
            const fileName = path.basename(filePath);

            // Split the data into title and body if it's a valid note format
            const noteContent = data.split("---...---.-.-");
            if (noteContent.length !== 2) {
                console.error('Invalid note format:', filePath);
                return;
            }

            // Update the UI with the file name and note content
            noteName.innerHTML = fileName;
            noteTitle.value = noteContent[0];
            noteBody.value = noteContent[1];
            savedTitle = noteContent[0];
            savedBody = noteContent[1];
            isNoteOpened = true;

            // Display file name and contents

        });
    }
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
        ipcRenderer.send('save-note', { title: title, body: note_body, defaultRootDirectory: notes_directory });
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

ipcRenderer.on("note-saved", () => {
    displayDirectoryContents(notes_directory);
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
    if ((noteBody.value != savedBody || noteTitle.value != savedTitle) && isNoteOpened) {
        noteName.classList.add("notSaved");
    }
    else {
        noteName.classList.remove("notSaved");
    }
}

setInterval(isSaved, 100);

function deleteItem(filePath) {
    fs.stat(filePath, (err, stats) => {
        let element_name = filePath.split("/");
        element_name = element_name.slice(-1);
        if (err) {
            console.error('Error accessing file/directory:', err);
            return;
        }

        if (stats.isDirectory()) {
            let confirm = window.confirm('¿Seguro que quieres borrar el directorio "' + element_name + '"?');
            if (confirm) {
                fs.rmdir(filePath, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Error deleting directory:', err);
                        return;
                    }
                    console.log('Directory deleted successfully:', filePath);
                    displayDirectoryContents(notes_directory);
                    // Optionally, update UI or perform any additional actions
                });
            }
        } else {
            let confirm = window.confirm('¿Seguro que quieres borrar la nota "' + element_name + '"?');
            if (confirm) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return;
                    }
                    console.log('File deleted successfully:', filePath);
                    displayDirectoryContents(notes_directory);
                    // Optionally, update UI or perform any additional actions
                });
            }
        }
    });
}

deleteButton.addEventListener('click', () => {
    deleteMode = !deleteMode; // Toggle delete mode
    if (deleteMode) {
        deleteButton.classList.add('active'); // Add a visual indicator for delete mode
    } else {
        deleteButton.classList.remove('active'); // Remove visual indicator
    }
});

folder_tree.addEventListener('dblclick', (event) => {
    if (deleteMode) {
        const target = event.target;
        if (target.classList.contains('folder')) {
            const folderName = target.outerText;
            console.log(folderName);
            const folderPath = path.join(notes_directory, folderName);
            deleteItem(folderPath); // Delete folder
        } else if (target.classList.contains("file")) {
            const filePath = target.dataset.filepath;
            deleteItem(filePath); // Delete file
        }
    }
});

function createNewFolder(folderPath) {
    fs.mkdir(folderPath, (err) => {
        if (err) {
            setTimeout(() => {
                console.error('Error creating folder:', err);
                alert('Error creating folder. Please try again.');
            }, 150);

        } else {
            console.log('Folder created successfully:', folderPath);
            displayDirectoryContents(notes_directory); // Refresh the directory view
        }
    });
}

function nameNewFolder(element) {
    const folder_name = document.createElement("input");
    let sent = false;
    folder_name.type = "text";
    folder_name.classList = "folder";
    if (element) {
        const folder = document.getElementById(element)
        if (!folder.classList.contains("show")) {
            folder.classList.add("show")
        }
        folder.appendChild(folder_name);
    }
    else {
        folder_tree.appendChild(folder_name);
    }
    folder_name.focus();
    folder_name.addEventListener("focusout", (e) => {
        if (!sent) {
            const newFolderName = folder_name.value;
            if (newFolderName.includes(".") || !newFolderName) {
                console.log("Name can't contain '.' or be null");
                folder_name.remove();
                sent = true
            }
            else {
                const newFolderPath = path.join(notes_directory, element, newFolderName);
                folder_name.remove();
                sent = true;
                createNewFolder(newFolderPath);

            }
        }
    });

    folder_name.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !sent) {
            const newFolderName = folder_name.value;
            if (newFolderName.includes(".") || !newFolderName) {
                console.log("Name can't contain '.' or be null");
                folder_name.remove();
                sent = true;
            }
            else {
                const newFolderPath = path.join(notes_directory, newFolderName);
                folder_name.remove();
                sent = true;
                createNewFolder(newFolderPath);
            }
        }
    });

}
new_folder.addEventListener("click", () => {
    nameNewFolder();
})

ipcRenderer.on("add-folder", (e, element) => {
    nameNewFolder(element);
});