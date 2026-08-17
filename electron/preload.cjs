const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to the renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Widget controls
  closeWidget: () => ipcRenderer.send('widget-close'),
  openWidget: () => ipcRenderer.send('widget-open'),
  resizeWidget: (width, height) => ipcRenderer.send('widget-resize', { width, height }),
  openMainWindow: () => ipcRenderer.send('open-main-window'),

  // Data sync between main window and widget window
  sendDataToWidget: (data) => ipcRenderer.send('sync-data-to-widget', data),
  sendDataToMain: (data) => ipcRenderer.send('sync-data-to-main', data),
  onDataSync: (callback) => ipcRenderer.on('data-synced', (_, data) => callback(data)),
  requestDataFromMain: () => ipcRenderer.send('request-data-from-main'),
  onDataRequest: (callback) => ipcRenderer.on('data-requested', (_, ) => callback()),

  // Platform detection
  platform: process.platform,
  isElectron: true
});
