# Microsoft Store Submission Guide - CyberDocGen

**Version:** 2.4.0  
**Last Updated:** February 14, 2026

## Overview

CyberDocGen supports two Windows distribution channels:

1. `NSIS (.exe)` for direct distribution.
2. `APPX (.appx)` for Microsoft Store submission.

For Microsoft Store submission, use the APPX path (`build:store`) unless your Partner Center workflow explicitly uses Win32 EXE ingestion.

## Prerequisites

- Windows 11 (x64)
- Node.js 20+
- Microsoft Partner Center app reservation
- Partner Center identity metadata:
  - `Identity Name`
  - `Publisher` (CN=...)
  - `Publisher Display Name`

## Store Build Configuration

`electron-builder.yml` is configured with:

- `win.target`: `nsis`, `appx`
- `appx` defaults for identity/publisher metadata
- Store identity values are injected by `scripts/build-store.ts` from `WINDOWS_STORE_*` environment variables

## Build and Validate APPX

Set Partner Center values in environment variables:

```powershell
$env:WINDOWS_STORE_IDENTITY_NAME="YourPartnerCenterIdentityName"
$env:WINDOWS_STORE_PUBLISHER="CN=YourPartnerCenterPublisher"
$env:WINDOWS_STORE_PUBLISHER_DISPLAY_NAME="Your Company Name"
```

Run Store validation and build:

```powershell
npm run windows:validate:store
npm run build:store
```

Expected artifact:

- `dist/packaging/CyberDocGen-Store-<version>.appx`

## Optional Win32 EXE Submission Path

If submitting the Win32 installer instead of APPX, use:

```powershell
npm run windows:validate
npm run build:win
```

Expected artifact:

- `dist/packaging/CyberDocGen-Setup-<version>.exe`

Silent commands required for Store automation:

- Install: `CyberDocGen-Setup-<version>.exe /S`
- Uninstall: `"Uninstall CyberDocGen.exe" /S`

Notes:

- Interactive NSIS mode shows install/uninstall progress pages and completion dialogs.
- Silent NSIS mode suppresses wizard, progress dialogs, and completion dialogs by design.

## Runtime Policy for Store Packages

- Electron auto-updater is disabled for Microsoft Store builds (`process.windowsStore === true`).
- Microsoft Store update delivery is the update mechanism for APPX-distributed builds.

## Partner Center Submission Steps

1. Reserve app name in Partner Center.
2. Confirm identity values in Product Identity.
3. Build APPX with the exact Partner Center identity values.
4. Upload package in Partner Center.
5. Complete listing metadata (description, privacy URL, screenshots, age rating).
6. Submit for certification.

## Local Validation Scope

`scripts/validate-wack.ts` validates:

- NSIS installer/uninstaller UX requirements
- NSIS progress macros and uninstall registration semantics
- APPX target and required identity metadata
- Store-mode env variables and identity format checks
- Store-safe runtime guard (`windowsStore` logic in Electron main process)

## Troubleshooting

**Validation fails for missing Store env vars**

- Ensure `WINDOWS_STORE_IDENTITY_NAME`, `WINDOWS_STORE_PUBLISHER`, and `WINDOWS_STORE_PUBLISHER_DISPLAY_NAME` are set before running `windows:validate:store`.

**Publisher format error**

- `WINDOWS_STORE_PUBLISHER` must start with `CN=` and match Partner Center exactly.

**No APPX artifact generated**

- Re-run `npm run build:store` after a successful `npm run windows:validate:store`.
