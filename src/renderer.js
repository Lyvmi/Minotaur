const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const body = document.querySelector("body"),
    toggle = body.querySelector(".toggle"),
    folder_container = body.querySelector(".folder-container"),
    note_container = body.querySelector(".note-container"),
    save = body.querySelector(".bxs-save"),
    save_cloud = body.querySelector(".bx-cloud-upload"),
    fileExplorer = document.getElementById('file-explorer'),
    currentPathDisplay = document.getElementById('current-path'),
    noteTitle = body.querySelector('.note-title'),
    noteBody = body.querySelector('.note-body');

toggle.addEventListener("click", () => {
    folder_container.classList.toggle("close");
    toggle.classList.toggle("close");
    note_container.classList.toggle("close");

    if (toggle.classList.contains("bx-chevron-right")) {
        toggle.classList.remove("bx-chevron-right");
        toggle.classList.add("bx-chevron-left");
    }
    else {
        toggle.classList.remove("bx-chevron-left");
        toggle.classList.add("bx-chevron-right");
    }
});

// Function to display directory contents
function displayDirectoryContents(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        fileExplorer.innerHTML = ''; // Clear previous contents

        // Add a link for each file/directory
        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            const link = document.createElement('a');
            link.textContent = file;
            link.href = '#';
            link.onclick = () => {
                openItem(filePath);
                return false; // Prevent default link behavior
            };
            fileExplorer.appendChild(link);
            fileExplorer.appendChild(document.createElement('br'));
        });

        // Update current path display
        currentPathDisplay.textContent = directoryPath;
    });
}

// Function to open a file or directory
function openItem(filePath) {
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error accessing file/directory:', err);
            return;
        }

        if (stats.isDirectory()) {
            displayDirectoryContents(filePath);
        } else {
            // Check if the file is a .txt file
            if (!filePath.endsWith('.txt')) {
                console.log('Error: Selected file is not a .txt file.');
                return;
            }

            // Read the contents of the file
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }

                // Extract file name from file path
                const fileName = path.basename(filePath);

                // Display file name and contents
                console.log('File Name:', fileName);
                noteTitle.value = fileName;
                noteBody.value = data;
            });
        }
    });
}

// Event listener for opening the root directory
document.getElementById('open-root').addEventListener('click', () => {
    displayDirectoryContents('/home/lyvmi/Notas');
});

// Initial display: open root directory
displayDirectoryContents('/home/lyvmi/Notas');

// Save button click event listener
save.addEventListener("click", () => {
    const title = noteTitle.value;
    const note_body = noteBody.value;
    ipcRenderer.send('save-note', { title: title, body: note_body });
    console.log("Hola");
});

// Save to cloud button click event listener
save_cloud.addEventListener("click", () => {
    const title = noteTitle.value;
    const note_body = noteBody.value;
    console.log("Note saved!");
    console.log(title);
    console.log(note_body);
});
