# AI Governance

Last updated: 2026-02-15

## Scope

This document defines the implemented AI governance controls in CyberDocGen for both cloud and Windows local deployments.
It maps policy requirements to concrete services, routes, and operational checks.

## Implemented Control Map

| Governance Area | Implementation | Verification Path |
|-----------------|----------------|-------------------|
| Prompt template registry (versioned) | `server/services/promptTemplateRegistry.ts` (`document_generation`, `content_generation`, `chat_assistant`, `export_generation`, `mcp_agent`) | `GET /api/ai/prompts/registry` |
| Model routing policy engine | `server/services/modelRoutingPolicyService.ts` (operation/framework/category/length-based routing) | Runtime logs + AI operation metadata audit |
| Governed model catalog | `server/services/modelVersionCatalog.ts` | `GET /api/ai/models/catalog` |
| Guardrail layer (prompt injection + moderation + redaction) | `server/services/aiGuardrailsService.ts` | `ai_guardrails_logs` table + `GET /api/ai/stats` |
| AI output classification | `server/services/aiOutputClassificationService.ts` (`empty`, `safe`, `sensitive`, `high_risk`) | Metadata audit event payloads |
| AI usage tracking and cost estimates | `server/services/aiUsageAccountingService.ts` + `server/services/modelTransparencyService.ts` | `ai_usage_disclosures` table + `GET /api/ai/stats` |
| Token/cost budget enforcement | `server/services/tokenBudgetService.ts` | Blocked AI requests with explicit budget reasons |
| AI metadata audit trail | `server/services/aiMetadataAuditService.ts` -> `auditService.logAction(...)` | `audit_trail` records (`action=ai_metadata_audit`) |

## Request Governance Flow

1. Prompt template is selected and rendered from the registry.
2. Model routing policy resolves selected and fallback models.
3. Budget check runs using projected token/cost estimates.
4. Input guardrails run before model execution.
5. Model response is post-processed through output guardrails/redaction.
6. Output is classified for risk (`safe`/`sensitive`/`high_risk`).
7. Usage disclosure record is written with token/cost estimates.
8. Metadata audit record is written with model/provider/version/timestamp/template details.

## Budget and Retention Controls

### Budget Environment Variables

- `AI_TOKEN_BUDGET_USER_DAILY` (default `200000`)
- `AI_TOKEN_BUDGET_ORG_DAILY` (default `2000000`)
- `AI_COST_BUDGET_USER_MONTHLY_USD` (default `100`)
- `AI_COST_BUDGET_ORG_MONTHLY_USD` (default `1000`)

### Usage Disclosure Metadata Variables

- `AI_USAGE_RETENTION_DAYS` (default `30`)
- `AI_DATA_STORAGE_REGION` (default `us`)
- `AI_CONSENT_VERSION` (default `v1`)

## Operational Endpoints

### Governance and Model Metadata

- `GET /api/ai/models/catalog`
- `GET /api/ai/prompts/registry`
- `GET /api/ai/stats?timeRange=7d|30d|90d|1y`

### Retention Scheduler Operations

- `GET /api/health/retention`
- `POST /api/health/retention/run`

## Compliance Notes

- Guardrail logging stores sanitized prompt/response values to reduce PII exposure.
- AI usage and metadata auditing captures provider/model/version/timestamp context for traceability.
- Budget enforcement is fail-open only when internal budget evaluation fails unexpectedly; these events are logged.

## Recommended Release Gate Checks

Run before production promotion:

```bash
npm run test:run
npm run test:coverage
npm run db:validate-parity
```

Then verify:

- `GET /api/ai/models/catalog`
- `GET /api/ai/prompts/registry`
- `GET /api/ai/stats`
- `GET /api/health/retention`

