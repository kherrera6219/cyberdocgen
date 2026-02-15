export {};

declare global {
  interface ElectronAPI {
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, data: string): Promise<void>;
    getAppInfo(): Promise<{
      version: string;
      userDataPath: string;
      platform: string;
    }>;
    selectBackupDestination(defaultPath?: string): Promise<string | null>;
    selectRestoreSource(): Promise<string | null>;
    onMenuNewDocument(callback: () => void): () => void;
    onMenuSettings(callback: () => void): () => void;
    onMenuBackupDatabase(callback: (filePath: string) => void): () => void;
    onMenuRestoreDatabase(callback: (filePath: string) => void): () => void;
    onMenuDatabaseInfo(callback: () => void): () => void;
    onUpdateAvailable(callback: (info: unknown) => void): () => void;
    onUpdateDownloadProgress(callback: (progress: unknown) => void): () => void;
    onUpdateDownloaded(callback: (info: unknown) => void): () => void;
    onUpdateError(callback: (message: string) => void): () => void;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
