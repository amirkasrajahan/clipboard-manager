const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
  onClipboardUpdate: (callback) => {
    ipcRenderer.on('clipboard-update', (_, text) => callback(text));
    return () => ipcRenderer.removeAllListeners('clipboard-update');
  },
});
