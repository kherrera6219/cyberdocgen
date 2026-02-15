# Windows Desktop Smoke Checklist

Last Updated: February 15, 2026

This checklist validates Windows 11 desktop installer behavior after a fresh install, with emphasis on:

- Start Menu launch readiness
- Local runtime health (`/live`, `/ready`)
- Local API key save/delete roundtrip (`/api/local/api-keys/*`)

## Preconditions

1. Install CyberDocGen via NSIS installer on a clean Windows 11 VM.
2. Confirm local-mode runtime is expected (`DEPLOYMENT_MODE=local` in packaged desktop behavior).
3. Ensure TCP port `5000` is available (or adjust script `-BaseUrl`).

## Automated Smoke Run

Run from repository root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-desktop-smoke.ps1
```

Optional flags:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-desktop-smoke.ps1 `
  -BaseUrl "http://127.0.0.1:5000" `
  -Provider "openai" `
  -ApiKey "sk-smoketest-abcdefghijklmnopqrstuvwxyz1234567890" `
  -StartupTimeoutSec 120 `
  -KeepApiKey
```

## Expected Passing Checks

1. `Start Menu Shortcut` is found.
2. App launches from installed path or shortcut.
3. Health endpoints `/live` and `/ready` become reachable.
4. API key save endpoint succeeds.
5. Configured provider list endpoint is reachable.
6. API key delete endpoint succeeds (unless `-KeepApiKey`).

## Artifacts

Each run writes a JSON report to:

```text
artifacts/windows-desktop-smoke/report-<timestamp>.json
```

Archive this report with installer logs/screenshots for release evidence bundles.
