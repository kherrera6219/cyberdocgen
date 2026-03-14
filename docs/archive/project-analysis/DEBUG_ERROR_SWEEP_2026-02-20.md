# Debug and Error Sweep - 2026-02-20

## Scope

Production-focused sweep across:

- lint and static analysis warnings
- TypeScript compile integrity
- full unit/integration/component test suite execution
- production build pipeline
- Windows packaging validation checks

## Issues Found and Fixed

1. Lint warning: missing hook dependency in MFA setup page
   - File: `client/src/pages/mfa-setup.tsx`
   - Fix:
     - wrapped request helper in `useCallback`
     - wrapped `loadMFAStatus` in `useCallback`
     - updated `useEffect` dependency list to `[loadMFAStatus]`

2. Lint warning: unnecessary type assertions in user upsert path
   - File: `server/storage.ts`
   - Fix:
     - removed unnecessary `as any` assertions in `upsertUser`
     - preserved local SQLite compatibility path
     - switched `updatedAt` upsert assignment to `sql\`CURRENT_TIMESTAMP\`` to avoid JS `Date` binding drift in local SQLite mode

3. Test execution blocker: native module ABI mismatch
   - Failure:
     - `tests/unit/providers/db/sqlite.test.ts` failed with
       `NODE_MODULE_VERSION 143` vs required `127`
   - Root cause:
     - `better-sqlite3` had been rebuilt for Electron ABI, then tests were run under Node runtime ABI.
   - Fix applied in environment:
     - `npm rebuild better-sqlite3`

## Validation Results

Executed:

```powershell
npm run lint
npm run check
npm run test:run
npm run build
npm run windows:validate
```

Outcome:

- `lint`: PASS (0 warnings)
- `check`: PASS
- `test:run`: PASS (`168` files, `1558` passed, `4` skipped)
- `build`: PASS
- `windows:validate`: PASS

Additional release-readiness validation (same date):

- `test:run -- --coverage`: PASS (`82.87%` statements/lines, `80.43%` functions, `78.16%` branches)
- `windows:validate:store`: PASS in non-strict local mode (missing `WINDOWS_STORE_*` values logged as warnings with APPX fallback)
- `windows:evidence:validate`: PASS in non-strict mode (`0` passed, `9` failed recorded in `evidence-manifest.json`)
- `windows:evidence:validate -- --strict`: FAIL expected until clean-VM evidence bundle is captured
- `cloud:validate`: PASS in non-strict mode (environment checks skipped when secrets are not set)
- `cloud:validate:strict`: FAIL expected until production-valid secrets are provided
- `npm audit fix`: PARTIAL (non-breaking updates applied)
- `npm audit --omit=dev`: PASS (`0` vulnerabilities)
- `npm audit`: PASS (`0` vulnerabilities)

## Notes

- Native module ABI can drift depending on whether dependencies were last rebuilt for Node or Electron. See `docs/TROUBLESHOOTING.md` for recovery commands.
- Dependency audit is currently clean for both production-only and full dependency trees.
