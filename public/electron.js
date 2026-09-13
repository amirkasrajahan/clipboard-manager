const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let lastClipboardContent = '';
let clipboardIntervalId;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
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
  clipboardIntervalId = setInterval(() => {
    const current = clipboard.readText();
    if (current && current !== lastClipboardContent) {
      lastClipboardContent = current;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-update', current);
      }
    }
  }, 1000);
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
  clearInterval(clipboardIntervalId);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
