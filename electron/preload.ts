import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

type RendererEventPayloads = {
  'menu-new-document': null;
  'menu-settings': null;
  'menu-backup-database': string;
  'menu-restore-database': string;
  'menu-database-info': null;
  'update-available': unknown;
  'update-download-progress': unknown;
  'update-downloaded': unknown;
  'update-error': string;
};

function onRendererEvent<K extends keyof RendererEventPayloads>(
  channel: K,
  callback: (payload: RendererEventPayloads[K]) => void,
): () => void {
  const listener = (_event: IpcRendererEvent, payload: RendererEventPayloads[K]) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const electronAPI = {
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath) as Promise<string>,
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('write-file', filePath, data) as Promise<void>,
  getAppInfo: () =>
    ipcRenderer.invoke('get-app-info') as Promise<{
      version: string;
      userDataPath: string;
      platform: string;
    }>,
  selectBackupDestination: (defaultPath?: string) =>
    ipcRenderer.invoke('select-backup-destination', defaultPath) as Promise<string | null>,
  selectRestoreSource: () => ipcRenderer.invoke('select-restore-source') as Promise<string | null>,
  onMenuNewDocument: (callback: () => void) => onRendererEvent('menu-new-document', callback),
  onMenuSettings: (callback: () => void) => onRendererEvent('menu-settings', callback),
  onMenuBackupDatabase: (callback: (filePath: string) => void) =>
    onRendererEvent('menu-backup-database', callback),
  onMenuRestoreDatabase: (callback: (filePath: string) => void) =>
    onRendererEvent('menu-restore-database', callback),
  onMenuDatabaseInfo: (callback: () => void) => onRendererEvent('menu-database-info', callback),
  onUpdateAvailable: (callback: (info: unknown) => void) => onRendererEvent('update-available', callback),
  onUpdateDownloadProgress: (callback: (progress: unknown) => void) =>
    onRendererEvent('update-download-progress', callback),
  onUpdateDownloaded: (callback: (info: unknown) => void) => onRendererEvent('update-downloaded', callback),
  onUpdateError: (callback: (message: string) => void) => onRendererEvent('update-error', callback),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
