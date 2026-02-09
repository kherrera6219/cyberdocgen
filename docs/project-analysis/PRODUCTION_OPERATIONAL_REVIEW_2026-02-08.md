# CyberDocGen Production Operational Review

**Date:** February 8, 2026  
**Scope:** architecture deep dive, folder-level analysis, production code review, bug sweep, error sweep, Windows setup review, operational TODO creation.

## 1. Executive Outcome

CyberDocGen is a **production candidate** with all core quality gates passing and production runtime dependencies now clean.

### Gate Results

- `npm run check`: **PASS**
- `npm run lint`: **PASS** (0 errors, 133 warnings)
- `npm run test:run`: **PASS** (100 files; 1162 passing, 4 skipped)
- `npm run build`: **PASS**
- `npm run windows:validate`: **PASS** (NSIS-configured path validated; MSIX optional)
- `npm run build:win`: **PASS** (NSIS installer produced at `dist/packaging/CyberDocGen-Setup-2.4.0.exe`)
- `npm run start` (local mode): **PASS** (`/live`, `/ready`, `/metrics`, `/api/auth/user` => HTTP 200)
- `node scripts/verify-build.js`: **PASS** (deterministic `/live` + `/ready` startup probes and build artifact checks)
- `npm audit --omit=dev`: **PASS** (0 vulnerabilities)
- `npm audit`: **FAIL** (4 moderate vulnerabilities, dev-tooling only)
- `DEPLOYMENT_MODE=cloud npm start` without cloud env: **FAIL as expected** (`DATABASE_URL` required)
- Evidence bundle archived at `docs/project-analysis/evidence/20260208-130320/`

## 2. What Was Remediated

### Dependency and Security Remediation

- Upgraded and aligned dependency tree:
  - `@google-cloud/storage` -> `^7.19.0`
  - `minimatch` -> `^10.1.2`
  - `drizzle-kit` -> `^0.31.8`
- Production dependency audit now reports zero vulnerabilities.
- Enforced CSRF secret handling and tightened temporary-auth exposure in non-production only flows.

### Runtime and Local-Mode Correctness

- Fixed local-mode identity mismatch by aligning synthetic local auth user/tenant IDs with seeded SQLite IDs (`server/providers/auth/localBypass.ts`).
- Added SQLite schema parity migration logic for missing runtime columns/tables (`server/providers/db/sqlite.ts`), including:
  - user profile/auth columns required by current shared schema
  - audit log columns used by audit chaining
  - `document_approvals` table used by control routes
- Fixed local-mode audit persistence failure (`gen_random_uuid` path) by explicitly providing audit IDs (`server/services/auditService.ts`).
- Fixed controls approval route to accept string IDs (schema-compatible), removing numeric-only assumption (`server/routes/controls.ts`).
- Fixed connector tenancy enforcement by binding connector list/create/import operations to authenticated organization context (`server/routes/connectors.ts`, `server/services/connectorService.ts`).
- Fixed evidence listing filter behavior so `snapshotId` is now applied at query level (`server/routes/evidence.ts`).
- Implemented real connector adapter flows for SharePoint (Microsoft Graph), Jira REST API, and Notion API (`server/services/connectorService.ts`).
- Added connector import unit tests for tenant scoping, snapshot requirement, text extension handling, and binary extension preservation (`tests/unit/connectorService.test.ts`).
- Fixed async post-unmount state update path in temporary login/logout UI to eliminate teardown-time unhandled rejections (`client/src/components/TemporaryLoginDialog.tsx`).
- Fixed `scripts/verify-build.js` to run deterministic health-probe startup checks with proper pass/fail behavior and exit codes.

### Observability and Route Validation

- Expanded known-route map in `server/middleware/routeValidation.ts` to reduce false “unknown API route” warnings:
  - `/metrics`
  - `/api/ai/stats`
  - `/api/evidence`, `/api/evidence/*`
  - `/api/controls/*`
  - `/api/auditor/*`
  - `/api/gap-analysis` and `/api/gap-analysis/*`
  - `/api/company-profiles/*` for `PATCH`
  - `/api/audit-trail` root path

### Windows Setup and Packaging

- Reworked Windows validator (`scripts/validate-wack.ts`) to match real packaging behavior:
  - accepts NSIS-only configuration
  - validates optional MSIX path only when configured
  - checks `build:win` script wiring and required Windows icon assets
