# OpenAPI Guide

CyberDocGen generates an OpenAPI 3.1 spec from JSDoc annotations in the Express route layer.

## Current Behavior

- The spec is built in `server/config/swagger.ts`.
- The Swagger UI and raw JSON endpoints are registered in `server/routes.ts`.
- Interactive docs are **disabled by default** unless `ENABLE_SWAGGER=true`.
- When enabled, the app serves:
  - `GET /api-docs` - Swagger UI
  - `GET /api-docs.json` - raw OpenAPI document

## Enabling Swagger Locally

```bash
ENABLE_SWAGGER=true npm run dev
```

With the development server running, open:

```text
http://localhost:5000/api-docs
http://localhost:5000/api-docs.json
```

## Production Behavior

- Production deployments do not expose Swagger unless `ENABLE_SWAGGER=true` is set explicitly.
- If Swagger is disabled, `/api-docs` and `/api-docs.json` are not registered.

## Source Files

```text
server/config/swagger.ts   OpenAPI definition, schemas, and metadata
server/routes.ts           Conditional registration for /api-docs and /api-docs.json
server/routes/**/*.ts      JSDoc @openapi annotations consumed by swagger-jsdoc
```

## Authentication Notes

- Most documented endpoints require the normal application session cookie.
- Session cookies are established through the app auth flows, primarily:
  - `GET /api/login`
  - `POST /api/enterprise-auth/login`
- MFA-specific routes live under `/api/auth/mfa/*`.

## Updating the Spec

1. Add or update `@openapi` JSDoc annotations in the relevant route file.
2. Keep request and response examples aligned with the route’s runtime validation.
3. Start the app with `ENABLE_SWAGGER=true`.
4. Verify both `/api-docs` and `/api-docs.json`.

## Client Generation

If you need a generated client or types, point tooling at the JSON endpoint after enabling Swagger:

```bash
npx openapi-typescript http://localhost:5000/api-docs.json -o client/src/types/api.ts
```

## Troubleshooting

- `404` on `/api-docs`: set `ENABLE_SWAGGER=true` before starting the server.
- Spec generation failure: check `server/config/swagger.ts` and recent `@openapi` annotations.
- Missing route in Swagger UI: confirm the route file is included in the `apis` glob and that the JSDoc block uses `@openapi`.
