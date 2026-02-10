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

import { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain, dialog, utilityProcess } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { startupLogger } from './startup-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: Electron.UtilityProcess | null = null;
let serverProcessExited = false;
let serverProcessExitCode: number | null = null;
let serverStartupTimeoutHandle: NodeJS.Timeout | null = null;

// Configure local mode environment variables for the backend
// This must be done before the backend server starts
let currentServerPort = 5231;

startupLogger.info('Local mode configured', {
  userDataPath: app.getPath('userData'),
  initialPort: currentServerPort
});

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
    if (typeof requestedPath !== 'string' || requestedPath.trim().length === 0) {
      return false;
    }

    const resolved = path.resolve(requestedPath);
    const allowed = path.resolve(app.getPath('userData'));
    const relative = path.relative(allowed, resolved);

    // Prevent prefix-bypass paths like "...\\CyberDocGen2\\..."
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  } catch {
    return false;
  }
}

/**
 * Start the backend server as a child process
 */
async function startServer() {
  // Start new logging session
  startupLogger.startSession();
  startupLogger.info('=== STARTING SERVER STARTUP SEQUENCE ===');

  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    startupLogger.info('Development mode detected (not packaged), skipping server spawn');
    return;
  }

  // Phase 2.1: Orphaned Process Cleanup
  cleanupOrphanedProcesses();
  serverProcessExited = false;
  serverProcessExitCode = null;

  try {
    startupLogger.info('Starting server in production mode');

    // Phase 2.2: Find available port before starting
    try {
      currentServerPort = await findAvailablePort(5231);
      startupLogger.info(`Using port ${currentServerPort}`);
    } catch (e) {
      startupLogger.error('Failed to find an available port', { error: String(e) });
      dialog.showErrorBox('Startup Error', 'Could not find an available port to start the backend server.');
      return;
    }

    // In production, prefer the ASAR server bundle so dependency resolution
    // can access the full packaged node_modules graph.
    const unpackedServerPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.cjs');
    const asarServerPath = path.join(app.getAppPath(), 'dist', 'index.cjs');
    const serverPath = app.isPackaged
      ? (fs.existsSync(asarServerPath) ? asarServerPath : unpackedServerPath)
      : path.join(__dirname, '../../dist/index.cjs');
    
    startupLogger.info('Server path resolution', {
      serverPath,
      unpackedServerPath,
      asarServerPath,
      __dirname,
      appPath: app.getAppPath(),
      nodeEnv: process.env.NODE_ENV
    });

    // Verify server file exists (fs.existsSync works inside ASAR in Electron)
    if (!fs.existsSync(serverPath)) {
      startupLogger.error('CRITICAL: Server file missing', { serverPath });
      dialog.showErrorBox('Startup Error', 'Critical component missing: Backend server file not found.');
      return;
    }

    startupLogger.info('Server file exists, preparing to fork via utilityProcess');

    // Prepare environment variables
    const serverEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: currentServerPort.toString(),
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      DEPLOYMENT_MODE: 'local',
      LOCAL_DATA_PATH: app.getPath('userData'),
    };
    const packagedMigrationsPath = path.join(app.getAppPath(), 'dist', 'migrations', 'sqlite');
    if (fs.existsSync(packagedMigrationsPath)) {
      serverEnv.LOCAL_MIGRATIONS_PATH = packagedMigrationsPath;
    }

    startupLogger.info('Environment variables for server', {
      PORT: serverEnv.PORT,
      HOST: serverEnv.HOST,
      NODE_ENV: serverEnv.NODE_ENV,
      DEPLOYMENT_MODE: serverEnv.DEPLOYMENT_MODE,
      LOCAL_DATA_PATH: serverEnv.LOCAL_DATA_PATH,
      LOCAL_MIGRATIONS_PATH: serverEnv.LOCAL_MIGRATIONS_PATH || '(not configured)',
    });

    // Fork the server process using utilityProcess
    startupLogger.info('Forking server process via utilityProcess...');
    
    serverProcess = utilityProcess.fork(serverPath, [], {
      env: serverEnv,
      stdio: 'pipe',
    });

    startupLogger.info('UtilityProcess fork initiated', {pid: serverProcess.pid});
    
    // Write PID for orphan tracking
    if (serverProcess.pid) {
      try {
        const pidPath = path.join(app.getPath('userData'), 'server.pid');
        fs.writeFileSync(pidPath, serverProcess.pid.toString());
      } catch (e) {
        startupLogger.error('Failed to write PID file', { error: String(e) });
      }
    }

    // Handle process events
    // utilityProcess uses standard event emitter API
    
    serverProcess.on('exit', (code: number) => {
      serverProcessExited = true;
      serverProcessExitCode = typeof code === 'number' ? code : null;
      startupLogger.error('Server process exited', {
        exitCode: code,
        timestamp: new Date().toISOString()
      });
    });

    // Capture stdout from server
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data: Buffer) => {
        startupLogger.serverOutput(data.toString());
      });
    }

    // Capture stderr from server
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data: Buffer) => {
        startupLogger.serverError(data.toString());
      });
    }

    // Set timeout to detect if server hangs
    serverStartupTimeoutHandle = setTimeout(() => {
      startupLogger.warn('Server startup timeout - server did not start within 30 seconds', {
        pid: serverProcess?.pid
      });
    }, 30000);

    // Clear timeout if server exits
    serverProcess.on('exit', () => {
      if (serverStartupTimeoutHandle) {
        clearTimeout(serverStartupTimeoutHandle);
        serverStartupTimeoutHandle = null;
      }
    });

    startupLogger.info('Server startup sequence initiated successfully', {
      logPath: startupLogger.getLogPath(),
      port: currentServerPort
    });

  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    };

    startupLogger.error('CRITICAL: Exception during server startup', errorDetails);
    
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
  const url = isDev ? 'http://localhost:5000' : `http://127.0.0.1:${currentServerPort}`;

  // In production, wait for backend health check
  if (!isDev) {
    waitForBackend(url).then(() => {
      mainWindow?.loadURL(url).catch(e => {
        console.error('[Electron] Failed to load URL:', e);
      });
    }).catch(err => {
      startupLogger.error('Backend readiness check failed', { error: err.message });
      dialog.showErrorBox('Startup Error', `The application backend failed to start. Detail: ${err.message}`);
    });
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
  const autoUpdatesEnabled = process.env.ENABLE_AUTO_UPDATES?.toLowerCase() === 'true';
  if (!app.isPackaged || !autoUpdatesEnabled) {
    startupLogger.info('Auto-updater disabled (set ENABLE_AUTO_UPDATES=true in packaged builds to enable).');
    return;
  }

  // Configure auto-updater
  autoUpdater.logger = {
    info: (m: string) => startupLogger.info(`[AutoUpdater] ${m}`),
    warn: (m: string) => startupLogger.warn(`[AutoUpdater] ${m}`),
    error: (m: string) => startupLogger.error(`[AutoUpdater] ${m}`),
    debug: (m: string) => startupLogger.info(`[AutoUpdater] ${m}`),
  } as any;
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
    startupLogger.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    startupLogger.info(`Update available: ${info.version}`);
    mainWindow?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    startupLogger.info(`Update not available: ${info.version}`);
  });

  autoUpdater.on('download-progress', (progress) => {
    startupLogger.info(`Download progress: ${progress.percent.toFixed(1)}%`);
    mainWindow?.webContents.send('update-download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    startupLogger.info(`Update downloaded: ${info.version}`);
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
    startupLogger.error('AutoUpdater error', { error: error.message });
    mainWindow?.webContents.send('update-error', error.message);
  });
}