- Updated compliance checker (`scripts/validate-compliance.ts`) to validate Windows packaging targets as NSIS/MSIX instead of MSIX-only assumptions.
- Added `windows:validate` npm script and inserted it into `build:win` preflight.
- Updated Windows docs to use version-agnostic installer naming (`CyberDocGen-Setup-<version>.exe`).

## 3. How the App Works

### Runtime Modes

- `server/config/runtime.ts` selects:
  - **cloud**: Postgres + cloud storage + Entra auth + multi-tenant features
  - **local**: SQLite + filesystem storage + auth bypass + localhost-only bind

### Backend Boot Flow

1. `server/index.ts` validates env and runtime config.
2. Provider factory initializes DB/storage/secrets/auth providers.
3. DB connect + migrate + health checks run.
4. MCP tools/agents initialize.
5. Routes and middleware register through `server/routes.ts`.
6. Production serves `dist/public`; local mode binds to `127.0.0.1`.

### Frontend Flow

- `client/src/App.tsx` initializes providers, auth query flows, and lazy-loaded domain routes (dashboard, documents, frameworks, AI, integrations, evidence, audit).

## 4. Deep Dive by Folder

### `client/`

- React + TypeScript SPA with route-splitting and large domain coverage (framework workflows, AI generation, evidence, repository analysis).
- Main technical debt now concentrated in lint-warning backlog (security plugin and hook-compatibility warnings).

### `server/`

- Modular Express architecture with strong separation: middleware, routes, services, providers, and MCP subsystem.
- Local/cloud split is functional but requires continued schema parity governance for SQLite mode.

### `shared/`

- Central schema/types contract for both app tiers; schema drift against local SQLite was a key issue remediated in this sweep.

### `tests/`

- 100 test files with broad unit/integration/component coverage.
- Remaining test output noise is mostly harness-related (jsdom `requestSubmit`, relative URL fetch behavior), not failing assertions.

### `docs/`, `scripts/`, `k8s/`, `monitoring/`

- Operational docs and manifests are comprehensive; this review updated stale production/security status references.

## 5. Production Code Review Findings (Open)

### High

1. **Dev-toolchain advisories are accepted risk (temporary)**  
   - `npm audit` reports 4 moderate vulnerabilities in the `drizzle-kit` -> `@esbuild-kit/*` -> `esbuild` chain.
   - Decision and controls are documented in `docs/project-analysis/DEV_TOOLCHAIN_ADVISORY_DECISION_2026-02-08.md`.

### Medium

1. **Lint warning backlog still significant**  
   - `npm run lint` has 133 warnings (0 errors), mostly security plugin findings and hook compatibility warnings.
   - Warning volume can still hide true regressions in future reviews.

2. **Cloud-mode validation is environment-gated**  
   - Cloud startup correctly fails without `DATABASE_URL`; full cloud runbook validation still requires complete production-like env.

3. **Windows release sign-off evidence still pending**  
   - NSIS build succeeds locally, but final distribution evidence still needs clean-VM install/startup logs and screenshots.

### Low

4. **Test harness warning noise remains**  
   - jsdom `requestSubmit` warnings and relative-URL fetch warnings appear during component/accessibility runs.
   - Does not currently fail gates but reduces signal quality.

## 6. Operational TODO (Prioritized)

### P0

- Archive gate evidence artifacts (`check`, `lint`, `test:run`, `build`, `start`, `audit`) for release audit trail.

### P1

- Reduce lint warnings (133 -> lower) with priority on security warnings in high-churn modules.
- Add connector integration tests (API-level with mocked upstreams) for SharePoint/Jira/Notion ingestion paths.
- Complete cloud-mode validation in production-like environment variables/secrets.
- Run signed NSIS installer smoke test on clean Windows VM and archive startup logs/screenshots.

### P2

- Reduce test harness warning noise (`requestSubmit` + relative URL fetch) to improve CI observability.
- Finalize local `local-data/` artifact hygiene policy and enforce it.

## 7. Final Assessment

Core release gates are green, local runtime paths are materially more stable after this sweep, and production dependency risk is now clean.  
**Primary remaining sign-off evidence is cloud-env validation and clean-VM Windows installer validation.**
