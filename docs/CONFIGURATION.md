# Configuration Guide

This document captures the environment variables and operational settings required to run the CyberDocGen stack locally or in production.

## Environment variables

### Required
- `DATABASE_URL` – PostgreSQL connection string used by Drizzle ORM
- `OPENAI_API_KEY` – API key for OpenAI models referenced by the AI orchestrator
- `ANTHROPIC_API_KEY` – API key for Anthropic models
- `SESSION_SECRET` – At least 32 characters; used to sign Express sessions

### Recommended/optional
- `GEMINI_API_KEY` – Enables the `/api/test/gemini` diagnostic endpoint
- `ENCRYPTION_KEY` – 64-character hex string used by the encryption service and production validation scripts
- `MFA_ENABLED` / `MFA_SECRET_KEY` – Gate MFA-only flows when MFA is enforced in production
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` – Bucket identifier for object storage integrations
- `REPL_ID` / `REPLIT_DOMAINS` – Only required when running in the Replit environment for OIDC helpers
- `CLIENT_URL` – Overrides the production CORS allowlist
- `PORT` – Overrides the default `5000` port when binding the combined server

## Local `.env` example
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/cyberdocgen
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=use-a-strong-random-string
# Optional extras
GEMINI_API_KEY=...
ENCRYPTION_KEY=64_char_hex_value
DEFAULT_OBJECT_STORAGE_BUCKET_ID=local-bucket
CLIENT_URL=http://localhost:5000
```

## Validation
- The server calls `validateEnvironment` on startup to ensure required keys exist and to parse the configured port.
- Production validation scripts (`scripts/production-startup.ts` and `scripts/final-production-validation.ts`) perform additional checks for encryption, MFA readiness, and database availability; run them as part of any promotion pipeline.