/**
 * Application lifecycle
 */
app.whenReady().then(async () => {
  await startServer();
  createWindow();
  createMenu();
  createTray();
  setupIpcHandlers();
  setupAutoUpdater();

  startupLogger.info('Application ready');
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
  startupLogger.info('Application shutting down');
  
  // Clean up PID file
  try {
    const pidPath = path.join(app.getPath('userData'), 'server.pid');
    if (fs.existsSync(pidPath)) {
      fs.unlinkSync(pidPath);
    }
  } catch {
    // Ignore cleanup errors for silent exit
  }

  if (serverProcess) {
    const pid = serverProcess.pid;
    startupLogger.info(`Killing backend server process: ${pid}`);
    serverProcess.kill();
    serverProcess = null;
  }
});

/**
 * Cleanup orphaned backend processes from previous crashes
 */
function cleanupOrphanedProcesses() {
  const pidPath = path.join(app.getPath('userData'), 'server.pid');
  if (fs.existsSync(pidPath)) {
    try {
      const data = fs.readFileSync(pidPath, 'utf8').trim();
      const oldPid = parseInt(data, 10);
      if (oldPid && !isNaN(oldPid)) {
        try {
          process.kill(oldPid, 0); // Check if process exists
          startupLogger.warn(
            `Potential orphan server process detected: ${oldPid}. ` +
            'Skipping forced termination to avoid PID-reuse killing of unrelated processes.',
          );
        } catch {
          // Process does not exist, which is fine
        }
      }
    } catch (error) {
      startupLogger.error('Error cleaning up orphans', { error: String(error) });
    }
    
    try { 
      fs.unlinkSync(pidPath); 
    } catch (rmErr) {
      startupLogger.warn('Failed to remove stale PID file', { error: String(rmErr) });
    }
  }
}

/**
 * Find an available port starting from basePort
 */
import { createServer } from 'http';

async function findAvailablePort(basePort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    const isAvailable = await new Promise<boolean>((resolve) => {
      const server = createServer();
      server.listen(port, '127.0.0.1');
      server.on('listening', () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => {
        resolve(false);
      });
    });

    if (isAvailable) return port;
  }
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
}

/**
 * Poll the backend health endpoint until it responds or times out
 */
async function waitForBackend(baseUrl: string, maxAttempts = 30): Promise<void> {
  startupLogger.info(`Polling backend readiness at ${baseUrl}/health...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        if (serverStartupTimeoutHandle) {
          clearTimeout(serverStartupTimeoutHandle);
          serverStartupTimeoutHandle = null;
        }
        startupLogger.info('Backend is ready!');
        return;
      }
    } catch (e) {
      // Not ready yet
    }
    
    // Check if process actually exited during startup.
    // UtilityProcess.pid can be undefined during initialization and should not be
    // treated as an immediate crash signal.
    if (serverProcessExited) {
      const exitSuffix =
        serverProcessExitCode === null ? '' : ` (exit code ${serverProcessExitCode})`;
      throw new Error(`Backend server process exited unexpectedly during startup${exitSuffix}.`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
  
  throw new Error('Timeout waiting for backend server to start.');
}
