const { ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const os = require("os");

const homeDirectory = os.homedir();
const configDir = path.join(homeDirectory, '.minotaur');

let savedColorVariables = loadPallete();
let selectedPalette = loadConfig();
selectedPalette = selectedPalette ? selectedPalette.palette : "1";

function loadConfig() {
    const configPath = path.join(configDir, 'config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading config file:', err);
    }
}

function loadPallete() {
    const configPath = path.join(__dirname, "..", "palettes.json");
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading palettes file:', err);
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

const generalLink = document.querySelector('.general-link');
const appearanceLink = document.querySelector('.appearance-link');
const generalBody = document.querySelector('.general-body');
const appearanceBody = document.querySelector('.appearance-body');
const closeButton = document.querySelector('.bx-x');
const generalSaveButton = document.querySelector('#general-save');
const browse = document.querySelector(".browse");

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

closeButton.addEventListener('click', () => {
    if (history.length >= 2) {
        window.history.back();
    }
    else {
        window.location.href = "./index.html";
    }
});

generalSaveButton.addEventListener('click', () => {
    const defaultDirectory = document.querySelector('#default-directory').value;
    const encryptionKey = document.querySelector('#encryption-key').value;
    const palette = selectedPalette;

    const configData = {
        defaultDirectory,
        encryptionKey,
        palette
    };

    const configPath = path.join(configDir, 'config.json');

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (defaultDirectory) {
        fs.writeFile(configPath, JSON.stringify(configData, null, 2), (err) => {
            if (err) {
                console.error('Error writing config file', err);
            } else {
                console.log('Config file saved successfully');
                alert("Configuración guardada.");
            }
        });
    }
    else {
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

const palettes = document.querySelectorAll('.palette img');
palettes.forEach(palette => {
    palette.addEventListener('click', () => {
        const paletteId = palette.className;
        updateCSSVariables(paletteId);
    });
});

const restoreButton = document.getElementById('reset');
restoreButton.addEventListener('click', () => {
    const paletteId = loadConfig().palette;
    updateCSSVariables(paletteId);
});

const saveButton = document.getElementById('appearance-save');
saveButton.addEventListener('click', () => {
    const configData = loadConfig();
    configData.palette = selectedPalette;
    const configPath = path.join(configDir, 'config.json');

    fs.writeFile(configPath, JSON.stringify(configData, null, 2), (err) => {
        if (err) {
            console.error('Error saving palette config file:', err);
        } else {
            console.log('Palette config saved successfully');
            alert("Paleta guardada.");
        }
    });
});
