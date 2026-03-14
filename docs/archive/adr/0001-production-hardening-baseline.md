# 0001 - Production Hardening Baseline

- Status: Accepted
- Date: 2026-02-15

## Context

Production readiness reviews identified recurring governance and connector risks:

- Connector endpoints had no dedicated rate limits.
- External connector API responses were trusted via TypeScript casts without runtime validation.
- Connector latency and error telemetry lacked connector-level visibility.
- Developer governance controls lacked enforced local pre-commit checks and ADR traceability.

These issues increased operational risk for cloud and Windows desktop release paths.

## Decision

Adopt a production-hardening baseline with four mandatory controls:

1. Connector-specific rate limiting tiers for read, write, and import operations.
2. Runtime schema validation for external connector API responses (SharePoint, Jira, Notion).
3. Connector latency/error telemetry in centralized metrics.
4. Enforced pre-commit governance (`lint` + `typecheck`) and ADR tracking in `docs/adr`.

## Consequences

Positive:

- Reduced abuse risk on connector endpoints.
- Safer handling of upstream API drift and malformed responses.
- Better connector observability for incident response and SLO tuning.
- Stronger engineering guardrails before changes are committed.

Tradeoffs:

- Slight runtime overhead from schema validation and telemetry recording.
- Longer commit cycle due to pre-commit quality gates.

## Verification

- Connector route integration tests include rate-limit behavior.
- Connector adapter tests include runtime schema validation failure paths.
- Metrics unit tests verify connector metrics and computed connector error-rate.
- `npm run lint` and `npm run check` pass with pre-commit hook installed.
