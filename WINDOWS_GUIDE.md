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
- **Data Retention**: Prompts user to keep/remove data on uninstall.
- **ASAR Unpacking**: Critical native modules (`better-sqlite3`, `keytar`) are unpacked for reliable execution.

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
