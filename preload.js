const { contextBridge, ipcRenderer } = require('electron');

// API exposta de forma segura ao renderer
contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  pickFolder: () => ipcRenderer.invoke('config:pickFolder'),
  scan: () => ipcRenderer.invoke('scan'),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  revealFile: (filePath) => ipcRenderer.invoke('file:reveal', filePath),
  getThumbnail: (payload) => ipcRenderer.invoke('thumbnail:get', payload),
  clearThumbCache: () => ipcRenderer.invoke('thumbnail:clearCache')
});
