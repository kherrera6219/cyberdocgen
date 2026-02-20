# CyberDocGen Outstanding TODO

**Last Verified:** February 20, 2026  
**Scope:** Outstanding and recently completed release-readiness tasks.

## Current Validation Evidence (2026-02-20)

- `npm run check` -> PASS
- `npm run lint` -> PASS
- `npm run test:run` -> PASS (`1558` passed, `4` skipped)
- `npm run test:run -- --coverage` -> PASS (`1558` passed, `4` skipped; global coverage `82.87%` statements/lines, `80.43%` functions, `78.16%` branches)
- `npm run build` -> PASS
- `npm run windows:validate` -> PASS
- `npm run windows:validate:store` -> PASS (non-strict local mode; missing `WINDOWS_STORE_*` values are warnings and APPX config fallback is allowed)
- `npm run windows:evidence:validate` -> PASS (non-strict mode; evidence manifest records `0` passed, `9` failed)
- `npm run windows:evidence:validate -- --strict` -> FAIL expected until clean-VM evidence bundle exists
- `npm run cloud:validate` -> PASS (non-strict mode; environment validation is skipped when secrets are absent)
- `npm run cloud:validate:strict` -> FAIL expected without production cloud secrets (`DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `DATA_INTEGRITY_SECRET`)
- `npm audit fix` -> PARTIAL (`package-lock.json` updated with non-breaking remediations)
- `npm audit --omit=dev` -> PASS (`0` vulnerabilities)
- `npm audit` -> PASS at configured gate (`audit-level=high`), with `17` moderate advisories still reported in dev/tooling dependency chains

## Recently Completed (2026-02-20)

- Full production gate sweep reconfirmed after dependency updates: `check`, `lint`, `test:run`, `test:run -- --coverage`, `build`, and `windows:validate`.
- Applied non-breaking dependency remediation with `npm audit fix` and validated no regressions in lint/typecheck/tests/build.
- Added strict/non-strict split for cloud validation (`cloud:validate` local, `cloud:validate:strict` CI/production-like).
- Updated Windows evidence validation to emit a manifest and succeed in non-strict mode while preserving strict failure mode.
- Closed internal code TODO in `server/services/databaseHealthService.ts` by returning table row-count estimates from `pg_stat_user_tables`.
- Debug and troubleshooting documentation updated for native SQLite ABI mismatch recovery (`better-sqlite3` Node vs Electron rebuild flow).

## Done vs Remaining

| Area | Status | Notes |
|---|---|---|
| Core quality gates | DONE | Local repo gates are passing (`check`, `lint`, `test:run`, `build`, `windows:validate`, `windows:validate:store`, `cloud:validate`) |
| Windows clean-VM evidence bundle | NOT DONE | Requires manual execution on clean signed-build VM and screenshot/log capture |
| Cloud strict validation with production secrets | NOT DONE | Requires production-like environment and managed secrets not available in local repo context |
| Dependency advisory elimination | PARTIAL | Runtime tree is clean (`npm audit --omit=dev`), but full dependency tree still reports `17` moderate advisories in dev/tooling chains |

## Remaining In-Code TODO Markers

| ID | Location | Status | Notes |
|---|---|---|---|
| CODE-01 | `server/services/ingestionService.ts` | OPEN | `extractCompanyProfile` merge into company profile persistence is still a placeholder |
| CODE-02 | `tests/integration/e2e-flows.test.ts` | OPEN | Evidence-to-control mapping auth test remains skipped because route/schema are not present |

## Outstanding Items

| ID | Item | Status | Latest Validation Evidence |
|---|---|---|---|
| WIN-01 | Run signed NSIS install/uninstall smoke on a clean Windows 11 VM and archive screenshots/logs | PARTIAL | Non-strict `npm run windows:evidence:validate` records missing signed install/uninstall logs and screenshots (9/9 evidence items currently missing) |
| WIN-02 | Add Authenticode signing in CI/release pipeline and enforce signed `.exe` release artifacts | PARTIAL | Tag-gated signed release flow exists; live tag-run evidence bundle still pending |
| WIN-03 | Capture SmartScreen behavior (unsigned vs signed) and document release policy | PARTIAL | Validation manifest expects both SmartScreen screenshots; both currently missing |
| WIN-04 | Run desktop smoke checklist on clean VM (Start Menu launch + local API-key roundtrip) and archive report | PARTIAL | `desktop-smoke-report.json` and launch screenshot still missing from evidence bundle |
| CLOUD-01 | Complete cloud-mode validation in a production-like environment with required secrets/infrastructure | PARTIAL | Local `npm run cloud:validate` passes in non-strict mode; `npm run cloud:validate:strict` still requires injected production secrets |
| SEC-01 | Resolve remaining `npm audit` advisories without regressions | PARTIAL | Runtime audit is clean (`npm audit --omit=dev`), but full `npm audit` still reports `17` moderate advisories in dev/tooling dependencies |
| STORE-01 | Complete Microsoft Partner Center submission actions (identity/listing/upload/certification) | EXTERNAL | Requires Partner Center account operations outside repo automation |
| FB-01 | Complete Firebase project/secrets/deploy track | EXTERNAL | Requires Firebase project setup and operator-managed secrets/deployment |
