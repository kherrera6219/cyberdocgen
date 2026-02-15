# Windows Release Evidence Guide

Last Updated: February 15, 2026

This guide defines the minimum evidence bundle for Windows 11 release sign-off:

1. Signed installer/uninstaller clean-VM smoke results
2. SmartScreen behavior capture (unsigned vs signed)
3. Signature verification report for release executables

## Evidence Directory

Store each release bundle under:

```text
docs/project-analysis/evidence/windows-release/<release-id>/
```

Example:

```text
docs/project-analysis/evidence/windows-release/2026-02-15-v2.4.0/
```

## Required Files

- `signed-install.log`
- `signed-uninstall.log`
- `desktop-smoke-report.json`
- `signature-report.json`
- `screenshots/install-complete.png`
- `screenshots/uninstall-complete.png`
- `screenshots/start-menu-launch.png`
- `screenshots/smartscreen-unsigned.png`
- `screenshots/smartscreen-signed.png`

## Capture Workflow

1. Build signed artifact from CI tag release (`v*`) or local signed release pipeline.
2. Run install/uninstall on a clean Windows 11 VM and capture logs/screenshots.
3. Run desktop smoke script and save output:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-desktop-smoke.ps1 `
  -ReportPath .\docs\project-analysis\evidence\windows-release\<release-id>\desktop-smoke-report.json
```

4. Run signature verification and store output JSON as `signature-report.json`.
5. Capture SmartScreen screenshots for both unsigned and signed installer builds.

## Validate Evidence Bundle

Run:

```powershell
npm run windows:evidence:validate -- --evidence-root=.\docs\project-analysis\evidence\windows-release
```

The validator writes `evidence-manifest.json` in the target bundle and fails if required files are missing.

## Notes

- `WIN-01` completion requires real clean-VM execution artifacts.
- `WIN-03` completion requires both SmartScreen screenshots from equivalent installer versions.
- Keep artifact versions and filenames aligned with release tags for audit traceability.
