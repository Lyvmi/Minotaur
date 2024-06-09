// options.js
const { ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const os = require("os");

// Get references to the HTML elements
const generalLink = document.querySelector('.general-link');
const appearanceLink = document.querySelector('.appearance-link');
const generalBody = document.querySelector('.general-body');
const appearanceBody = document.querySelector('.appearance-body');
const closeButton = document.querySelector('.bx-x');
const generalSaveButton = document.querySelector('#general-save');
const browse = document.querySelector(".browse");

// Event listener for the sidebar links
generalLink.addEventListener('click', () => {
    generalBody.style.display = 'flex';
    appearanceBody.style.display = 'none';
    generalLink.classList.add('active');
    appearanceLink.classList.remove('active');
});

appearanceLink.addEventListener('click', () => {
    generalBody.style.display = 'none';
    appearanceBody.style.display = 'flex';
    generalLink.classList.remove('active');
    appearanceLink.classList.add('active');
});

// Event listener for the close button
closeButton.addEventListener('click', () => {
    if (history.length >= 2){
        window.history.back();
    }
    else{
        window.location.href = "./index.html";
    }
});

// Event listener for the general save button
generalSaveButton.addEventListener('click', () => {
    const defaultDirectory = document.querySelector('#default-directory').value;
    const encryptionKey = document.querySelector('#encryption-key').value;

    const configData = {
        defaultDirectory,
        encryptionKey
    };
    const homeDirectory = os.homedir();
    const configDir = path.join(homeDirectory, '.minotaur');
    const configPath = path.join(configDir, 'config.json');

    // Ensure the directory exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFile(configPath, JSON.stringify(configData, null, 2), (err) => {
        if (err) {
            console.error('Error writing config file', err);
        } else {
            console.log('Config file saved successfully');
            alert("Configuración guardada.");
        }
    });
});


browse.addEventListener("click", () => {
    openFolderDialog();
});

function openFolderDialog() {
    ipcRenderer.invoke('show-open-folder-dialog').then(result => {
        if (!result.canceled) {
            const defaultDirectory = document.querySelector('#default-directory');
            defaultDirectory.value = result.filePaths[0]
        }
    }).catch(err => {
        console.error('Error opening folder dialog:', err);
    });
}
