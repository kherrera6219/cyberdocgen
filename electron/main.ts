/**
 * Electron Main Process
 * Sprint 2-3: Desktop Integration, Hardening & Auto-Updates
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
 * - Auto-update mechanism (Sprint 3)
 */

import { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain, dialog } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { fork, ChildProcess } from 'child_process';
import { startupLogger } from './startup-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;

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
 * Start the backend server as a child process
 */
function startServer() {
  // Start new logging session
  startupLogger.startSession();
  startupLogger.info('=== STARTING SERVER STARTUP SEQUENCE ===');

  // Only start server in production (packaged) mode
  // In development, we run the server separately via npm run dev
  if (process.env.NODE_ENV === 'development') {
    startupLogger.info('Development mode detected, skipping server spawn');
    console.log('[Electron] Development mode detected, skipping server spawn');
    return;
  }

  try {
    startupLogger.info('Starting server in production mode');

    // In production, the server file is in app.asar.unpacked/dist/index.js
    // because we use asarUnpack in electron-builder.yml
    // __dirname when built is: resources/app.asar/dist/electron
    const serverPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.js')
      : path.join(__dirname, '../../dist/index.js');
    
    startupLogger.info('Server path resolution', {
      serverPath,
      __dirname,
      resourcesPath: process.resourcesPath,
      nodeEnv: process.env.NODE_ENV
    });

    console.log('[Electron] Starting backend server from:', serverPath);
    console.log('[Electron] __dirname:', __dirname);
    console.log('[Electron] process.resourcesPath:', process.resourcesPath);

    // Verify server file exists
    if (!fs.existsSync(serverPath)) {
      const error = `Server file not found at: ${serverPath}`;
      startupLogger.error('CRITICAL: Server file missing', { serverPath });
      console.error('[Electron] Server file not found at:', serverPath);
      dialog.showErrorBox('Startup Error', 'Critical component missing: Backend server file not found.');
      return;
    }

    startupLogger.info('Server file exists, preparing to fork');

    // Prepare environment variables
    const serverEnv = {
      ...process.env,
      PORT: '5231',
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      DEPLOYMENT_MODE: 'local',
      LOCAL_DATA_PATH: app.getPath('userData'),
    };

    startupLogger.info('Environment variables for server', {
      PORT: serverEnv.PORT,
      HOST: serverEnv.HOST,
      NODE_ENV: serverEnv.NODE_ENV,
      DEPLOYMENT_MODE: serverEnv.DEPLOYMENT_MODE,
      LOCAL_DATA_PATH: serverEnv.LOCAL_DATA_PATH,
    });

    // Fork the server process
    startupLogger.info('Forking server process...');
    
    serverProcess = fork(serverPath, [], {
      env: serverEnv,
      stdio: 'pipe', // Pipe output to parent to log it
      cwd: path.dirname(serverPath) // Set working directory to server directory
    });

    startupLogger.info('Fork initiated', {pid: serverProcess.pid});

    // Handle spawn event
    serverProcess.on('spawn', () => {
      startupLogger.info('Server process spawned successfully', {
        pid: serverProcess?.pid
      });
      console.log('[Electron] Backend server process spawned, PID:', serverProcess?.pid);
    });

    // Handle errors
    serverProcess.on('error', (err) => {
      startupLogger.error('Server process error', {
        error: err.message,
        stack: err.stack,
        code: (err as any).code
      });
      console.error('[Electron] Failed to start server process:', err);
    });

    // Handle exit
    serverProcess.on('exit', (code, signal) => {
      startupLogger.error('Server process exited', {
        exitCode: code,
        signal: signal,
        timestamp: new Date().toISOString()
      });
      console.log(`[Electron] Backend server exited with code ${code} and signal ${signal}`);
    });

    // Capture stdout from server
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        startupLogger.serverOutput(data);
        console.log(`[Server] ${data}`);
      });
    }

    // Capture stderr from server
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        startupLogger.serverError(data);
        console.error(`[Server Error] ${data}`);
      });
    }

    // Set timeout to detect if server hangs
    const startupTimeout = setTimeout(() => {
      startupLogger.warn('Server startup timeout - server did not start within 30 seconds', {
        pid: serverProcess?.pid,
        processRunning: serverProcess && !serverProcess.killed
      });
    }, 30000);

    // Clear timeout if server exits
    serverProcess.on('exit', () => {
      clearTimeout(startupTimeout);
    });

    startupLogger.info('Server startup sequence initiated successfully', {
      logPath: startupLogger.getLogPath()
    });

  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    };

    startupLogger.error('CRITICAL: Exception during server startup', errorDetails);
    console.error('[Electron] Error starting server:', error);
    
    dialog.showErrorBox(
      'Startup Error', 
      `Failed to start backend server: ${errorDetails.message}\n\nLog file: ${startupLogger.getLogPath()}`
    );
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

  // In production, wait a moment for server to start or retry
  if (!isDev) {
    // Attempt to load immediately, but implementing a simple retry logic via reload if failed could be added.
    // For now, relies on server starting reasonably quickly or the user refreshing.
    // A more robust approach would be to poll the health endpoint before loading, but standard loadURL usually works if server starts fast.
    setTimeout(() => {
        mainWindow?.loadURL(url).catch(e => {
            console.error('[Electron] Failed to load URL, retrying...', e);
            setTimeout(() => mainWindow?.loadURL(url), 2000);
        });
    }, 1000); // Give server 1s head start
  } else {
    mainWindow.loadURL(url);
  }

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
 * Setup auto-updater (Sprint 3)
 * Handles automatic application updates
 */
function setupAutoUpdater() {
  // Configure auto-updater
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Check for updates on startup (after 5 seconds)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);

  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000);

  // Handle update events
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Update not available:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    const message = `Downloaded ${progress.percent.toFixed(1)}%`;
    console.log('[AutoUpdater]', message);
    mainWindow?.webContents.send('update-download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    mainWindow?.webContents.send('update-downloaded', info);

    // Prompt user to restart
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded',
      detail: `Version ${info.version} will be installed when you restart the application. Restart now?`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error);
    mainWindow?.webContents.send('update-error', error.message);
  });
}

/**
 * Application lifecycle
 */
app.whenReady().then(() => {
  startServer();
  createWindow();
  createMenu();
  createTray();
  setupIpcHandlers();
  setupAutoUpdater();

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
  if (serverProcess) {
    console.log('[Electron] Killing backend server process');
    serverProcess.kill();
    serverProcess = null;
  }
});
