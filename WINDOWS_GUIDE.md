# CyberDocGen - Windows Build Guide

## Overview

This guide documents how to build the local Windows installer (`.exe`) for CyberDocGen. This process generates an NSIS installer that sets up a standalone version of the application with a local SQLite database.

## Prerequisites

- Node.js (v20+)
- NPM
- Windows 11 (x64) environment

## Build Instructions

### 1. Standard Build

To build the installer, run:

```powershell
npm run build:win
```

This command now runs Windows packaging validation first (`npm run windows:validate`) before compiling and packaging.

> Note: Running the installer with `/S` performs a silent install. Silent mode does not show installer wizard pages, progress bars, or completion message dialogs.

### 2. Manual Build Steps (Troubleshooting)

If the standard build fails, you can run the steps individually:

1. **Build Frontend**:
   ```powershell
   npm run build
   ```

2. **Build Backend Server**:
   ```powershell
   node scripts/build-server.js
   ```

3. **Build Electron Main Process**:
   ```powershell
   npm run electron:build
   ```

4. **Package for Windows**:
   ```powershell
   npx electron-builder build --win nsis
   ```

## Configuration Details

### `electron-builder.yml`
The configuration has been hardened for production:
- **Target**: `nsis` (Standard Windows Installer)
- **Guided Installer UX**: `oneClick: false` (wizard flow with install progress page)
- **Install Location Selection**: `allowToChangeInstallationDirectory: true`
- **Shortcuts**: Desktop + Start Menu shortcuts are created by default
- **Post-Install Launch**: `runAfterFinish: true`
- **Versioned Artifacts**: `CyberDocGen-Setup-<version>.exe`
- **Data Retention**: Prompts user to keep/remove data on uninstall.
- **ASAR Unpacking**: Critical native modules (`better-sqlite3`, `keytar`) are unpacked for reliable execution.
- **Custom NSIS Hooks**: `build/installer.nsh` provides install/uninstall completion notifications and data retention prompts.

## First-Run Requirements

No cloud database or server configuration is required for Windows local mode. After installation, users only need to configure AI provider API keys inside the app:

- OpenAI
- Anthropic
- Google AI

The API key management screen is available under **Settings -> AI API Keys**.

Auto-update checks are disabled by default for local desktop distributions to prevent noisy "No published versions" startup errors. To enable auto-updates in packaged builds, set:

```powershell
ENABLE_AUTO_UPDATES=true
```

## Uninstall Behavior

The generated NSIS uninstaller includes:

- Standard uninstall progress page
- Prompt to keep or remove `%APPDATA%\CyberDocGen` and `%LOCALAPPDATA%\CyberDocGen`
- Explicit completion notification when uninstall finishes

## Local Security Guardrails

- Local backup/restore endpoints now validate `.db` paths and restrict operations to the application data directory or the current user's profile directory.
- API key test/save endpoints validate provider IDs and key formats before storage.
- OpenAI key validation calls use request timeouts to prevent long-hanging local API requests.

## Troubleshooting & Diagnostics

If the packaged application fails to start:
1. Run the native diagnostic tool:
   ```powershell
   node scripts/diagnostic.js
   ```
2. Check the detailed startup logs:
   `%APPDATA%/CyberDocGen/logs/startup.log`

## Output
The generated installer is located at:
`dist/packaging/CyberDocGen-Setup-<version>.exe` (for example, `CyberDocGen-Setup-2.4.0.exe`)

## Local Artifact Hygiene

- Local/dev runs may generate SQLite and runtime artifacts in `local-data/`.
- `local-data/` is ignored by Git and should not be committed.
