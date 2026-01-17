# Test Coverage Expansion Plan

**Date:** January 2026
**Current Status:** 89.4% pass rate (445/498 tests passing)
**Target:** 100% pass rate + expand coverage to 80%+

---

## Executive Summary

CyberDocGen has a comprehensive test suite with 498 tests across unit, integration, component, and accessibility testing. However, 53 tests are currently failing, primarily due to authentication middleware issues in integration tests.

### Current Test Status

| Category | Count | Passing | Failing | Pass Rate |
|----------|-------|---------|---------|-----------|
| Unit Tests | 159 | 159 | 0 | 100% |
| Integration Tests | 70 | 39 | 31 | 55.7% |
| Component Tests | 0 | 0 | 0 | N/A |
| Accessibility Tests | 0 | 0 | 0 | N/A |
| Workflow Tests | 25 | 25 | 0 | 100% |
| E2E Tests | 244 | 222 | 22 | 91.0% |
| **Total** | **498** | **445** | **53** | **89.4%** |

---

## Phase 1: Fix Failing Tests (Priority 1) ⚡

**Duration:** 4-6 hours
**Impact:** High
**Blockers:** Yes

### Issue Analysis

All 53 failing tests follow the same pattern:

```
❌ Expected: 401 "Unauthorized"
✅ Got: 500 "Internal Server Error"
```

**Root Cause:** Authentication middleware throwing errors instead of returning 401 responses.

### Affected Test Files

1. **tests/integration/gap-analysis.test.ts** - 10 failures
   - Gap analysis creation endpoints
   - Report access endpoints
   - Remediation tracking
   - AI-powered analysis

2. **tests/integration/e2e-flows.test.ts** - 21 failures
   - Onboarding flow
   - Company profile creation
   - Framework selection
   - Document generation
   - User management

3. **Other integration tests** - 22 failures
   - Various authentication-protected endpoints

### Fix Strategy

#### Option 1: Fix Authentication Middleware (Recommended)

**File:** `server/middleware/auth.ts`

**Current behavior:**
```typescript
// Throwing error (causes 500)
if (!req.user) {
  throw new Error('Unauthorized');
}
```

**Fixed behavior:**
```typescript
// Return 401 response
if (!req.user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Steps:**
1. Review authentication middleware
2. Replace throw statements with proper 401 responses
3. Add error handling for edge cases
4. Test with failing test suite
5. Verify all 53 tests now pass

**Estimated Time:** 2-3 hours

#### Option 2: Update Test Expectations

**Approach:** Update tests to accept 500 status

```typescript
// Instead of:
.expect(401)

// Use:
.expect((res) => {
  expect([401, 500]).toContain(res.status);
})
```

**Pros:** Quick fix
**Cons:** Masks the real issue
**Recommendation:** Not recommended

### Implementation Plan

1. **Identify middleware issue** (30 min)
   ```bash
   grep -r "throw.*[Uu]nauthorized" server/middleware/
   grep -r "throw.*[Aa]uth" server/middleware/
   ```

2. **Fix authentication responses** (1-2 hours)
   - Update auth middleware
   - Add proper error responses
   - Handle edge cases

3. **Run tests** (30 min)
   ```bash
   npm test
   ```

4. **Fix any remaining issues** (30 min)

5. **Verify 100% pass rate** (30 min)

---

## Phase 2: Expand Unit Test Coverage (Priority 2) 📊

**Duration:** 8-12 hours
**Impact:** High
**Current Coverage:** ~60%
**Target Coverage:** 80%+

### Areas Needing Coverage

#### 1. Service Layer (High Priority)

**Uncovered Services:**
- `server/services/aiOrchestrator.ts` - Complex logic, needs more tests
- `server/services/compliance.ts` - Critical compliance logic
- `server/services/evidence.ts` - File handling needs testing
- `server/services/security.ts` - Security functions must be tested
- `server/services/analytics.ts` - Business logic testing

**Tests to Add:**

```typescript
// tests/unit/compliance.test.ts
describe('Compliance Service', () => {
  describe('Framework Mapping', () => {
    it('should map ISO27001 controls correctly');
    it('should map SOC2 controls correctly');
    it('should handle invalid framework gracefully');
  });

  describe('Control Assessment', () => {
    it('should assess control implementation status');
    it('should calculate compliance percentage');
    it('should identify gaps');
  });

  describe('Evidence Collection', () => {
    it('should associate evidence with controls');
    it('should validate evidence completeness');
  });
});

