# Cleanup and Type Safety TODO

## Section 1: Core shared types and logging (done)
- [x] Deduplicate shared schema exports.
- [x] Ensure logger is imported where referenced in AI services and server bootstrapping.
- [x] Harden health checks with proper enums and error handling.

## Section 2: Server feature modules
- [ ] Resolve Drizzle type errors in cloud integration and storage services.
- [ ] Tighten MFA route typings and ensure service methods align with route usage.
- [ ] Fix audit, risk, and compliance service typings flagged by `tsc`.

## Section 3: Client TypeScript cleanup
- [ ] Address prop and state typing issues in AI dashboards (e.g., EnhancedAnalytics, IndustrySpecialization).
- [ ] Clean up auth and account recovery pages to remove implicit `any` usage.
- [ ] Verify admin and setup pages compile without tsconfig errors.
