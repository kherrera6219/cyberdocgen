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
- [ ] **MFA Logic Alignment**: Refactor `server/services/mfaService.ts` to support contextual authentication signals from Entra ID tokens.

### Security & Compliance Coding

- [x] **AI Moderation API**: Uses OpenAI Moderation API with mock fallback in `aiGuardrailsService.ts`.
- [x] **Audit Trail Integrity**: HMAC-based chaining implemented via `computeSignature()` in `auditService.ts`.

---

## 🟠 MEDIUM PRIORITY - Observability & Performance

### Telemetry & Tracking

- [ ] **Error Monitoring**: Implement Sentry (or equivalent) SDK wrappers for both Frontend and Backend.
- [x] **AI Latency Instrumentation**: OpenTelemetry installed and configured in `server/monitoring/telemetry.ts`.
- [x] **Audit Telemetry**: High-risk audit events logged via structured logger with `HIGH_RISK_AUDIT_EVENT` tags.

### Performance Engineering

- [ ] **Benchmarking Scripts**: Create `scripts/benchmark-ai.ts` using `autocannon` to establish baseline latency.
- [ ] **Bundle Governance**: Implement a custom Vite plugin or script to enforce a 200KB chunk size limit in CI.

---

## 🔵 LOW PRIORITY - Code Quality & Debt

### Refactoring & Type Safety

- [ ] **Logger Migration**: Replace remaining `console.log` statements (130+ in server/*) with structured `logger`.
- [ ] **TypeScript Cleanup**: Remove `any` types from `encryption.ts` (6), `auditService.ts` (6), `cloudIntegrationService.ts` (7).
- [x] **Modernize Async**: Refactored legacy `.then().catch()` chains to `async/await`.

### UI/UX Implementation

- [x] **Storybook Coverage**: 53 story files created covering all major UI components.
- [ ] **Visual Regression**: Integrate `playwright` visual comparison tests for the primary compliance scorecard view.

---

## ✅ RECENTLY COMPLETED - Coding Track

### Desktop App Readiness & Hardening (January 2026)

- [x] **Backend Packaging**: Migrated server to `.cjs` with `utilityProcess.fork` support.
- [x] **Login Bypass**: Implemented seamless local authentication with direct redirection.
- [x] **Process Monitoring**: Added PID-based orphan cleanup and dynamic port assignment.
- [x] **Uninstaller Polish**: Custom NSIS script for user-controlled data retention.
- [x] **Health Polling**: Integrated active `/health` polling for UI load synchronization.

### Cloud Integrations (January 2026)

- [x] **Google Drive OAuth**: Full `@googleapis/drive` integration with offline access.
- [x] **OneDrive OAuth**: Full Microsoft Graph integration with token refresh.
- [x] **AI Moderation**: OpenAI Moderation API + mock fallback for safety checks.
- [x] **Audit HMAC Chaining**: Tamper-proof audit logs with signature verification.

### Infrastructure Wrapper

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
| 🎯 High    | 6     | 5    | 1         |
| 🟠 Medium  | 5     | 2    | 3         |
| 🔵 Low     | 5     | 2    | 3         |
| **Total**  | 16    | 9    | **7**     |
