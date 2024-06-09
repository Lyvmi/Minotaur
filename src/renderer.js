const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

function loadConfig() {
    const homeDirectory = os.homedir();
    const configDir = path.join(homeDirectory, '.minotaur');
    const configPath = path.join(configDir, 'config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading config file:', err);
        window.location.href = "options.html";
    }
}

const config = loadConfig();

let savedTitle = "";
let savedBody = "";
let isNoteOpened = false;
let deleteMode = false;
let notes_directory = config.defaultDirectory;
let key = config.encryptionKey;
let savedfilepath;

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
    deleteButton = body.querySelector(".bx-trash"),
    encrypt = body.querySelector(".encrypt"),
    decrypt = body.querySelector(".decrypt");

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

function encryptNote(key, text) {
    if (isNoteOpened) {
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encryptedText = cipher.update(text, 'utf8', 'hex');
        encryptedText += cipher.final('hex');
        return encryptedText;
    }
    else{
        return "";
    }
}

function decryptNote(key, encryptedText) {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
        decryptedText += decipher.final('utf8');
        return decryptedText;
    } catch (error) {
        return "" // Return null or handle the error appropriately
    }
}

encrypt.addEventListener("click", () => {
    let note_body = noteBody.value;
    noteBody.value = encryptNote(key, note_body);
});

decrypt.addEventListener("click", () => {
    let note_body = noteBody.value;
    noteBody.value = decryptNote(key, note_body);
});

markdown_toggle.addEventListener("click", () => {
    markdown_toggle.classList.toggle("active");
    if (markdown_toggle.classList.contains("active")) {
        text = body.querySelector(".note-body").value;
        md_text.innerHTML = text;
        noteBody.style.display = "none";
        zero_md.style.display = "block";
        markdown_toggle.classList.remove("bxl-markdown");
        markdown_toggle.classList.add("bx-edit-alt");
        markdown_toggle.title = "Modo editar";
    } else {
        noteBody.style.display = "block";
        zero_md.style.display = "none";
        markdown_toggle.classList.add("bxl-markdown");
        markdown_toggle.classList.remove("bx-edit-alt");
        markdown_toggle.title = "Modo markdown";
    }
});

clear_note.addEventListener("click", () => {
    let confirm = window.confirm("¿Seguro que quieres limpiar la nota?\nNo se guardarán los cambios automaticamente.");
    if (confirm) {
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
                        folderElement.dataset.filepath = filePath
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
                let folderpath = folder.dataset.filepath;
                e.preventDefault();
                const x = e.clientX;
                const y = e.clientY;
                ipcRenderer.send("show-context-menu", x, y, folderpath);
            });
        });

        // Update current path display
        currentPathDisplay.textContent = directoryPath;
    });
}

// Function to open a file or directory
function openItem(filePath) {
    savedfilepath = filePath;
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

// Initial display
displayDirectoryContents(notes_directory);

// Save button click event listener

function SaveNote(encBody) {
    const title = noteTitle.value;
    let note_body = noteBody.value;
    if (encBody) {
        note_body = encBody;
    }
    if (!isNoteOpened) {
        ipcRenderer.send('save-note', { title: title, body: note_body, defaultRootDirectory: notes_directory });
    } else {
        const file = document.querySelector(`[data-filepath="${savedfilepath}"]`)
        const filePath = path.join(file.dataset.filepath);
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
}



save.addEventListener("click", () => {
    SaveNote();
});

ipcRenderer.on("note-saved", (e, filepath) => {
    displayDirectoryContents(notes_directory);
    savedfilepath = filepath;
    isNoteOpened = true;
});

// Save to cloud button click event listener

save_cloud.addEventListener('click', async () => {
    const response = await ipcRenderer.invoke('google-authenticate');
    if (response) {
        // Implement the upload logic here
        const filePath = savedfilepath; // Use the saved file path
        const mimeType = 'text/markdown'; // Adjust as needed
        await ipcRenderer.send('upload-file', filePath, mimeType);
    } else {
        console.error('Authentication failed');
    }
});

ipcRenderer.on('google-authenticated', () => {
    console.log('Google authentication successful');
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
            const folderPath = target.dataset.filepath;
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

function nameNewFolder(folderpath) {
    const folder_name = document.createElement("input");
    let sent = false;
    let folder;
    folder_name.type = "text";
    folder_name.classList = "folder";
    if (folderpath) {
        folder = document.querySelector(`[data-filepath="${folderpath}"]`);

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
                let newFolderPath;
                if (folder) {
                    newFolderPath = path.join(folderpath, newFolderName);
                }
                else {
                    newFolderPath = path.join(notes_directory, newFolderName);
                    folder_name.remove();
                }
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
                sent = true
            }
            else {
                let newFolderPath;
                if (folder) {
                    newFolderPath = path.join(folderpath, newFolderName);
                }
                else {
                    newFolderPath = path.join(notes_directory, newFolderName);
                    folder_name.remove();
                }
                sent = true;
                createNewFolder(newFolderPath);
            }
        }
    });

}

new_folder.addEventListener("click", () => {
    nameNewFolder();
})

ipcRenderer.on("add-folder", (e, folderpath) => {
    nameNewFolder(folderpath);
});
