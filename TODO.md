# CyberDocGen - Technical Development TODOs

**Last Updated:** January 27, 2026
**Status:** Phase 9 (Desktop Production Readiness)
**Coverage:** 48%+ Overall (Core Services @ 85%+)

---

## 🎯 HIGH PRIORITY - Feature Completion

### Enterprise Identity & Cloud Integration
- [x] **Microsoft Entra ID (OIDC/PKCE)**: Core authentication flow implemented.
- [ ] **Google Drive OAuth 2.0**: Replace placeholders in `server/routes/cloudIntegration.ts` with full OAuth flow using `@googleapis/drive`.
- [ ] **OneDrive OAuth 2.0**: Implement full OAuth flow in `server/services/cloudIntegrationService.ts` using `@microsoft/microsoft-graph-client`.
- [ ] **MFA Logic Alignment**: Refactor `server/services/mfaService.ts` to support contextual authentication signals from Entra ID tokens.

### Security & Compliance Coding
- [ ] **AI Moderation API**: Replace mock classifiers in `server/services/aiGuardrailsService.ts` with OpenAI/Anthropic Moderation API integrations.
- [ ] **Audit Trail Integrity**: Implement HMAC-based chaining for audit log entries to prevent mid-stream tampering.

---

## 🟠 MEDIUM PRIORITY - Observability & Performance

### Telemetry & Tracking
- [ ] **Error Monitoring**: Implement Sentry (or equivalent) SDK wrappers for both Frontend and Backend to capture unhandled exceptions.
- [ ] **AI Latency Instrumentation**: Expand OpenTelemetry spans in `aiOrchestrator.ts` to track token-per-second (TPS) and model latency.
- [ ] **Audit Telemetry**: Wire high-risk audit events to top-level dashboards via the `performanceService.ts`.

### Performance Engineering
- [ ] **Benchmarking Scripts**: Create `scripts/benchmark-ai.ts` using `autocannon` to establish baseline latency for document generation.
- [ ] **Bundle Governance**: Implement a custom Vite plugin or script to enforce a 200KB chunk size limit in CI.

---

## 🔵 LOW PRIORITY - Code Quality & Debt

### Refactoring & Type Safety
- [ ] **Logger Migration**: Replace remaining `console.log/warn/error` statements in `server/`, `client/src/`, and `scripts/` with the structured `logger`.
- [ ] **TypeScript Cleanup**: Remove `any` types from `encryption.ts`, `auditService.ts`, and `cloudIntegrationService.ts`.
- [x] **Modernize Async**: Refactor legacy `.then().catch()` chains to `async/await` in `scripts/generate-sbom.ts` and `server/storage.ts`.

### UI/UX Implementation
- [ ] **Storybook Coverage**: Complete stories for all components in `client/src/components/ui`, specifically focusing on complex dashboard widgets.
- [ ] **Visual Regression**: Integrate `playwright` visual comparison tests for the primary compliance scorecard view.

---

## ✅ RECENTLY COMPLETED - Coding Track

### Desktop App Readiness & Hardening
- [x] **Backend Packaging**: Migrated server to `.cjs` with `utilityProcess.fork` support.
- [x] **Login Bypass**: Implemented seamless local authentication with direct redirection.
- [x] **Process Monitoring**: Added PID-based orphan cleanup and dynamic port assignment.
- [x] **Uninstaller Polish**: Custom NSIS script for user-controlled data retention.
- [x] **Health Polling**: Integrated active `/health` polling for UI load synchronization.

### Infrastructure Wrapper
- [x] **Electron Main Process**: Secure window management and external link handling in `electron/main.ts`.
- [x] **Windows Installer Build**: Configured `electron-builder` for NSIS (Setup.exe) local deployment.
- [x] **Local Build Guide**: Created `WINDOWS_GUIDE.md` with detailed build instructions.

### Quality Tracks
- [x] **Coverage Expansion**: Achieved 85%+ for critical services and 1100+ total passing tests.
- [x] **Diagnostic Tools**: Created `scripts/diagnostic.js` for environment health checks.
