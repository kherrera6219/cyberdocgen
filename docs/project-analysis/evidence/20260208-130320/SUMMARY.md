# Release Evidence Summary

Generated: 2026-02-08 13:16:52 -08:00

| Step | Command | Exit Code |
|---|---|---|
| 01-check | `npm run check` | 0 |
| 02-lint | `npm run lint` | 0 |
| 03-test-run | `npm run test:run` | 0 |
| 04-build | `npm run build` | 0 |
| 05-windows-validate | `npm run windows:validate` | 0 |
| 06-verify-build | `node scripts/verify-build.js` | 0 |
| 07-build-win | `npm run build:win` | 0 |
| 08-audit-prod | `npm audit --omit=dev` | 0 |
| 09-audit-all | `npm audit` | 1 |
| 10-cloud-start-without-env | `DEPLOYMENT_MODE=cloud npm run start` | 1 |
| 11-local-start-smoke | `local runtime smoke probes` | 0 |

## Notes

1. `npm run lint` completed with `0 errors, 133 warnings`.
2. `npm run test:run` completed with `100 files, 1162 passed, 4 skipped`.
3. `npm audit --omit=dev` is clean (`0 vulnerabilities`).
4. `npm audit` fails due dev-only advisory chain; see `09-audit-all.log` and `../DEV_TOOLCHAIN_ADVISORY_DECISION_2026-02-08.md`.
5. Cloud-mode startup without required env intentionally fails (`DATABASE_URL` and `SESSION_SECRET` required), captured in `10-cloud-start-without-env.log`.
