const { app, BrowserWindow, dialog, ipcMain, nativeTheme, Menu } = require('electron');
const path = require('node:path');
const fs = require("fs");

let isDialogOpen = false;

// Prevents an error on GPU - Not a harmful error
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch('disable-gpu');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './HTML-CSS/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Force light theme
nativeTheme.themeSource = "light";

// IPC event listener to handle saving note
ipcMain.on('save-note', (event, noteData) => {
  const title = noteData.title;
  const body = noteData.body;
  const defaultRootDirectory = noteData.defaultRootDirectory

  if (isDialogOpen) {
    return;
  }

  isDialogOpen = true;

  // Open a save dialog
  dialog.showSaveDialog({
    title: 'Save Note',
    defaultPath: path.join(defaultRootDirectory, `${title}.md`),
    filters: [
      { name: 'Text Files', extensions: ['md', "txt"] }
    ]
  }).then(result => {
    isDialogOpen = false;
    if (!result.canceled) {
      // Write data to the selected file
      fs.writeFile(result.filePath, `${title}---...---.-.-${body}`, (err) => {
        if (err) {
          // Handle error
          console.error('Error saving file:', err);
          event.reply('save-note-status', { success: false, message: 'Error saving file' });
        } else {
          // File saved successfully
          console.log('File saved successfully:', result.filePath);
          event.reply("note-saved", result.filePath);
          event.reply('save-note-status', { success: true, message: 'File saved successfully' });
        }
      });
    }
  }).catch(err => {
    isDialogOpen = false;
    console.error('Error showing save dialog:', err);
    event.reply('save-note-status', { success: false, message: 'Error showing save dialog' });
  });
});

// IPC event listener to handle opening file dialog
ipcMain.handle('show-open-file-dialog', async () => {
  if (isDialogOpen) {
    return { canceled: true };
  }

  isDialogOpen = true;

  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Text Files', extensions: ['txt', "md"] }]
    });
    isDialogOpen = false;
    return result;
  } catch (err) {
    isDialogOpen = false;
    console.error('Error showing open file dialog:', err);
    return { canceled: true };
  }
});

// IPC event listener to handle opening folder dialog
ipcMain.handle('show-open-folder-dialog', async () => {
  if (isDialogOpen) {
    return { canceled: true };
  }

  isDialogOpen = true;

  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    isDialogOpen = false;
    return result;
  } catch (err) {
    isDialogOpen = false;
    console.error('Error showing open folder dialog:', err);
    return { canceled: true };
  }
});

ipcMain.on('show-context-menu', (event, x, y, element) => {
  const contextMenu = Menu.buildFromTemplate([
      { label: 'Nueva carpeta', click: () => event.reply("add-folder", element) }
  ]);
  contextMenu.popup({ window: BrowserWindow.getFocusedWindow(), x, y });
});