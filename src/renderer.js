const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const homeDirectory = os.homedir();
const configDir = path.join(homeDirectory, '.minotaur');

let selectedPalette = loadConfig();
let savedColorVariables = loadPalette();
selectedPalette = selectedPalette ? selectedPalette.palette : "1";

function loadConfig() {
    const configPath = path.join(configDir, 'config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading config file:', err);
        window.location.href = "options.html";
        return null;
    }
}

function loadPalette() {
    const configPath = path.join(__dirname, "..", "palettes.json");
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading palettes file:', err);
        return null;
    }
}

function updateCSSVariables(paletteId) {
    const palette = savedColorVariables[paletteId];
    if (palette) {
        Object.keys(palette).forEach(variable => {
            document.documentElement.style.setProperty(variable, palette[variable]);
        });
        selectedPalette = paletteId;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateCSSVariables(selectedPalette);
});

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
    else {
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
        return ""
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

function buildDirectoryTreeHTML(directoryPath, callback) {
    fs.readdir(directoryPath, (err, list) => {
        if (err) return callback(err);;
        list.sort((a, b) => a.localeCompare(b));
        const ulElement = document.createElement('ul');

        let pending = list.length;

        if (!pending) {
            return callback(null, ulElement);
        }
        list.forEach(file => {
            const filePath = path.join(directoryPath, file);
            fs.stat(filePath, (err, stat) => {
                if (err) return callback(err);
                if (stat && stat.isDirectory()) {
                    buildDirectoryTreeHTML(filePath, (err, childUlElement) => {
                        if (err) return callback(err);
                        const liElement = document.createElement('li');
                        const folderElement = document.createElement('div');
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
                    const liElement = document.createElement('li');
                    const aElement = document.createElement('a');
                    aElement.textContent = file;
                    aElement.href = "#";
                    aElement.classList.add("file");
                    aElement.dataset.filepath = filePath;
                    aElement.addEventListener('dblclick', (event) => {
                        if (!deleteMode) {
                            event.preventDefault();
                            event.stopPropagation();
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

function displayDirectoryContents(directoryPath) {
    buildDirectoryTreeHTML(directoryPath, (err, ulElement) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        folder_tree.innerHTML = '';
        folder_tree.appendChild(ulElement);

        const folders = folder_tree.querySelectorAll('.folder');
        folders.forEach(folder => {
            folder.addEventListener('click', (event) => {
                event.stopPropagation();
                if (!deleteMode) {
                    folder.classList.toggle("show");
                    const childUl = folder.nextElementSibling;
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

        currentPathDisplay.textContent = directoryPath;
    });
}


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

            const fileName = path.basename(filePath);

            const noteContent = data.split("---...---.-.-");
            if (noteContent.length !== 2) {
                console.error('Invalid note format:', filePath);
                return;
            }

            noteName.innerHTML = fileName;
            noteTitle.value = noteContent[0];
            noteBody.value = noteContent[1];
            savedTitle = noteContent[0];
            savedBody = noteContent[1];
            isNoteOpened = true;

        });
    }
}

document.getElementById('reload').addEventListener('click', () => {
    displayDirectoryContents(notes_directory);
});


displayDirectoryContents(notes_directory);



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



save_cloud.addEventListener('click', async () => {
    const response = await ipcRenderer.invoke('google-authenticate');
    if (response) {
        const filePath = savedfilepath;
        const mimeType = 'text/markdown';
        await ipcRenderer.send('upload-file', filePath, mimeType);
    } else {
        console.error('Authentication failed');
    }
});

ipcRenderer.on('google-authenticated', () => {
    console.log('Google authentication successful');
});

function openFileDialog() {
    ipcRenderer.invoke('show-open-file-dialog').then(result => {
        if (!result.canceled) {
            openItem(result.filePaths[0], true);
        }
    }).catch(err => {
        console.error('Error opening file dialog:', err);
    });
}

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
                });
            }
        }
    });
}

deleteButton.addEventListener('click', () => {
    deleteMode = !deleteMode;
    if (deleteMode) {
        deleteButton.classList.add('active');
    } else {
        deleteButton.classList.remove('active');
    }
});

folder_tree.addEventListener('dblclick', (event) => {
    if (deleteMode) {
        const target = event.target;
        if (target.classList.contains('folder')) {
            const folderPath = target.dataset.filepath;
            deleteItem(folderPath);
        } else if (target.classList.contains("file")) {
            const filePath = target.dataset.filepath;
            deleteItem(filePath);
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
            displayDirectoryContents(notes_directory);
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