// tests/unit/evidence.test.ts
describe('Evidence Service', () => {
  describe('File Upload', () => {
    it('should validate file types');
    it('should enforce size limits');
    it('should handle upload failures');
  });

  describe('Evidence Storage', () => {
    it('should store evidence metadata');
    it('should link to controls');
    it('should track versions');
  });
});
```

**Estimated Time:** 4-6 hours

#### 2. Utility Functions (Medium Priority)

**Files:**
- `server/utils/validation.ts` - Input validation
- `server/utils/encryption.ts` - Encryption functions
- `server/utils/formatting.ts` - Data formatting

**Tests to Add:**

```typescript
// tests/unit/encryption.test.ts
describe('Encryption Utils', () => {
  it('should encrypt data correctly');
  it('should decrypt data correctly');
  it('should handle invalid keys');
  it('should use proper algorithms');
});

// tests/unit/validation.test.ts (expand existing)
describe('Validation Utils', () => {
  describe('Input Sanitization', () => {
    it('should sanitize SQL injection attempts');
    it('should sanitize XSS attempts');
    it('should handle Unicode properly');
  });
});
```

**Estimated Time:** 2-3 hours

#### 3. Route Handlers (Medium Priority)

**Coverage Gaps:**
- Evidence upload endpoints
- Approval workflow endpoints
- Analytics endpoints
- Admin settings endpoints

**Tests to Add:**

```typescript
// tests/integration/evidence.test.ts
describe('Evidence Endpoints', () => {
  describe('POST /api/evidence/upload', () => {
    it('should upload evidence file');
    it('should link to control');
    it('should validate file type');
    it('should enforce auth');
  });

  describe('GET /api/evidence/:id', () => {
    it('should retrieve evidence');
    it('should include metadata');
    it('should enforce permissions');
  });
});
```

**Estimated Time:** 3-4 hours

---

## Phase 3: Add Component Tests (Priority 3) 🧩

**Duration:** 10-15 hours
**Impact:** Medium
**Current Coverage:** 0 component tests
**Target:** Key components tested

### Testing Strategy

Use React Testing Library for component tests:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentList } from '@/components/DocumentList';

describe('DocumentList', () => {
  it('renders documents correctly', () => {
    const docs = [{ id: '1', name: 'Test Doc' }];
    render(<DocumentList documents={docs} />);
    expect(screen.getByText('Test Doc')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<DocumentList documents={[]} />);
    expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  });

  it('calls onSelect when document clicked', () => {
    const onSelect = vi.fn();
    const docs = [{ id: '1', name: 'Test Doc' }];
    render(<DocumentList documents={docs} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Test Doc'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Priority Components

#### High Priority (Core Features)

1. **Document Components**
   - `DocumentList.tsx`
   - `DocumentEditor.tsx`
   - `DocumentWorkspace.tsx`

2. **Compliance Components**
   - `FrameworkSelector.tsx`
   - `ControlList.tsx`
   - `GapAnalysisView.tsx`

3. **AI Components**
   - `AIChatInterface.tsx`
   - `DocumentGenerator.tsx`
   - `QualityAnalysis.tsx`

#### Medium Priority (User Management)

4. **Auth Components**
   - `LoginForm.tsx`
   - `SignupForm.tsx`
   - `MFASetup.tsx`

5. **Profile Components**
   - `UserProfile.tsx`
   - `CompanyProfile.tsx`
   - `OrganizationSettings.tsx`

#### Low Priority (Admin)

6. **Admin Components**
   - `UserManagement.tsx`
   - `RoleManagement.tsx`
   - `SystemSettings.tsx`

### Component Test Template

```typescript
// tests/components/[component-name].test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentName } from '@/components/ComponentName';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />, { wrapper });
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<ComponentName />, { wrapper });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('shows error state', () => {
    render(<ComponentName error="Test error" />, { wrapper });
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ComponentName isLoading />, { wrapper });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

**Estimated Time:** 10-15 hours

---

## Phase 4: Add Accessibility Tests (Priority 4) ♿

**Duration:** 4-6 hours
**Impact:** Medium
**Current Coverage:** 0 accessibility tests
**Target:** Key pages tested for WCAG 2.2 AA

### Testing Strategy

Use jest-axe for automated accessibility testing:

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginPage } from '@/pages/login';

