# Cloud Validation Runbook

Last Updated: February 15, 2026

This runbook defines the repeatable cloud-mode validation process for production-like environments.

## Prerequisites

- `DATABASE_URL` set to the target cloud database
- `SESSION_SECRET` set to production-grade secret value
- Network connectivity from runner/host to cloud dependencies

## Local Execution

Run:

```bash
npm run cloud:validate -- --timeout-ms=60000
```

This performs:

1. strict environment validation (`DATABASE_URL`, `SESSION_SECRET`)
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

Artifact output:

- `cloud-validation-reports` (uploaded from `artifacts/cloud-validation/`)

## Completion Criteria

`CLOUD-01` can be closed when:

1. cloud validation report shows all checks passing
2. run is executed against production-like infra with real secrets
3. report artifact is archived with release evidence
