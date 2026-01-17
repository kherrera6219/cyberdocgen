# Modernization delivery phases

This plan sequences the roadmap into smaller, shippable phases with crisp ownership and exit criteria. Each phase can be run as a program increment (~4–6 weeks) with weekly demos and automated deployment to the staging environment.

## Phase 0 — Baseline health (in progress)
- **Objectives:** Establish design tokens, motion guardrails, connectivity resilience, and installable PWA shell.
- **Deliverables:**
  - Centralized design tokens (light/dark/high-contrast, motion) consumed by Tailwind and CSS variables.
  - Reduced-motion defaults and focus-visible states aligned to WCAG 2.2.
  - Offline detection banner and service worker with navigation fallback and cache priming.
  - PWA manifest and icon for installability.
- **Exit checks:** axe-core smoke run has zero critical issues; service worker registered in production build; lighthouse PWA checklist passes core items.

## Phase 1 — Accessibility, UX, and performance
- **Objectives:** Close WCAG 2.2 AA gaps, introduce micro-interactions within performance budgets, and harden Core Web Vitals.
- **Deliverables:**
  - Automated accessibility testing in CI (axe + Storybook or Playwright scans) with ticketed fixes.
  - Framer Motion primitives wrapped with motion tokens and reduced-motion fallbacks.
  - Route-level code splitting budgets and bundle alerts for regressions.
  - RUM instrumentation for LCP/FID/CLS with dashboards and SLO alerts.
- **Exit checks:** 0 critical/major a11y violations; P75 Web Vitals within budgets on staging; motion respects reduced-motion pref.

## Phase 2 — API hygiene and governance
- **Objectives:** Remove drift between frontend/back-end, lock schema guarantees, and gate risky features.
- **Deliverables:**
  - OpenAPI 3.1 definitions for all `/api` and AI routes with generated TypeScript client.
  - Request/response validation middleware and contract tests for AI endpoints.
  - Feature flags + kill switches around AI and authentication-sensitive features.
- **Exit checks:** Generated client in use for all API calls; contract tests run in CI; flag dashboard exposes kill switches.

## Phase 3 — Data residency, privacy, and AI guardrails
- **Objectives:** Enforce regional controls, data lifecycle, and safe AI behavior.
- **Deliverables:**
  - Tenant-level residency and retention policies propagated to storage and AI caches.
  - Prompt shields, PII redaction, output classifiers, and human-in-the-loop review for high-risk flows.
  - In-product transparency: model cards, provider notices, and data-use disclosures per AI action.
- **Exit checks:** Residency/retention policies validated in integration tests; AI guardrails logged and reviewable; transparency UI shipped.

## Phase 4 — Security, supply chain, and reliability
- **Objectives:** Raise auth posture and verifiable delivery while testing failure modes.
- **Deliverables:**
  - WebAuthn/FIDO2 support with contextual MFA and session risk scoring.
  - Confidential-compute toggles where supported; automated key rotation with audit logs.
  - SBOM generation, signed artifacts, and verification in CI/CD; chaos experiments for DB/AI latency and failures.
- **Exit checks:** Security pen test passes new controls; signed artifacts required for promotion; chaos suite run before release.

## Phase 5 — Compliance and operational excellence
- **Objectives:** Make compliance proof self-service and reduce MTTR.
- **Deliverables:**
  - Control mapping to SOC2/ISO/NIST surfaced in-product with evidence from audit logs.
  - Runbooks/playbooks for health/readiness/AI degradation exposed in-app.
  - Load tests for rate limits and autoscaling paths; SLOs with error budgets tied to release gates.
- **Exit checks:** Compliance dashboards populated; runbooks linked from incidents; load/SLO checks block regressions.

## Execution cadences
- **Governance:** Architecture review required for auth, data residency, and AI guardrail changes; threat modeling for AI and auth features.
- **Telemetry:** Expand tracing/logging spans as features ship to keep end-to-end visibility; ensure sampling and PII handling are documented.
- **Rollouts:** Use feature flags for risky changes, canary deploys for new guardrails, and post-deployment validation with RUM + API traces.