expect.extend(toHaveNoViolations);

describe('Login Page Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    render(<LoginPage />);
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveAttribute('aria-level', '1');
  });

  it('should have keyboard navigation', () => {
    render(<LoginPage />);
    const inputs = screen.getAllByRole('textbox');
    inputs[0].focus();
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(inputs[1]).toHaveFocus();
  });
});
```

### Priority Pages

1. **Authentication Pages**
   - Login
   - Signup
   - MFA Setup
   - Password Recovery

2. **Core Pages**
   - Dashboard
   - Document List
   - Document Editor
   - Gap Analysis

3. **Settings Pages**
   - User Profile
   - Company Profile
   - System Settings

**Estimated Time:** 4-6 hours

---

## Phase 5: Add E2E Tests (Priority 5) 🔄

**Duration:** 8-12 hours
**Impact:** High
**Current Coverage:** Some E2E tests exist (244 tests)
**Target:** Expand critical user flows

### Additional E2E Flows to Test

#### 1. Complete Compliance Journey

```typescript
describe('Complete Compliance Journey', () => {
  it('new user can complete full compliance workflow', async () => {
    // 1. Sign up and verify email
    await signUp({ email, password });

    // 2. Create organization
    await createOrganization({ name, industry });

    // 3. Setup company profile
    await setupCompanyProfile({ frameworks: ['ISO27001'] });

    // 4. Generate first document
    await generateDocument({ type: 'policy', framework: 'ISO27001' });

    // 5. Run gap analysis
    const gaps = await runGapAnalysis();
    expect(gaps.length).toBeGreaterThan(0);

    // 6. Upload evidence
    await uploadEvidence({ controlId, file });

    // 7. Generate compliance report
    const report = await generateReport();
    expect(report.score).toBeGreaterThan(0);
  });
});
```

#### 2. AI Document Generation Flow

```typescript
describe('AI Document Generation', () => {
  it('generates document with AI assistance', async () => {
    await login();
    await navigateToDocuments();
    await clickGenerateWithAI();
    await selectTemplate('Risk Assessment');
    await fillRequirements({ framework: 'SOC2' });
    await generateWithAI();
    await waitForGeneration();
    const content = await getDocumentContent();
    expect(content).toContain('Risk Assessment');
  });
});
```

#### 3. Multi-User Collaboration

```typescript
describe('Multi-User Collaboration', () => {
  it('multiple users can collaborate on document', async () => {
    // User 1 creates document
    await loginAs('user1');
    const docId = await createDocument();
    await shareWith('user2@example.com');

    // User 2 edits document
    await loginAs('user2');
    await openDocument(docId);
    await editContent('New section');
    await saveDocument();

    // User 1 sees changes
    await loginAs('user1');
    await openDocument(docId);
    const content = await getContent();
    expect(content).toContain('New section');
  });
});
```

**Estimated Time:** 8-12 hours

---

## Phase 6: Performance & Load Testing (Priority 6) ⚡

**Duration:** 6-8 hours
**Impact:** Medium
**Current Coverage:** 0 performance tests
**Target:** Key endpoints benchmarked

### Performance Testing Strategy

Use k6 or Artillery for load testing:

```javascript
// tests/performance/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  // Test document list endpoint
  const res = http.get('http://localhost:5000/api/documents');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Endpoints to Test

