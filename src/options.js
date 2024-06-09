// options.js
const { ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const os = require("os");
let savedColorVariables = {};

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
    if (defaultDirectory){
        fs.writeFile(configPath, JSON.stringify(configData, null, 2), (err) => {
            if (err) {
                console.error('Error writing config file', err);
            } else {
                console.log('Config file saved successfully');
                alert("Configuración guardada.");
            }
        });
    }
    else{
        alert("Por favor, selecciona un directorio");
    }
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

// Function to update color variables when a palette is clicked
function updateColorVariables(newColor) {
    const colorVariables = ['--primary-color', '--secondary-color']; // Add more color variables as needed
    colorVariables.forEach(variable => {
        previousColorVariables[variable] = getComputedStyle(document.documentElement).getPropertyValue(variable);
        document.documentElement.style.setProperty(variable, newColor);
    });
}

// Event listener for palette clicks
const palettes = document.querySelectorAll('.palette');
palettes.forEach(palette => {
    palette.addEventListener('click', () => {
        const newColor = getComputedStyle(palette).getPropertyValue('background-color');
        updateColorVariables(newColor);
    });
});

// Event listener for the "Restaurar" button
const restoreButton = document.getElementById('reset');
restoreButton.addEventListener('click', () => {
    Object.entries(previousColorVariables).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
    });
});

// Event listener for the "Guardar" button
const saveButton = document.getElementById('guardar');
saveButton.addEventListener('click', () => {
    // Save the color variables
    // For example, you can save them to a configuration file or database
    // Here, we're just logging the values for demonstration purposes
    console.log("Color variables saved:", previousColorVariables);
});
