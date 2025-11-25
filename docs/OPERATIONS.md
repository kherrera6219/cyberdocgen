# Operations Guide

This guide covers day-to-day workflows for running, validating, and monitoring CyberDocGen.

## Development workflow
- Install dependencies with `npm install`.
- Use `npm run dev` to run the Express API and Vite-served client on a single port (`5000` by default).
- Apply schema changes with `npm run db:push` when updating database models.
- Run static checks with `npm run check` before opening a pull request.

## Production build
- Build the client and bundle the server:
  ```bash
  npm run build
  ```
- Launch the bundled server (expects environment variables from `docs/CONFIGURATION.md`):
  ```bash
  npm start
  ```

## Health and diagnostics
- **Liveness/readiness**: `/live` and `/ready` endpoints for container orchestration hooks.
- **System health**: `/health` returns status metadata plus request metrics from `metricsCollector`.
- **AI services**: `/api/ai/health` for orchestrator status; `/api/test/openai`, `/api/test/claude`, and `/api/test/gemini` provide per-model smoke tests when corresponding keys are configured.

## Security controls
- Request validation, sanitization, and rate limiting are applied to `/api/*` routes via middleware in `server/index.ts`.
- MFA requirements are enforced for high-risk routes (e.g., document generation) through `requireMFAForHighRisk` and the Phase 2 MFA middleware.
- Use `scripts/production-startup.ts` before deployment to verify encryption, MFA configuration, and database connectivity.

## Troubleshooting
- **Startup failures**: Ensure required environment variables are present; `validateEnvironment` exits early when mandatory keys are missing.
- **AI errors**: Check provider keys and model availability; see API responses from `/api/test/*` for detailed error messages.
- **CORS issues**: Set `CLIENT_URL` to the expected origin in production environments.
