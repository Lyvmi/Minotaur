const fs = require('fs');
const path = require('path');
const os = require("os");

const homeDirectory = os.homedir();
const configDir = path.join(homeDirectory, '.minotaur');

let savedColorVariables = loadPalette();
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

// Function to update CSS variables based on the selected palette
function updateCSSVariables(paletteId) {
    const palette = savedColorVariables[paletteId];
    if (palette) {
        Object.keys(palette).forEach(variable => {
            document.documentElement.style.setProperty(variable, palette[variable]);
        });
        selectedPalette = paletteId;
    }
}

// Apply the selected palette on page load
document.addEventListener("DOMContentLoaded", () => {
    updateCSSVariables(selectedPalette);
});
