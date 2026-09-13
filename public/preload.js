const { contextBridge, ipcRenderer } = require('electron');

// this is THE bridge file - only place allowed to touch electron stuff AND get loaded
// into the react page at the same time. exposeInMainWorld makes window.electronAPI
// exist in react, with ONLY these 3 things on it, nothing else leaks through
contextBridge.exposeInMainWorld('electronAPI', {
  // 1) ask main process for clipboard text right now, invoke = ask once and wait for answer
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  // 2) tell main process to write this text to the system clipboard
  writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
  // 3) this one's different - its a subscribe not a one time ask. electron.js pushes
  // 'clipboard-update' messages whenever it feels like it (every time clipboard
  // actually changes) and we just run whatever callback react gave us each time
  onClipboardUpdate: (callback) => {
    ipcRenderer.on('clipboard-update', (_, text) => callback(text));
    // returns an unsub function - react's useEffect calls this automatically on
    // unmount so we're not leaking listeners
    return () => ipcRenderer.removeAllListeners('clipboard-update');
  },
});
