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
npm run build:msix
```

_Note: The script name `build:msix` is legacy; it now builds an NSIS installer based on the updated `electron-builder.yml` configuration._

### 2. Manual Build Steps (Troubleshooting)

If the standard build fails, you can run the steps individually:

1. **Build Frontend**:

   ```powershell
   npm run build
   ```

2. **Build Electron Main Process**:

   ```powershell
   npm run electron:build
   ```

3. **Package for Windows**:
   ```powershell
   npx electron-builder build --win nsis
   ```

## Configuration Details

### `electron-builder.yml`

The configuration has been updated for local deployment:

- **Target**: `nsis` (Standard Windows Installer)
- **Identity**: Placeholder identity used (not signed for Store)
- **Icon**: Uses `node_modules/app-builder-lib/templates/icons/proton-native/proton-native.ico` as a fallback if custom branding is missing.

### Local Cache Workaround

If you encounter permission errors during the `winCodeSign` download/extraction step (common on some Windows environments), use a local cache directory:

```powershell
# Set cache to a local directory
$env:ELECTRON_BUILDER_CACHE="c:\software\cyberdocgen\.cache"

# Run build
npx electron-builder build --win nsis
```

## Output

The generated installer is located at:
`dist/packaging/CyberDocGen-Setup-2.0.1.exe`
