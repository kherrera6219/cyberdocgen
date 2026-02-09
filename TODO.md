# CyberDocGen - Technical Development TODOs

**Last Updated:** February 9, 2026  
**Status:** Operational Readiness Hardening In Progress  
**Coverage:** 61.22% statements/lines, 56.66% functions, 68.95% branches (Core services at 80%+ for current hotspot batch)

---

## 🚨 OPERATIONAL TODO - February 8, 2026

### P0 - Must Complete Before Production Sign-Off

- [x] **Remediate production npm advisories**: production dependency tree now reports 0 vulnerabilities.
- [x] **Re-run security validation**: `npm audit`, smoke tests, and deployment verification executed after updates.
- [x] **Align Windows validation tooling with actual packaging target**: `scripts/validate-wack.ts` now validates NSIS and optional MSIX paths.
- [x] **Implement connector adapters**: SharePoint/Jira/Notion adapter list/fetch flows implemented with tenant-scoped config access and import tests.
- [x] **Resolve/accept dev-toolchain advisories**: temporary risk acceptance documented with controls in `docs/project-analysis/DEV_TOOLCHAIN_ADVISORY_DECISION_2026-02-08.md`.
- [x] **Lock release evidence**: gate outputs archived in `docs/project-analysis/evidence/20260208-130320/`.

### P1 - High Impact Reliability and Security Hygiene

- [x] **Lint warning reduction (133 -> 0 warnings)**: server-side warning remediation completed; client rule scoping + hook-compat updates applied.
- [x] **Local-mode operational docs**: required local env documented (`DEPLOYMENT_MODE=local`, 32+ char `SESSION_SECRET`, `LOCAL_PORT` behavior).
- [ ] **Windows installer sign-off**: run signed NSIS installer smoke test on a clean Windows VM and capture startup logs evidence.
- [ ] **Store distribution decision**: decide if MSIX/Store channel is required; if yes, add `msix` target + identity metadata and dedicated certification runbook.
- [x] **Release version alignment**: package and installer outputs aligned to `2.4.0` (`CyberDocGen-Setup-2.4.0.exe`).
- [x] **Generated artifact hygiene**: `local-data/` now ignored via `.gitignore` policy.

### P2 - Maintainability and Technical Debt

- [ ] **Storybook lint strategy**: either modernize story files to current rules or keep explicit non-prod exclusions documented.
- [ ] **Route coverage cleanup**: expand remaining tests around repository analysis orchestration (`server/routes.ts`), temp-auth gating, and low-covered auth/project/mfa routes (storage/admin/local-mode routes now expanded).
- [ ] **Documentation consistency pass**: reconcile historical “0 vulnerabilities” and old production claims across status docs.
- [ ] **Test warning cleanup**: remove residual React `act(...)` noise and migrate off deprecated Vitest `environmentMatchGlobs` (jsdom `requestSubmit()` warning already remediated in `ai-doc-generator`).
- [ ] **Coverage threshold burn-down**: close remaining global gap (needs +13,109 statements, +507 functions, +319 branches to hit 80/75 gates).

---

## 🎯 HIGH PRIORITY - Feature Completion

### Enterprise Identity & Cloud Integration

- [x] **Microsoft Entra ID (OIDC/PKCE)**: Core authentication flow implemented.
- [x] **Google Drive OAuth 2.0**: Full OAuth flow implemented in `cloudIntegrationService.ts` using `OAuth2Client`.
- [x] **OneDrive OAuth 2.0**: Full OAuth flow implemented using Microsoft Graph token exchange.
- [x] **MFA Logic Alignment**: Enhanced `server/providers/auth/entraId.ts` with contextual auth signals (amr/acr/device claims).

### Security & Compliance Coding

- [x] **AI Moderation API**: Uses OpenAI Moderation API with mock fallback in `aiGuardrailsService.ts`.
- [x] **Audit Trail Integrity**: HMAC-based chaining implemented via `computeSignature()` in `auditService.ts`.

---

## 🟠 MEDIUM PRIORITY - Observability & Performance

### Telemetry & Tracking

- [x] **Error Monitoring**: Sentry SDK implemented in `server/monitoring/sentry.ts` and `client/src/lib/sentry.ts`.
- [x] **AI Latency Instrumentation**: OpenTelemetry installed and configured in `server/monitoring/telemetry.ts`.
- [x] **Audit Telemetry**: High-risk audit events logged via structured logger with `HIGH_RISK_AUDIT_EVENT` tags.

### Performance Engineering

