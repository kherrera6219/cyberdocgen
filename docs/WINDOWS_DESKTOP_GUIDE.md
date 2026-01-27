# Windows Desktop Deployment Guide

**Version 2.4.0** | January 2026

CyberDocGen includes a native Windows Desktop application powered by Electron. This build is designed for **offline-first, local-only usage** or isolated environments where a cloud PostgreSQL instance is not available.

## Architecture

The Windows Desktop build (`npm run build:win`) differs from the Cloud Deployment in two critical ways:

### 1. Embedded Persistence (SQLite)
Instead of connecting to an external PostgreSQL database defined by `DATABASE_URL`:
- The application automatically initializes a local **SQLite** database.
- Database File Location: `C:\Users\%USERNAME%\AppData\Roaming\CyberDocGen\cyberdocgen.db` (or `local-data/` in dev mode).
- **No configuration required**: The app detects "Local Mode" and handles migrations automatically.

### 2. Authentication Bypass (Local Admin)
Since there is no Cloud SSO (Google/Microsoft) in an offline environment:
- The application automatically logs you in as a **"Local Admin"**.
- No password is required.
- You have full access to all features instantly.

---

## Building the Installer

To create the `.exe` installer (NSIS) and portable executable:

### Prerequisites
- Node.js 20+
- Git
- Windows 10 or 11

### Build Command
Run the following terminal command from the project root:

```powershell
npm run build:win
```

This pipeline performs the following:
1.  **Vite Build**: Compiles the React frontend.
2.  **Server Bundle**: Bundles the Node.js backend using `esbuild`.
3.  **Electron Build**: Compiles the main process.
4.  **Packaging**: Uses `electron-builder` to package binaries and creating the installer.

**Output Location**: `./dist/`
- `CyberDocGen Setup 2.4.0.exe` (Installer)
- `win-unpacked/` (Portable executable for testing)

---

## Installation & Running

1.  Navigate to `dist/`.
2.  Run `CyberDocGen Setup 2.4.0.exe`.
3.  The application will install to `AppData\Local\Programs\cyberdocgen`.
4.  It will launch automatically.
5.  **First Run**: You might see a blank screen for 3-5 seconds while the embedded backend server boots up and initializes the SQLite database.

---

## Troubleshooting

### "Application shows a blank white screen"
- This usually means the backend server failed to start.
- Check the logs in `C:\Users\%USERNAME%\AppData\Roaming\CyberDocGen\logs\`.
- Ensure port `5000` is not occupied. The internal server tries to bind to port 5000.

### "Database Error" or "Missing Table"
- If the database schema changes, the local SQLite file might be incompatible.
- **Fix**: Delete `C:\Users\%USERNAME%\AppData\Roaming\CyberDocGen\cyberdocgen.db` and restart the app to recreate a fresh database.

### Build Fails with "winCodeSign" error
- This is a known issue with `electron-builder` cache on some systems.
- **Fix**: Run the build with a custom cache directory:
  ```powershell
  $env:ELECTRON_BUILDER_CACHE="c:\software\cyberdocgen\.cache"; npm run build:win
  ```
