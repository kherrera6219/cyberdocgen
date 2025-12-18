# CyberDocGen - Error & Bug TODO List

**Date:** December 18, 2025
**Branch:** `claude/debug-app-scan-mugZo`
**Scan Type:** Comprehensive Application Debugging & Error Analysis
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

Comprehensive debugging scan identified **22 critical issues** across the application:
- **1 blocking TypeScript error** (35+ syntax errors)
- **3 test failures** (integration tests)
- **4 security vulnerabilities** (npm packages)
- **15+ TODO implementations** (incomplete features)
- **371 console statements** (code quality)
- **Performance issues** (1.1 MB bundle size)

**Overall Application Health:** ⚠️ **REQUIRES ATTENTION**
- ✅ Build succeeds (with warnings)
- ✅ 498/498 tests pass (unit & component)
- ⚠️ 3 integration tests fail (object storage)
- ❌ TypeScript type checking fails

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. TypeScript Compilation Failure ❌

**File:** `client/src/styles/focusStyles.ts`
**Lines:** 14-40
**Error Count:** 35+ syntax errors

**Problem:**
CSS class selectors (`.focus-visible`, `.dark`, `.btn-focus`, etc.) are written directly in a TypeScript file, causing compilation to fail.

```typescript
// WRONG - CSS in .ts file
.focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}
```

**Impact:**
- `npm run check` fails
- Type safety compromised
- CI/CD pipeline blocked

**Solution:**
1. Move CSS classes to a proper CSS/SCSS file or Tailwind config
2. Keep only TypeScript exports in `.ts` file
3. Re-run `npm run check` to verify

**Priority:** 🔴 **CRITICAL** - Blocks type checking
**Effort:** 30 minutes

---

### 2. Integration Test Failures ⚠️

**Failing Tests:** 3
**Error:** `ECONNREFUSED 127.0.0.1:1106`

**Affected Files:**
- `tests/integration/documents.test.ts`
- `tests/integration/auth.test.ts`
- `tests/integration/api.test.ts`

**Problem:**
Tests try to connect to Replit Object Storage sidecar at `127.0.0.1:1106`, but the service isn't running in test environment.

**Root Cause:**
```typescript
// @replit/object-storage tries to connect to sidecar
TypeError: fetch failed
 ❯ getDefaultBucketId node_modules/@replit/object-storage/src/sidecar.ts:4:20
 ❯ Client.init node_modules/@replit/object-storage/src/client.ts:134:52
```

**Solution:**
1. Mock `@replit/object-storage` in test setup
2. Add conditional initialization (skip if sidecar unavailable)
3. Use in-memory storage for tests

**Priority:** 🟠 **HIGH** - Tests fail in CI/CD
**Effort:** 1-2 hours

---

### 3. NPM Security Vulnerabilities 🔒

**Severity:** 4 moderate
**Affected Packages:**
- `esbuild@<=0.24.2` (CVE-2024-XXXX)
- `drizzle-kit@0.31.8`
- `@esbuild-kit/core-utils`
- `@esbuild-kit/esm-loader`

**Vulnerability Details:**
```
CVE: GHSA-67mh-4wv8-2f99
Title: esbuild enables any website to send requests to dev server
Severity: Moderate (CVSS 5.3)
CWE: CWE-346 (Origin Validation Error)
```

**Fix Available:**
```bash
npm audit fix --force  # Updates drizzle-kit to v0.18.1 (BREAKING)
```

**Impact:**
- Development server vulnerable to CSRF
- Potential data exposure during development

**Priority:** 🟠 **HIGH** - Security risk
**Effort:** 15 minutes (testing required)

---

## 🟠 HIGH PRIORITY ISSUES

### 4. Bundle Size Optimization ⚡

**Current Size:** 1,121.23 kB (main chunk)
**Recommended:** < 500 kB
**Excess:** 621 kB over limit

**Build Warning:**
```
(!) Some chunks are larger than 500 kB after minification
```

**Problem Areas:**
- All components bundled in single chunk
- No code splitting
- No lazy loading for routes

**Solution:**
1. Implement route-based code splitting
2. Lazy load AI components
3. Use dynamic imports for heavy libraries
4. Split vendor chunks

**Priority:** 🟠 **HIGH** - Performance impact
**Effort:** 2-3 hours

