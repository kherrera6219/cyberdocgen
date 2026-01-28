# CyberDocGen - Technical Development TODOs

**Last Updated:** January 27, 2026  
**Status:** Phase 9 (Desktop Production Readiness) - COMPLETE  
**Coverage:** 48%+ Overall (Core Services @ 85%+)

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

- [ ] **Logger Migration**: Replace remaining `console.log` statements (130+ in server/*) with structured `logger`.
- [ ] **TypeScript Cleanup**: Remove `any` types from `encryption.ts` (6), `auditService.ts` (6), `cloudIntegrationService.ts` (7).
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

- [x] **Coverage Expansion**: Achieved 85%+ for critical services and 1162+ total passing tests.
- [x] **Diagnostic Tools**: Created `scripts/diagnostic.js` for environment health checks.
- [x] **Storybook Stories**: 53 component stories for UI documentation.
- [x] **OpenTelemetry**: Full observability infrastructure installed.

---

## 📊 Summary

| Priority   | Total | Done | Remaining |
| ---------- | ----- | ---- | --------- |
| 🎯 High    | 6     | 6    | 0         |
| 🟠 Medium  | 5     | 5    | 0         |
| 🔵 Low     | 5     | 3    | 2         |
| **Total**  | 16    | 14   | **2**     |

### Remaining Items (2)

1. **Logger Migration** - 130+ console.log statements in server/*
2. **TypeScript Cleanup** - 19 `any` types across 3 files

