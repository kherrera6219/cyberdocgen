# Windows Desktop Deployment Guide

**Version 2.4.0** | February 2026

CyberDocGen includes a native Windows Desktop application powered by Electron. This build is designed for **offline-first, local-only usage** or isolated environments where a cloud PostgreSQL instance is not available.

## Architecture

The Windows Desktop build (`npm run build:win`) differs from the Cloud Deployment in two critical ways:

### 1. Embedded Persistence (SQLite)
Instead of connecting to an external PostgreSQL database defined by `DATABASE_URL`:
- The application automatically initializes a local **SQLite** database.
- Database File Location: `C:\Users\%USERNAME%\AppData\Roaming\CyberDocGen\cyberdocgen.db` (or `local-data/` in dev mode).
- **No configuration required**: The app detects "Local Mode" and handles migrations automatically.

### 2. Authentication Bypass (Seamless Entry)
Since there is no Cloud SSO (Google/Microsoft) in an offline environment:
- The application implements a seamless login bypass for local mode.
- Users are automatically recognized as **"Local Admin"**.
- Clicking "Sign In" or "Login" navigates directly to the dashboard, providing a frictionless experience.

### 3. Process Management & Hardening
- **Orphan Cleanup**: Stale backend processes from previous crashes are automatically terminated on startup.
- **Dynamic Porting**: The backend automatically binds to an available port (starting at `5231`) to avoid conflicts.
- **Health Polling**: The UI waits for a successful `/health` check before loading, ensuring the server is ready.

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
1.  **Windows Validation**: Verifies Electron packaging config and Windows build assets.
2.  **Vite Build**: Compiles the React frontend.
3.  **Server Bundle**: Bundles the Node.js backend to `.cjs` for ASAR compatibility.
4.  **Electron Build**: Compiles the main process.
5.  **Packaging**: Uses `electron-builder` with custom NSIS scripts for data retention choices.

Optional post-build verification:

```powershell
node scripts/verify-build.js
```

**Output Location**: `./dist/packaging/`
- `CyberDocGen-Setup-<version>.exe` (Installer)
- `win-unpacked/` (Portable executable for testing)

---

## Installation & Running

1.  Navigate to `dist/packaging/`.
2.  Run `CyberDocGen-Setup-<version>.exe`.
3.  The application will install to `AppData\Local\Programs\cyberdocgen`.
4.  **Uninstall**: During uninstallation, you will be prompted to either keep or remove your application data (database, documents, settings).

---

## Troubleshooting

### "Application shows a blank white screen"
- This usually means the backend server failed to start or initialization is taking longer than usual.
- Check the robust startup logs: `%APPDATA%\Roaming\CyberDocGen\logs\startup.log`.
- Run `node scripts/diagnostic.js` to verify environment health.

### "Port Conflict"
- The app automatically attempts to find an available port starting from `5231`. Ensure your firewall allows local loopback traffic on this range.

### "Database Error" or "Missing Table"
- If the database schema changes significantly, the local SQLite file might be incompatible.
- **Fix**: Delete `%APPDATA%\Roaming\CyberDocGen\cyberdocgen.db` and restart the app to recreate a fresh database.
