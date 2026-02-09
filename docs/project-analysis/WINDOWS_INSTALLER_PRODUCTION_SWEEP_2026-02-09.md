# Windows Installer Production Sweep - 2026-02-09

## Scope

Review and harden the Windows desktop installer (`NSIS .exe`) path for production readiness, including:

- Guided installation UX
- Install location selection
- Progress and completion messaging
- Uninstall/data retention behavior
- First-run AI API key onboarding
- Validation and packaging reliability

## Existing Capabilities Confirmed

- NSIS target already configured in `electron-builder.yml`.
- Local mode API key management already implemented via:
  - `GET /api/local/api-keys/configured`
  - `POST /api/local/api-keys/:provider`
  - `DELETE /api/local/api-keys/:provider`
  - `POST /api/local/api-keys/test`
- Installer and uninstaller completion messages + data retention prompt available in `build/installer.nsh`.

## Findings (Code Review)

1. High: NSIS packaging failure caused by warning-as-error behavior.
   - Symptom: `makensis.exe` failed because label `keep_data` was treated as an unused label warning elevated to error.
   - Impact: `npm run build:win` could fail and block release artifact generation.
   - Resolution: removed the unused label path in custom uninstall flow (retained logic/UX intent).

2. Medium: Windows packaging validation was too shallow.
   - Symptom: `scripts/validate-wack.ts` checked targets/icons but not installer UX standards.
   - Impact: regressions in install directory chooser, shortcuts, custom NSIS include, or artifact naming could ship undetected.
   - Resolution: added explicit NSIS standards gate checks and custom installer macro/content checks.

3. Medium: Local-mode first-run API key setup discoverability was weak.
   - Symptom: no direct sidebar route entry to API keys; local mode banner lacked configured-key status and direct CTA.
   - Impact: friction for Windows users where API keys are the primary post-install requirement.
   - Resolution: added `AI API Keys` and `Local Settings` nav entries (desktop/mobile) and enhanced local-mode banner status + CTA.

## Changes Applied

- `electron-builder.yml`
  - Added/enforced NSIS settings: `allowElevation`, `perMachine`, `createStartMenuShortcut`, `shortcutName`, `runAfterFinish`.
- `scripts/validate-wack.ts`
  - Added strict checks for NSIS guided install behavior and artifact conventions.
  - Added checks for custom installer script presence and install/uninstall macro/message logic.
- `client/src/components/layout/sidebar.tsx`
  - Added Settings nav entry for `AI API Keys` and `Local Settings`.
- `client/src/components/layout/mobile-sidebar.tsx`
  - Added Settings nav entry for `AI API Keys` and `Local Settings`.
- `client/src/components/local-mode/LocalModeBanner.tsx`
  - Added configured AI-provider count from `/api/local/api-keys/configured`.
  - Added direct `AI API Keys` CTA button.
- Documentation updates:
  - `WINDOWS_GUIDE.md`
  - `docs/WINDOWS_DESKTOP_GUIDE.md`
  - `docs/DEPLOYMENT.md`
  - `README.md`

## Deep Bug/Error Sweep Evidence

Commands executed:

```powershell
npm run windows:validate
npm run check
npm run lint
npm run build:win
npm run test:run
```

Results:

- `windows:validate`: pass
- `check`: pass
- `lint`: pass (0 warnings)
- `build:win`: pass, produced `dist/packaging/CyberDocGen-Setup-2.4.0.exe`
- `test:run`: pass (`100` test files, `1162` tests passed, `4` skipped)

Known non-blocking runtime warnings observed in test output:

- React `act(...)` warning in specific test contexts
- jsdom `requestSubmit()` not implemented warnings
- expected auth/URL parsing noise in isolated test scenarios

## Operational TODO (Remaining)

1. Add Authenticode signing certificate in CI release job and enforce signed `.exe` artifacts.
2. Add publish-time check for `author` and `description` fields in `package.json` to eliminate electron-builder metadata warnings.
3. Run clean Windows 11 VM install/uninstall smoke with screenshots:
   - installer wizard pages
   - install completion dialog
   - first-launch API key setup screen
   - uninstall data-retention prompt
   - uninstall completion dialog
4. Capture SmartScreen behavior on unsigned vs signed builds and document release policy.
5. Add a small E2E desktop smoke script (or checklist) to verify:
   - app launch from Start Menu shortcut
   - local mode banner renders
   - API key save/read/delete roundtrip on Windows Credential Manager path.

## Commit

- `13478c9` - `feat: harden windows installer flow and local API-key onboarding`
