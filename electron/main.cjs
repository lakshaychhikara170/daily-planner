const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, shell, nativeImage } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

let mainWindow = null;
let widgetWindow = null;
let tray = null;

// ─── Main Window ──────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: !isDev
    },
    autoHideMenuBar: true,
    backgroundColor: '#0A0A0A',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '../public/icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Sticky Widget Window ─────────────────────────────────────────────────────
function createWidgetWindow() {
  // Get primary display bounds
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 300,
    height: 480,
    x: width - 320,
    y: height - 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: !isDev
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minWidth: 260,
    minHeight: 300,
    show: false,
    hasShadow: true,
    type: process.platform === 'linux' ? 'toolbar' : 'panel',
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Load the widget route
  if (isDev) {
    widgetWindow.loadURL('http://localhost:5173/#/widget');
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/widget' });
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  // Keep widget on top even above other always-on-top windows
  widgetWindow.setAlwaysOnTop(true, 'screen-saver');
}

function toggleWidget() {
  if (!widgetWindow) {
    createWidgetWindow();
    widgetWindow.show();
  } else if (widgetWindow.isVisible()) {
    widgetWindow.hide();
  } else {
    widgetWindow.show();
    widgetWindow.focus();
  }
}

// ─── System Tray ─────────────────────────────────────────────────────────────
function createTray() {
  // Use a small icon — fallback to empty image if icon missing
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(path.join(__dirname, '../public/icon.png')).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Execute Pro');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Execute Pro',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: 'Toggle Sticky Widget (Ctrl+Shift+W)',
      click: toggleWidget
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('widget-close', () => {
  if (widgetWindow) widgetWindow.hide();
});

ipcMain.on('widget-open', () => {
  toggleWidget();
});

ipcMain.on('widget-resize', (_, { width, height }) => {
  if (widgetWindow) widgetWindow.setSize(width, height);
});

ipcMain.on('open-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
});

// ─── App Ready ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Enforce single instance
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  createMainWindow();
  createTray();

  // Global shortcut to toggle widget
  globalShortcut.register('CommandOrControl+Shift+W', toggleWidget);

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// ─── Window close → minimize to tray ─────────────────────────────────────────
app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray — don't quit
    // app.quit() is only called explicitly from tray menu
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
