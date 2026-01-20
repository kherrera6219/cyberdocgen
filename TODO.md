# CyberDocGen - Technical Development TODOs

**Last Updated:** January 19, 2026
**Status:** Phase 7 Finalization (Technical Tracks)
**Coverage:** 46%+ Overall (Core Services @ 75%+)

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

### Infrastructure Wrapper
- [x] **Electron Main Process**: Secure window management and external link handling in `electron/main.ts`.
- [x] **MSIX Build Pipeline**: Integrated `electron-builder` configuration for standardized Windows distribution.

### Core Flows
- [x] **OIDC Callback**: Fixed token claim validation in `server/routes/microsoftAuth.ts`.
- [x] **Compliance Automation**: Created `scripts/validate-wack.ts` for automated Windows App Certification Kit checks.
### Quality Tracks
- [x] **Test Coverage Expansion (Batch 5 - MCP)**: Achieved 75%+ for all core MCP components.
- [x] **Test Coverage Expansion (Batch 4 - API Routes)**: Reached 75%+ coverage for Documents, Gap Analysis, and Enterprise Auth.
- [x] **Test Coverage Expansion (Batch 2)**: Achieved 75%+ for `storage.ts`, `aiOrchestrator.ts`, and `enterpriseAuthService.ts`.
- [x] **Core Services Hardening**: Verified all failure modes and fallback logic.
