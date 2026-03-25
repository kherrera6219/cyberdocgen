# API Endpoint Reference

All endpoints are prefixed with `/api` unless noted otherwise. Authentication is required for all routes except `/health`, `/api/auth/*`, and `/api/enterprise-auth/*`.

**Base URL:** `http://localhost:5000` (development)

**Authentication:** Cookie-based session. Obtain a session by `POST /api/auth/login` or `POST /api/enterprise-auth/login`.

**Response envelope:**
- Success: `{ "success": true, "data": <payload> }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | System health check |
| GET | `/api/health/database` | Yes | Database health + latency |
| GET | `/api/health/database/stats` | Yes | Table row counts, DB size |
| POST | `/api/health/database/verify` | Yes | Run DB integrity checks |
| POST | `/api/health/metrics` | Yes | Log a usage metric event |
| GET | `/api/health/retention` | Yes | Retention scheduler status |
| POST | `/api/health/retention/run` | Yes | Trigger retention run now |

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/logout` | No | Destroy session |
| GET | `/api/auth/user` | Yes | Current user profile |
| POST | `/api/auth/register` | No | Register new account |
| POST | `/api/auth/forgot-password` | No | Send password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |

### Enterprise Auth (Replit OAuth / SAML / Entra ID)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/login` | No | Replit OAuth redirect |
| GET | `/api/callback` | No | Replit OAuth callback |
| POST | `/api/enterprise-auth/register` | No | Enterprise signup |
| POST | `/api/enterprise-auth/login` | No | Enterprise login |
| GET | `/api/enterprise-auth/verify-email` | No | Email verification |
| POST | `/api/enterprise-auth/resend-verification` | No | Resend verification email |

### MFA

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/mfa/setup` | Yes | Begin TOTP setup |
| POST | `/api/mfa/verify-setup` | Yes | Confirm TOTP enrollment |
| POST | `/api/mfa/verify` | Yes | Verify TOTP code |
| POST | `/api/mfa/disable` | Yes | Disable MFA |
| POST | `/api/mfa/backup-codes` | Yes | Generate backup codes |

---

## Organizations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/organizations` | Yes | List user's organizations |
| POST | `/api/organizations` | Yes | Create organization |

---

## Company Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/company-profiles` | Yes | List profiles for org |
| POST | `/api/company-profiles` | Yes | Create profile |
| GET | `/api/company-profiles/:id` | Yes | Get profile by ID |
| PUT | `/api/company-profiles/:id` | Yes | Update profile |
| DELETE | `/api/company-profiles/:id` | Yes | Delete profile |
| POST | `/api/company-profiles/extract` | Yes | AI-extract data from document |

---

## Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/documents` | Yes | List documents (paginated) |
| POST | `/api/documents` | Yes | Create document |
| GET | `/api/documents/:id` | Yes | Get document by ID |
| PUT | `/api/documents/:id` | Yes | Update document |
| DELETE | `/api/documents/:id` | Yes | Delete document (204) |
| POST | `/api/documents/:id/export` | Yes | Export as PDF/DOCX |
| POST | `/api/documents/upload-and-extract` | Yes | Upload + extract company data |

---

## AI Generation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/generate` | Yes | Generate compliance document |
| GET | `/api/ai/generate/:jobId/status` | Yes | Poll generation status |
| POST | `/api/ai/chat` | Yes | Compliance chatbot |
| POST | `/api/ai/chat/multimodal` | Yes | Multimodal chat (image+text) |

---

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/analytics/risk-assessment` | Yes | AI-powered risk assessment |
| POST | `/api/analytics/compliance-analysis` | Yes | AI compliance gap analysis |
| POST | `/api/analytics/analyze-compliance-gaps` | Yes | Rule-based gap analysis |
| POST | `/api/analytics/document-quality` | Yes | Score document quality |

---

## Gap Analysis

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gap-analysis` | Yes | List gap analysis reports |
| GET | `/api/gap-analysis/reports` | Yes | List reports (alias) |
| GET | `/api/gap-analysis/reports/:id` | Yes | Report details + findings |
| GET | `/api/gap-analysis/:framework` | Yes | Reports filtered by framework |
| POST | `/api/gap-analysis` | Yes | Create (501 — use /generate) |
| POST | `/api/gap-analysis/generate` | Yes | Start async gap analysis |
| PATCH | `/api/gap-analysis/recommendations/:id` | Yes | Update recommendation status |

---

## Audit Trail

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/audit-trail` | Yes | Paginated audit log |
| GET | `/api/audit-trail/stats` | Yes | Aggregate audit statistics |
| GET | `/api/audit-trail/:id` | Yes | Single audit entry |

---

## Admin

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/admin/oauth-settings` | Yes | admin |
| POST | `/api/admin/oauth-settings` | Yes | admin |
| GET | `/api/admin/pdf-defaults` | Yes | admin |
| POST | `/api/admin/pdf-defaults` | Yes | admin |
| GET | `/api/admin/cloud-integrations` | Yes | admin |
| DELETE | `/api/admin/cloud-integrations/:id` | Yes | admin |
| GET | `/api/admin/monitoring` | Yes | admin |
| GET | `/api/admin/stats` | Yes | admin |

---

## MCP (Model Context Protocol)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/mcp/execute` | Yes | Execute a single MCP tool |
| POST | `/api/mcp/batch` | Yes | Batch tool executions (max 10) |
| GET | `/api/mcp/tools` | Yes | List registered tools |
| GET | `/api/mcp/status` | Yes | Agent + circuit breaker status |

---

## Repository / Ingestion

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/repository` | Yes | List ingested documents |
| POST | `/api/repository/upload` | Yes | Upload document (multipart) |
| DELETE | `/api/repository/:id` | Yes | Delete ingested document |

---

## Cloud Integrations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/integrations` | Yes | List user integrations |
| POST | `/api/integrations/google` | Yes | Add Google Drive |
| POST | `/api/integrations/microsoft` | Yes | Add OneDrive |
| DELETE | `/api/integrations/:id` | Yes | Remove integration |
| POST | `/api/integrations/:id/sync` | Yes | Trigger manual sync |

---

## Common Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist or org mismatch |
| `VALIDATION_ERROR` | 400 | Request body/query failed schema validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `MFA_VERIFICATION_EXPIRED` | 403 | High-risk action requires fresh MFA |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `NOT_IMPLEMENTED` | 501 | Endpoint placeholder not yet built |

---

## Interactive Documentation

Swagger UI is available at `/api-docs` when the server is running.
Download the raw OpenAPI spec at `/api-docs.json`.
