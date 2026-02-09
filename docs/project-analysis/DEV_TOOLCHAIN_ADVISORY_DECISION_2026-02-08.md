# Dev Toolchain Advisory Decision

**Date:** February 8, 2026  
**Scope:** `npm audit` dev-only advisory chain (`drizzle-kit` -> `@esbuild-kit/*` -> `esbuild`)  
**Advisory:** GHSA-67mh-4wv8-2f99

## Decision

`Accepted with controls (temporary)` for production release.

## Rationale

1. The vulnerability is in a dev-server context and is not in the production runtime path.
2. `npm audit --omit=dev` is clean (`0 vulnerabilities`), so deployable artifacts are not affected.
3. Forcing the audit fix currently implies a breaking rollback of `drizzle-kit` (`npm audit fix --force` proposes `drizzle-kit@0.18.1`), creating migration-tooling regression risk.

## Required Controls

1. Keep `npm audit --omit=dev` as a release gate and block release on non-zero findings there.
2. Do not expose local development servers to untrusted networks.
3. Re-run full `npm audit` weekly in CI and track this finding until resolved upstream.
4. Revisit this acceptance on or before **March 31, 2026**, or immediately if upstream publishes a compatible fix path.

## Exit Criteria

1. Upgrade to a `drizzle-kit` chain that no longer pulls vulnerable `@esbuild-kit/*` `esbuild`.
2. `npm audit` returns no findings for this advisory without introducing breaking migration regressions.

## Evidence

- `docs/project-analysis/evidence/20260208-130320/09-audit-all.log`
- `docs/project-analysis/evidence/20260208-130320/08-audit-prod.log`
