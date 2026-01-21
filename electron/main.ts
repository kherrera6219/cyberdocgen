/**
 * Electron Main Process
 * Sprint 2: Desktop Integration & Hardening
 *
 * Security features:
 * - Content Security Policy
 * - IPC validation
 * - Localhost binding verification
 * - Path traversal prevention
 *
 * Desktop features:
 * - Window state persistence
 * - Native menus and shortcuts
 * - System tray integration
 */

import { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Configure local mode environment variables for the backend
// This must be done before the backend server starts
process.env.DEPLOYMENT_MODE = 'local';
process.env.LOCAL_DATA_PATH = app.getPath('userData');
process.env.LOCAL_PORT = '5231';

console.log('[Electron] Local mode configured');
console.log('[Electron] User data path:', app.getPath('userData'));

// Window state persistence
interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const defaultWindowState: WindowState = {
  width: 1400,
  height: 900,
  isMaximized: false,
};

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  try {
    const statePath = getWindowStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf8');
      return { ...defaultWindowState, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('[Electron] Failed to load window state:', error);
  }
  return defaultWindowState;
}

function saveWindowState(state: WindowState): void {
  try {
    const statePath = getWindowStatePath();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('[Electron] Failed to save window state:', error);
  }
}

/**
 * Path validation to prevent directory traversal attacks
 */
function isPathSafe(requestedPath: string): boolean {
  try {
    const resolved = path.resolve(requestedPath);
    const allowed = path.resolve(app.getPath('userData'));
    return resolved.startsWith(allowed);
  } catch {
    return false;
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 1024,
    minHeight: 768,
    title: 'CyberDocGen',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      // Security: Content Security Policy
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, '../../public/favicon.ico'),
    show: false, // Show after ready-to-show for smoother UX
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    if (windowState.isMaximized) {
      mainWindow?.maximize();
    }
    mainWindow?.show();
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http://127.0.0.1:5231; " +
          "img-src 'self' data: file:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:5000' : 'http://127.0.0.1:5231';

  mainWindow.loadURL(url);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Security: Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Security: Prevent navigation away from allowed URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
      event.preventDefault();
      console.warn('[Electron] Blocked navigation to:', url);
    }
  });

  // Save window state on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      saveWindowState({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized(),
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Create native application menu
 */
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Document',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-document');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Database',
      submenu: [
        {
          label: 'Backup Database',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow!, {
              title: 'Save Database Backup',
              defaultPath: `cyberdocgen-backup-${new Date().toISOString().split('T')[0]}.db`,
              filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send('menu-backup-database', result.filePath);
            }
          }
        },
        {
          label: 'Restore Database',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              title: 'Restore Database Backup',
              filters: [
                { name: 'Database Files', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
              ],
              properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-restore-database', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Database Information',
          click: () => {
            mainWindow?.webContents.send('menu-database-info');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://docs.cyberdocgen.com');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/cyberdocgen/cyberdocgen/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About CyberDocGen',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About CyberDocGen',
              message: 'CyberDocGen',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode: ${process.versions.node}\n\nLocal Mode - All data stored securely on your computer.`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create system tray
 */
function createTray() {
  // Create icon for tray (using a simple colored square as fallback)
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('CyberDocGen');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open CyberDocGen',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Show/hide window on tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

/**
 * Setup secure IPC handlers
 */
function setupIpcHandlers() {
  // Read file with path validation
  ipcMain.handle('read-file', async (event, filePath: string) => {
    if (!isPathSafe(filePath)) {
      throw new Error('Invalid file path: access denied');
    }
    return fs.promises.readFile(filePath, 'utf8');
  });

  // Write file with path validation
  ipcMain.handle('write-file', async (event, filePath: string, data: string) => {
    if (!isPathSafe(filePath)) {
      throw new Error('Invalid file path: access denied');
    }
    return fs.promises.writeFile(filePath, data, 'utf8');
  });

  // Get app info
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      userDataPath: app.getPath('userData'),
      platform: process.platform,
    };
  });
}

/**
 * Application lifecycle
 */
app.whenReady().then(() => {
  createWindow();
  createMenu();
  createTray();
  setupIpcHandlers();

  console.log('[Electron] Application ready');
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in dock
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Graceful shutdown
app.on('before-quit', () => {
  console.log('[Electron] Application shutting down');
});
