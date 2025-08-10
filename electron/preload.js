const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (...args) => ipcRenderer.invoke(...args),
        on: (...args) => ipcRenderer.on(...args),
    }
});