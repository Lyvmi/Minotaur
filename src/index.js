const { app, BrowserWindow, dialog, ipcMain, nativeTheme, Menu } = require('electron');
const path = require('node:path');
const fs = require('fs');
const { getAuthUrl, authenticate, uploadFile } = require('./drive');

let isDialogOpen = false;

app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch('disable-gpu');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    icon: path.join(__dirname, './minotaur-logo.png'),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, './HTML-CSS/index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

nativeTheme.themeSource = "light";

ipcMain.on('save-note', (event, noteData) => {
  const title = noteData.title;
  const body = noteData.body;
  const defaultRootDirectory = noteData.defaultRootDirectory;

  if (isDialogOpen) {
    return;
  }

  isDialogOpen = true;

  dialog.showSaveDialog({
    title: 'Save Note',
    defaultPath: path.join(defaultRootDirectory, `${title}.md`),
    filters: [
      { name: 'Text Files', extensions: ['md', "txt"] }
    ]
  }).then(result => {
    isDialogOpen = false;
    if (!result.canceled) {
      const filePath = result.filePath;
      fs.writeFile(filePath, `${title}---...---.-.-${body}`, async (err) => {
        if (err) {
          console.error('Error saving file:', err);
          event.reply('save-note-status', { success: false, message: 'Error saving file' });
        } else {
          console.log('File saved successfully:', filePath);
          event.reply("note-saved", filePath);
          event.reply('save-note-status', { success: true, message: 'File saved successfully' });

          try {
            await uploadFile(filePath, 'text/markdown');
            console.log('File uploaded to Google Drive successfully');
          } catch (uploadError) {
            console.error('Error uploading file to Google Drive:', uploadError);
          }
        }
      });
    }
  }).catch(err => {
    isDialogOpen = false;
    console.error('Error showing save dialog:', err);
    event.reply('save-note-status', { success: false, message: 'Error showing save dialog' });
  });
});

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

ipcMain.on('show-context-menu2', (event, x, y, id, column) => {
  const contextMenu = Menu.buildFromTemplate([
    { label: "Eliminar", click: () => event.reply("delete-task", id, column) }
  ]);
  contextMenu.popup({ window: BrowserWindow.getFocusedWindow(), x, y });
});

ipcMain.handle('google-authenticate', async (event) => {
  const authUrl = getAuthUrl();
  const authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  authWindow.loadURL(authUrl);

  authWindow.webContents.on('will-redirect', async (event, url) => {
    if (url.startsWith(REDIRECT_URI)) {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      try {
        await authenticate(code);
        authWindow.close();
        event.reply('google-authenticated', { success: true });
      } catch (error) {
        console.error('Error during authentication:', error);
        authWindow.close();
        event.reply('google-authenticated', { success: false, message: 'Authentication failed' });
      }
      return true;
    }
  });
});