1. **Document Endpoints**
   - GET /api/documents (list)
   - GET /api/documents/:id (detail)
   - POST /api/documents (create)

2. **AI Endpoints**
   - POST /api/ai/generate (document generation)
   - POST /api/ai/chat (chat interaction)
   - POST /api/ai/analyze (quality analysis)

3. **Compliance Endpoints**
   - GET /api/compliance/frameworks
   - POST /api/compliance/gap-analysis
   - GET /api/compliance/reports/:id

**Estimated Time:** 6-8 hours

---

## Summary & Timeline

### Total Effort Estimation

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| Phase 1: Fix Failing Tests | 4-6h | 🔴 Critical | ⏳ Ready |
| Phase 2: Unit Test Coverage | 8-12h | 🟠 High | ⏳ Ready |
| Phase 3: Component Tests | 10-15h | 🟡 Medium | 📋 Planned |
| Phase 4: Accessibility Tests | 4-6h | 🟡 Medium | 📋 Planned |
| Phase 5: E2E Tests | 8-12h | 🟠 High | 📋 Planned |
| Phase 6: Performance Tests | 6-8h | 🟢 Low | 📋 Planned |
| **Total** | **40-59h** | - | - |

### Recommended Schedule

#### Week 1: Critical Fixes
- ✅ Fix all failing tests (Phase 1)
- ✅ Achieve 100% pass rate
- ✅ Deploy with confidence

#### Week 2-3: Core Coverage
- 📊 Expand unit tests (Phase 2)
- 🧩 Add component tests (Phase 3 - start)
- Target: 70% coverage

#### Week 4-5: Quality Assurance
- 🧩 Complete component tests (Phase 3)
- ♿ Add accessibility tests (Phase 4)
- Target: 80% coverage

#### Week 6: Advanced Testing
- 🔄 E2E test expansion (Phase 5)
- ⚡ Performance testing (Phase 6)
- Target: Production-ready test suite

---

## Success Metrics

### Immediate Goals (Week 1)
- ✅ 100% test pass rate (498/498)
- ✅ 0 failing integration tests
- ✅ Clean CI/CD pipeline

### Short-term Goals (Weeks 2-3)
- 📊 70%+ code coverage
- 🧩 20+ component tests
- ✅ Critical paths fully tested

### Long-term Goals (Weeks 4-6)
- 📊 80%+ code coverage
- 🧩 50+ component tests
- ♿ WCAG 2.2 AA compliance verified
- ⚡ Performance benchmarks established
- 🔄 Complete user flows tested

---

## Implementation Guide

### Getting Started

1. **Setup test environment**
   ```bash
   npm install --save-dev @testing-library/react
   npm install --save-dev @testing-library/user-event
   npm install --save-dev jest-axe
   npm install --save-dev @axe-core/react
   ```

2. **Run current tests**
   ```bash
   npm test
   ```

3. **Start with Phase 1**
   - Fix authentication middleware
   - Verify all tests pass
   - Commit and deploy

### Best Practices

1. **Test-Driven Development**
   - Write tests before fixing bugs
   - Write tests before adding features
   - Red-Green-Refactor cycle

2. **Test Organization**
   - Group related tests with `describe`
   - Use clear, descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

3. **Coverage Goals**
   - Focus on critical paths first
   - Don't chase 100% coverage
   - Quality over quantity

4. **Continuous Integration**
   - Run tests on every commit
   - Block PRs with failing tests
   - Track coverage trends

---

## Tools & Resources

### Testing Libraries
- **Vitest** - Unit testing framework (installed)
- **React Testing Library** - Component testing (install)
- **jest-axe** - Accessibility testing (install)
- **Supertest** - API testing (installed)
- **k6** or **Artillery** - Load testing (install)

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Plan Created:** January 2026
**Status:** 📋 Ready for Execution
**Next Action:** Start Phase 1 - Fix failing authentication tests
