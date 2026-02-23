# Page Wiring Deep Dive - 2026-02-23

## Scope
- Frontend audit across `client/src/pages` and `client/src/App.tsx` routing.
- Backend parity check for page-level API calls in `server/routes` and related handlers.
- Priority instruction applied: fix AI Assistant first, then identify remaining wiring gaps.

## Completed in this pass
- AI Assistant route rebuilt and fully wired in `client/src/pages/ai-assistant.tsx`.
- Added/verified:
  - Chat transcript rendering with user/assistant message flow
  - Send composer + Enter-to-send
  - File attachment upload/drop and attachment limits
  - Agent selection from `/api/mcp/agents`
  - Framework context selector
  - Voice input/output controls
  - New chat/clear conversation flow
  - Loading/error states and tool call display
- Validation completed:
  - `npm run check` passed
  - `npm run lint` passed
  - `npm run test -- tests/components/pages/additional-pages-smoke.test.tsx` passed
  - `npm run test -- tests/components/pages/admin-connectors-repository.test.tsx` passed
  - `npm run test -- tests/components/dashboard.test.tsx` passed

## Phase 1 Status Update (Resolved)
1. Repository analysis route parity fixed.
   - Added route aliases in `client/src/App.tsx`:
     - `/repository`
     - `/repository/:snapshotId`
     - `/repository-analysis`
     - `/repository-analysis/:snapshotId`
   - This resolves broken detail navigation paths.

2. Connectors Hub API query contract fixed.
   - Correctly handles `apiRequest` response shape in `client/src/pages/connectors-hub.tsx`.
   - Removed strict dependency on hardcoded integration IDs by deriving fallback integration IDs from connector metadata when not provided.

3. Dashboard generation endpoint corrected.
   - Updated to `/api/documents/generate` in `client/src/pages/dashboard.tsx`.
   - Added robust response parsing for `{ data: { jobId } }` and legacy shape fallback.

4. RUM metrics endpoint aligned with server contract.
   - Updated client metrics target to `/api/health/metrics` in `client/src/utils/performance.ts`.
   - Payload now matches server expectation (`eventType`, `eventData`) and includes authenticated credentials on fetch fallback.

5. Repository analysis context hardcoding removed from primary path.
   - Page now reads profile context via `useOrganizationOptional` and uses live profile IDs when available.

## Phase 2 Status Update (Resolved)
1. Document Workspace now uses live backend documents.
   - Replaced mock array query with `apiRequest("GET", "/api/documents")` and response-shape normalization.
   - Generation now sends active `companyProfileId` from organization context to satisfy backend validation.
   - Added loading skeletons and safe date/content rendering for serialized API values.

2. Document Versions now uses live version history.
   - Replaced mock version history with `apiRequest("GET", "/api/documents/:id/versions")`.
   - Added live document lookup (`/api/documents/:id`) so the page can show real titles.
   - Fixed restore action to pass `versionNumber` (numeric) to match backend restore route behavior.
   - Added loading state and safe rendering for missing/serialized values.

3. Regression coverage updated for live wiring behavior.
   - Updated:
     - `tests/components/pages/document-workspace.interactions.test.tsx`
     - `tests/components/pages/document-versions.interactions.test.tsx`
     - `tests/components/pages/framework-pages-smoke.test.tsx`
     - `tests/components/pages/additional-pages-smoke.test.tsx`
   - Full targeted validation passed:
     - `npm run check`
     - `npm run lint`
     - `npm run test -- tests/components/pages/document-workspace.interactions.test.tsx tests/components/pages/document-versions.interactions.test.tsx tests/components/pages/framework-pages-smoke.test.tsx tests/components/pages/additional-pages-smoke.test.tsx tests/components/dashboard.test.tsx tests/components/pages/admin-connectors-repository.test.tsx`

## Phase 3 Status Update (Resolved)
1. Repository analysis placeholder fallback context removed.
   - Upload now requires active organization/profile context and no longer uses `default-org` / `default-profile`.
   - Added clear UX guardrail in `client/src/pages/repository-analysis.tsx` to direct users to complete company profile setup before upload.
   - Updated repository page tests in `tests/components/pages/admin-connectors-repository.test.tsx` for explicit profile-context behavior.

## Remaining Findings

### Low / informational
1. Evidence ingestion uses simulated in-UI status progression after upload.
   - Evidence: `client/src/pages/evidence-ingestion.tsx:183`
   - Impact: visual status can drift from backend processing state.

## Pages reviewed as intentionally static (not wiring defects)
- Marketing/legal/public informational pages:
  - `client/src/pages/landing.tsx`
  - `client/src/pages/features.tsx`
  - `client/src/pages/pricing.tsx`
  - `client/src/pages/about.tsx`
  - `client/src/pages/privacy.tsx`
  - `client/src/pages/terms.tsx`
  - `client/src/pages/contact.tsx` (form submit path is wired)

## Updated Remediation Plan

### Phase 4 - Regression safety
1. Add integration coverage for:
   - Repository-analysis list -> detail route transition
   - Connectors Hub list/create/import
2. Add endpoint contract checks for dashboard generation and RUM metrics posting.

### Phase 5 - Evidence ingestion parity
1. Replace simulated post-upload status progression with backend-driven processing status.
2. Add polling/subscription contract for ingestion job state transitions.

## Recommended implementation order
1. Regression coverage for remaining page-wiring critical paths.
2. Evidence ingestion backend/status parity.
