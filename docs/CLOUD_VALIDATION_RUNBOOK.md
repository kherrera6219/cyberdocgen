# Cloud Validation Runbook

Last Updated: February 20, 2026

This runbook defines the repeatable cloud-mode validation process for both local preflight and production-like environments.

## Prerequisites

- For strict runs: `DATABASE_URL` set to the target cloud database
- For strict runs: `SESSION_SECRET` set to a production-grade value (minimum 32 characters)
- For strict runs: `ENCRYPTION_KEY` set to a 64-character hex key
- For strict runs: `DATA_INTEGRITY_SECRET` set to a production-grade value (minimum 32 characters)
- Network connectivity from runner/host to cloud dependencies (strict and non-strict)

## Local Execution

Run (non-strict preflight):

```bash
npm run cloud:validate -- --timeout-ms=60000
```

This performs:

1. cloud-mode startup readiness checks (`/live`, `/ready`)
2. core endpoint checks (`/health`, `/api/ai/health`)
3. cloud/local mode boundary check (`/api/local/api-keys/configured` not publicly available)
4. report generation even when strict env secrets are not present

## Strict Execution (Local or CI)

Run:

```bash
npm run cloud:validate:strict -- --timeout-ms=60000
```

Strict mode adds:

1. strict environment validation (`DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `DATA_INTEGRITY_SECRET`)
2. cloud-mode startup readiness checks (`/live`, `/ready`)
3. core endpoint checks (`/health`, `/api/ai/health`)
4. cloud/local mode boundary check (`/api/local/api-keys/configured` not publicly available)

Reports are written to:

```text
artifacts/cloud-validation/<timestamp>/report.json
```

## CI Execution

Use:

```text
.github/workflows/cloud-validation.yml
```

Trigger manually with `workflow_dispatch` and ensure repository secrets include:

- `DATABASE_URL`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `DATA_INTEGRITY_SECRET`

Artifact output:

- `cloud-validation-reports` (uploaded from `artifacts/cloud-validation/`)

## Completion Criteria

`CLOUD-01` can be closed when:

1. strict cloud validation report (`cloud:validate:strict`) shows all checks passing
2. run is executed against production-like infra with real secrets
3. report artifact is archived with release evidence
