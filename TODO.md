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
- `npm run windows:evidence:validate` -> FAIL expected until clean-VM evidence bundle exists
- `npm audit --omit=dev` -> PASS (`0` vulnerabilities)
- `npm audit` -> PASS (`0` vulnerabilities)
- `DEPLOYMENT_MODE=cloud npm start` -> FAIL as expected without production secrets (`DATABASE_URL`, `SESSION_SECRET`)
- `npx vitest run tests/integration/connectors.test.ts tests/unit/connectorAdapters.test.ts tests/unit/metrics.test.ts` -> PASS (`30` tests)

## Recently Completed (2026-02-15)

- Connector endpoint rate limiting implemented (`connectorRead`, `connectorWrite`, `connectorImport`) and enforced on `/api/connectors` routes.
- External connector API responses now use runtime schema validation (SharePoint, Jira, Notion) instead of unsafe typed-cast assumptions.
- Connector latency/error telemetry added to centralized metrics collection (`trackConnectorRequest` + connector error-rate computation).
- Developer governance baseline completed with `.husky/pre-commit` (`lint` + `check`) and ADR system bootstrap (`docs/adr`).
- Documentation cleanup completed: removed generated inventory/log dump docs and stale dated evidence snapshots; retained runbooks and curated review artifacts.

## Outstanding Items

| ID | Item | Status | Latest Validation Evidence |
|---|---|---|---|
| WIN-01 | Run signed NSIS install/uninstall smoke on a clean Windows 11 VM and archive screenshots/logs | PARTIAL | Evidence validation tooling/runbook now exists (`docs/WINDOWS_RELEASE_EVIDENCE_GUIDE.md`, `npm run windows:evidence:validate`); clean-VM execution artifacts still pending |
| WIN-02 | Add Authenticode signing in CI/release pipeline and enforce signed `.exe` release artifacts | PARTIAL | Tag-gated Windows release job now performs signed build + Authenticode verification report upload, but live tag-run evidence is still pending |
| WIN-03 | Capture SmartScreen behavior (unsigned vs signed) and document release policy | PARTIAL | SmartScreen evidence requirements are now codified and validated via release evidence tooling; screenshots still pending |
| WIN-04 | Add desktop smoke automation/checklist for Start Menu launch and local API-key roundtrip | PARTIAL | Script + checklist added (`scripts/windows-desktop-smoke.ps1`, `docs/WINDOWS_DESKTOP_SMOKE_CHECKLIST.md`); clean-VM execution evidence still pending |
| CLOUD-01 | Complete cloud-mode validation in a production-like environment with required secrets/infrastructure | PARTIAL | Added strict cloud validation harness (`npm run cloud:validate`) and manual CI workflow (`.github/workflows/cloud-validation.yml`); production secret-backed execution evidence still pending |
| STORE-01 | Complete Microsoft Partner Center submission actions (identity/listing/upload/certification) | EXTERNAL | Requires Partner Center account operations outside repo automation |
| FB-01 | Complete Firebase project/secrets/deploy track | EXTERNAL | Requires Firebase project setup and operator-managed secrets/deployment |
