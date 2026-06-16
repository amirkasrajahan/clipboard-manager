const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let lastClipboardContent = '';
let clipboardInterval;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Clipboard Manager',
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startClipboardPolling() {
  clipboardInterval = setInterval(() => {
    const current = clipboard.readText();
    if (current && current !== lastClipboardContent) {
      lastClipboardContent = current;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-update', current);
      }
    }
  }, 2000);
}

ipcMain.handle('get-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('write-clipboard', (_, text) => {
  clipboard.writeText(text);
});

app.whenReady().then(() => {
  createWindow();
  startClipboardPolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  clearInterval(clipboardInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
