const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to the renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Widget controls
  closeWidget: () => ipcRenderer.send('widget-close'),
  resizeWidget: (width, height) => ipcRenderer.send('widget-resize', { width, height }),
  openMainWindow: () => ipcRenderer.send('open-main-window'),

  // Platform detection
  platform: process.platform,
  isElectron: true
});