---

### 5. Duplicate Import Pattern ⚠️

**File:** `client/src/pages/audit-trail-complete.tsx`

**Problem:**
```
audit-trail-complete.tsx is dynamically imported by App.tsx
but also statically imported by audit-trail.tsx
```

**Impact:**
- Bundle duplication
- Inefficient code splitting
- Larger download size

**Solution:**
Remove static import, use only dynamic import

**Priority:** 🟠 **HIGH** - Bundle optimization
**Effort:** 10 minutes

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Console Statement Usage (371 occurrences)

**Files Affected:** 32 files
**Pattern:** `console.log()`, `console.warn()`, `console.error()`

**Top Offenders:**
- `development-archive/testing-reports/*.js` - 30 occurrences
- `scripts/*.ts` - 25 occurrences
- `server/utils/logger.ts` - 16 occurrences
- `client/src/hooks/*.ts` - 5 occurrences
- `tests/**/*.test.tsx` - 4 occurrences

**Problem:**
- Violates ESLint `no-console` rule
- Sensitive data may leak to console
- Not production-ready logging

**Solution:**
1. Replace with `logger.info()`, `logger.error()` in server code
2. Remove from client code or use proper error tracking
3. Keep only in test files (acceptable)

**Priority:** 🟡 **MEDIUM** - Code quality
**Effort:** 2-3 hours

---

### 7. Missing Environment Configuration 📋

**Current State:** Only `.env.example` and `.env.production.example` exist
**Missing:** `.env` file with actual values

**Required Variables:**
```bash
# Database
DATABASE_URL=postgresql://...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Security
SESSION_SECRET=...
ENCRYPTION_KEY=...

# Application
NODE_ENV=development
PORT=5000
LOG_LEVEL=info
```

**Priority:** 🟡 **MEDIUM** - Development setup
**Effort:** 10 minutes (per developer)

---

## 🔵 INCOMPLETE FEATURES (TODOs)

### 8. Backend Route TODOs (11 items)

#### Analytics Route (`server/routes/analytics.ts`)
- **Line 90:** `// TODO: Implement actual gap analysis logic`
- **Function:** `GET /api/analytics/gap-analysis`
- **Impact:** Gap analysis returns placeholder data

#### Controls Route (`server/routes/controls.ts`)
- **Line 22:** `// TODO: Implement approval listing`
- **Line 47:** `// TODO: Implement control approval`
- **Functions:** Approval workflows not functional

#### Documents Route (`server/routes/documents.ts`)
- **Line 450:** `// TODO: Implement document history tracking`
- **Impact:** Version history not saved

#### Auditor Route (`server/routes/auditor.ts`)
- **Line 22:** `// TODO: Implement auditor documents listing`
- **Line 41:** `// TODO: Implement compliance overview`
- **Line 60:** `// TODO: Implement audit report export`

#### Evidence Route (`server/routes/evidence.ts`)
- **Line 22:** `// TODO: Implement evidence upload`
- **Line 41:** `// TODO: Implement evidence listing`
- **Line 66:** `// TODO: Implement evidence to control mapping`

#### AI Route (`server/routes/ai.ts`)
- **Line 759:** `// TODO: Implement AI statistics tracking`

#### Audit Trail Route (`server/routes/auditTrail.ts`)
- **Line 57:** `// TODO: Implement get single audit entry`

**Priority:** 🔵 **MEDIUM-LOW** - Features incomplete but not blocking
**Effort:** 6-8 hours total

---

### 9. Backend Service TODOs (2 items)

#### AI Guardrails Service (`server/services/aiGuardrailsService.ts`)
- **Line 471:** `// TODO: Implement actual query`
- **Line 487:** `// TODO: Implement actual update`
- **Impact:** Audit history storage not persistent

#### Data Retention Service (`server/services/dataRetentionService.ts`)
- **Line 268:** `// TODO: Implement actual data cleanup based on dataType`
- **Impact:** Data cleanup not fully automated

**Priority:** 🔵 **MEDIUM** - Compliance features
**Effort:** 2-3 hours

---

### 10. Frontend TODOs (2 items)

#### Error Boundary (`client/src/components/ErrorBoundary.tsx`)
- **Line 51:** `// TODO: Send to error tracking service (e.g., Sentry)`
- **Impact:** Errors not tracked in production