- [x] **Benchmarking Scripts**: Created `scripts/benchmark-ai.ts` using `autocannon` for baseline latency testing.
- [x] **Bundle Governance**: Vite plugin created in `client/vite-plugins/bundleGovernance.ts` (200KB limit, CI enforcement).

---

## 🔵 LOW PRIORITY - Code Quality & Debt

### Refactoring & Type Safety

- [x] **Logger Migration**: Replaced 130+ `console.log` statements in server/* with structured `logger` (commit `6c2a7d2`).
- [x] **TypeScript Cleanup**: Fixed 14 catch block `any` types → `unknown` with type guards (commit `f527734`).
- [x] **Modernize Async**: Refactored legacy `.then().catch()` chains to `async/await`.

### UI/UX Implementation

- [x] **Storybook Coverage**: 53 story files created covering all major UI components.
- [x] **Visual Regression**: Created `tests/visual/visual-regression.spec.ts` with 9 Playwright tests (scorecard, responsive, dark mode).

---

## ✅ RECENTLY COMPLETED - January 27, 2026 Session

### New Implementations (This Session)

- [x] **Sentry Error Monitoring**: Full SDK for server (`server/monitoring/sentry.ts`) and client (`client/src/lib/sentry.ts`).
- [x] **Benchmarking Scripts**: Created `scripts/benchmark-ai.ts` with autocannon load testing.
- [x] **Bundle Governance Plugin**: `client/vite-plugins/bundleGovernance.ts` with 200KB limit enforcement.
- [x] **Visual Regression Tests**: Created `tests/visual/visual-regression.spec.ts` with 9 tests for scorecard, gap analysis, responsive layouts, dark mode.

### Desktop App Readiness & Hardening (Earlier in January 2026)

- [x] **Backend Packaging**: Migrated server to `.cjs` with `utilityProcess.fork` support.
- [x] **Login Bypass**: Implemented seamless local authentication with direct redirection.
- [x] **Process Monitoring**: Added PID-based orphan cleanup and dynamic port assignment.
- [x] **Uninstaller Polish**: Custom NSIS script for user-controlled data retention.
- [x] **Health Polling**: Integrated active `/health` polling for UI load synchronization.

### Cloud Integrations

- [x] **Google Drive OAuth**: Full `@googleapis/drive` integration with offline access.
- [x] **OneDrive OAuth**: Full Microsoft Graph integration with token refresh.
- [x] **AI Moderation**: OpenAI Moderation API + mock fallback for safety checks.
- [x] **Audit HMAC Chaining**: Tamper-proof audit logs with signature verification.

### Infrastructure

- [x] **Electron Main Process**: Secure window management and external link handling.
- [x] **Windows Installer Build**: Configured `electron-builder` for NSIS local deployment.
- [x] **Local Build Guide**: Created `WINDOWS_GUIDE.md` with detailed build instructions.

### Quality Tracks

- [x] **Coverage Expansion**: Achieved 85%+ for critical services and 1153+ total passing tests.
- [x] **Diagnostic Tools**: Created `scripts/diagnostic.js` for environment health checks.
- [x] **Storybook Stories**: 53 component stories for UI documentation.
- [x] **OpenTelemetry**: Full observability infrastructure installed.

---

## 📊 Summary

### Completed in this sweep

1. Connector adapters moved from stubs to API-backed implementations for SharePoint/Jira/Notion.
2. Deep bug sweep fixed unhandled async teardown updates in temporary login/logout flows.
3. Release evidence bundle captured with command logs and exit codes (`docs/project-analysis/evidence/20260208-130320/SUMMARY.md`).
4. Full gates pass: `check`, `test:run`, `build`, `windows:validate`, `build:win`, `verify-build` (`1230` passing, `4` skipped).
5. Lint/security warning burn-down complete: `npm run lint` now passes with 0 warnings; evidence in `docs/project-analysis/evidence/20260208-203122/SUMMARY.md`.
6. Coverage uplift infrastructure added: `test:coverage:hotspots` plus expanded suites (`public-pages`, `additional-pages`, `framework-pages`, `localModeRoutes`, `storageRoutes`, `adminRoutes`, `company-profile` interactions, account/auth pages, repository hook/page coverage).
7. Hotspot batch completed for all three requested targets:
   - backend service hotspots: `repositoryFindingsService`, `codeSignalDetectorService`
   - object storage/local mode: `objectStorageService`, `localModeRoutes`
   - frontend high-gap pages: `api-keys`, `organization-setup`, `cloud-integrations`

### Remaining operational items

1. Clean-VM Windows installer sign-off evidence collection.
2. Cloud-mode validation in production-like env/secrets.

