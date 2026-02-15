# CyberDocGen Outstanding TODO

**Last Verified:** February 15, 2026  
**Scope:** Outstanding items only (completed items removed).

## Current Validation Evidence (2026-02-15)

- `npm run check` -> PASS
- `npm run lint` -> PASS
- `npm run windows:validate` -> PASS
- `npm run windows:validate:store` -> PASS (with valid `WINDOWS_STORE_*` values)
- `npm run test:run -- --coverage` -> PASS (`1532` passed, `4` skipped; global coverage `82.88%` statements, `80.35%` functions, `78.13%` branches)
- `npm run sweep:phase -- --timeout-ms=30000` -> PASS (`6` passed, `1` skipped cloud smoke due missing secrets)
- `npm audit --omit=dev` -> PASS (`0` vulnerabilities)
- `npm audit` -> PASS (`0` vulnerabilities)
- `DEPLOYMENT_MODE=cloud npm start` -> FAIL as expected without production secrets (`DATABASE_URL`, `SESSION_SECRET`)

## Outstanding Items

| ID | Item | Status | Latest Validation Evidence |
|---|---|---|---|
| WIN-01 | Run signed NSIS install/uninstall smoke on a clean Windows 11 VM and archive screenshots/logs | OPEN | No signed clean-VM evidence bundle found in active docs/evidence paths |
| WIN-02 | Add Authenticode signing in CI/release pipeline and enforce signed `.exe` release artifacts | PARTIAL | Tag-gated release policy + release-only signing enforcement (`RELEASE_FORCE_CODESIGN`) are in place, but a full signed artifact build + signature verification pipeline is still pending |
| WIN-03 | Capture SmartScreen behavior (unsigned vs signed) and document release policy | OPEN | Signing guidance exists, but no captured signed-vs-unsigned SmartScreen evidence is present |
| WIN-04 | Add desktop smoke automation/checklist for Start Menu launch and local API-key roundtrip | PARTIAL | Script + checklist added (`scripts/windows-desktop-smoke.ps1`, `docs/WINDOWS_DESKTOP_SMOKE_CHECKLIST.md`); clean-VM execution evidence still pending |
| CLOUD-01 | Complete cloud-mode validation in a production-like environment with required secrets/infrastructure | OPEN | Cloud start fails without required env (`DATABASE_URL`, `SESSION_SECRET`) |
| STORE-01 | Complete Microsoft Partner Center submission actions (identity/listing/upload/certification) | EXTERNAL | Requires Partner Center account operations outside repo automation |
| FB-01 | Complete Firebase project/secrets/deploy track | EXTERNAL | Requires Firebase project setup and operator-managed secrets/deployment |