#### Company Profile (`client/src/pages/enhanced-company-profile.tsx`)
- **Line 125:** `createdBy: "temp-user-id" // TODO: Get from authenticated user`
- **Impact:** Hardcoded user ID

**Priority:** 🔵 **LOW** - Non-critical features
**Effort:** 1 hour

---

## 🟣 CODE QUALITY IMPROVEMENTS

### 11. TypeScript `any` Type Usage

**Files:** 20+ files
**Pattern:** Using `any` instead of proper types

**Examples:**
```typescript
// Found in multiple files
function process(data: any) { ... }
const result: any = await fetch(...)
```

**Solution:**
1. Define proper interfaces/types
2. Use `unknown` for truly dynamic data
3. Add type guards where needed

**Priority:** 🟣 **LOW** - Type safety improvement
**Effort:** 4-5 hours

---

### 12. Promise Pattern Modernization

**Files:** 15 files using `.then()/.catch()`
**Recommended:** Use `async/await`

**Files Affected:**
- `scripts/generate-sbom.ts`
- `scripts/phase*-completion.ts`
- `server/storage.ts`
- `client/public/sw.js`
- Others in docs and tests

**Solution:**
Convert promise chains to async/await for readability

**Priority:** 🟣 **LOW** - Code style
**Effort:** 2-3 hours

---

### 13. Accessibility Coverage

**Current:** 245 aria-/role/alt attributes
**Components:** 31 files
**Average:** ~8 attributes per file

**Assessment:** Moderate coverage, room for improvement

**Recommendations:**
1. Audit forms for proper labels
2. Add ARIA landmarks to layouts
3. Ensure all images have alt text
4. Test with screen readers

**Priority:** 🟣 **LOW** - Already has basic coverage
**Effort:** 3-4 hours for comprehensive audit

---

### 14. Async Error Handling

**Issue:** Some async functions lack try/catch blocks
**Risk:** Unhandled promise rejections

**Solution:**
1. Wrap async operations in try/catch
2. Add error boundaries for React components
3. Implement global error handlers

**Priority:** 🟣 **LOW** - Defensive programming
**Effort:** 2-3 hours

---

## 📊 Issue Summary by Priority

| Priority | Count | Total Effort |
|----------|-------|--------------|
| 🔴 Critical | 3 | 2-4 hours |
| 🟠 High | 3 | 4-6 hours |
| 🟡 Medium | 4 | 5-7 hours |
| 🔵 Features (TODO) | 11 | 9-12 hours |
| 🟣 Quality | 4 | 11-15 hours |
| **TOTAL** | **25** | **31-44 hours** |

---

## 🎯 Recommended Action Plan

### Week 1: Critical Fixes (Day 1-2)
1. ✅ Fix TypeScript compilation errors (focusStyles.ts)
2. ✅ Fix integration test failures (object storage mocking)
3. ✅ Update npm packages (security vulnerabilities)

### Week 1: High Priority (Day 3-5)
4. ✅ Optimize bundle size (code splitting)
5. ✅ Fix duplicate imports
6. ✅ Clean up console statements

### Week 2: Medium Priority (Day 6-10)
7. ✅ Complete backend route TODOs
8. ✅ Complete service TODOs
9. ✅ Add error tracking integration
10. ✅ Set up proper environment files

### Week 3: Code Quality (Day 11-15)
11. ✅ Replace `any` types
12. ✅ Modernize promise patterns
13. ✅ Improve accessibility
14. ✅ Add async error handling

---

## 📈 Success Metrics

**Phase Complete When:**
- ✅ TypeScript compilation passes (`npm run check`)
- ✅ All tests pass (498/498 + 3 integration)
- ✅ 0 security vulnerabilities
- ✅ Bundle size < 500 kB
- ✅ All TODO comments resolved
- ✅ ESLint passes with no warnings

---

## 🔗 Related Documents

- [Phase 5 Implementation Plan](PHASE_5_IMPLEMENTATION_PLAN.md)
- [Gap Analysis](GAP_ANALYSIS.md)
- [Testing Guide](TESTING.md)
- [Main TODO List](todo.md)

---

**Next Steps:** Review and approve Phase 5 implementation plan to address these issues systematically.
