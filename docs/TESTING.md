# Testing Guide

Comprehensive testing guide for CyberDocGen, covering unit tests, integration tests, component tests, and end-to-end testing strategies.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Types](#test-types)
- [Mocking and Fixtures](#mocking-and-fixtures)
- [Code Coverage](#code-coverage)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing strategy follows these principles:

1. **Test Pyramid Approach**
   - Many unit tests (fast, isolated)
   - Some integration tests (API, database)
   - Few component tests (UI behavior)
   - Minimal E2E tests (critical user flows)

2. **Test What Matters**
   - Focus on business logic and critical paths
   - Don't test implementation details
   - Test user-facing behavior
   - Prioritize high-value, high-risk code

3. **Fast and Reliable**
   - Tests should run quickly (< 1 minute for unit tests)
   - Tests should be deterministic (no flaky tests)
   - Use mocks to isolate external dependencies

4. **Maintainable Tests**
   - Clear, descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests simple and focused
   - Avoid test interdependencies

## Testing Stack

### Core Testing Tools

- **Vitest** - Fast unit test framework (Vite-native)

### Current Baseline (February 9, 2026)

Latest validated run:

- `npm run test:coverage`: **PASS** (160 files, 1514 passing, 4 skipped)

Global coverage snapshot:

- Statements/Lines: **78.97%**
- Functions: **67.45%**
- Branches: **74.56%**

Coverage infrastructure and newest additions:

- `npm run test:coverage:hotspots` -> folder/file uncovered-line ranking from `coverage-final.json`
- Shared page/component test harness:
  - `tests/components/utils/renderWithProviders.tsx`
- New high-impact smoke suites:
  - `tests/components/pages/framework-pages-smoke.test.tsx`
  - `tests/components/pages/additional-pages-smoke.test.tsx`
  - `tests/components/pages/public-pages-smoke.test.tsx`
  - `tests/components/coverage/high-impact-components-smoke.test.tsx`
- Expanded backend route/service tests:
  - `tests/unit/routes/localModeRoutes.test.ts`
  - `tests/unit/connectorService.test.ts`
  - `tests/unit/routes/projectsRoutes.test.ts`
  - `tests/unit/routes/analyticsRoutes.test.ts`
  - `tests/unit/routes/mfaRoutes.test.ts`
  - `tests/unit/routes/approvalsRoutes.test.ts`
  - `tests/unit/routes/auditTrailRoutes.test.ts`
  - `tests/unit/routes/auditorRoutes.test.ts`
  - `tests/unit/versionService.test.ts`
  - `tests/unit/companyDataExtractionService.test.ts`
  - `tests/unit/repoParserService.test.ts`
  - `tests/unit/cloudIntegrationService.test.ts`
  - `tests/unit/dataRetentionService.test.ts`
  - `tests/unit/systemConfigService.test.ts`
  - `tests/unit/connectorAdapters.test.ts`
  - `tests/unit/storage.test.ts` (MemStorage branch expansion)
  - `tests/unit/storage-db.test.ts` (DatabaseStorage branch expansion)
- New high-gap page and route coverage suites:
  - `tests/components/pages/company-profile.interactions.test.tsx`
  - `tests/components/pages/account-and-auth-pages.test.tsx`
  - `tests/components/pages/admin-connectors-repository.test.tsx`
  - `tests/components/pages/mfa-setup-page.test.tsx`
  - `tests/components/collaboration/document-comments.interactions.test.tsx`
  - `tests/components/auth/google-authenticator-setup.interactions.test.tsx`
  - `tests/components/pages/enhanced-company-profile.interactions.test.tsx`
  - `tests/components/notifications/notification-dropdown.interactions.test.tsx`
  - `tests/components/repository/repository-list.interactions.test.tsx`
  - `tests/components/repository/task-board.interactions.test.tsx`
  - `tests/components/hooks/useRepositoryAPI.test.tsx`
  - `tests/unit/routes/storageRoutes.test.ts`
  - `tests/unit/routes/adminRoutes.test.ts`
- New interaction and regression coverage in this cycle:
  - `tests/components/pages/audit-trail.interactions.test.tsx`
  - `tests/components/pages/control-approvals.interactions.test.tsx`
  - `tests/components/pages/evidence-ingestion.interactions.test.tsx`
  - `tests/unit/queryClient.apiRequest.test.ts`


- **Testing Library** - React component testing
- **Supertest** - HTTP API testing
- **Node Test Runner** - Native Node.js testing

### Testing Utilities

- **@testing-library/react** - React component utilities
- **@testing-library/jest-dom** - DOM matchers
- **vitest** - Test runner and assertions
- **supertest** - API endpoint testing

## Test Structure

```
tests/
├── setup.ts                 # Global test setup
├── unit/                    # Unit tests
│   ├── logger.test.ts
│   ├── validation.test.ts
│   └── storage.test.ts
├── integration/             # Integration tests
│   ├── api.test.ts
│   └── health.test.ts
└── components/              # Component tests
    └── ErrorBoundary.test.tsx
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Descriptive names matching the file/component tested
- Test cases: Clear descriptions of expected behavior

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test tests/unit/validation.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests by Pattern

```bash
npm test -- --grep "validation"
```

### Run Tests in CI Mode

```bash
npm test -- --run --reporter=verbose
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FeatureName', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize test data
  });

  // Cleanup after each test
  afterEach(() => {
    // Clean up resources
  });

  it('should behave as expected', () => {
    // Arrange: Set up test data
    const input = 'test input';

    // Act: Execute the code under test
    const result = functionUnderTest(input);

    // Assert: Verify the result
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => functionUnderTest(null)).toThrow();
  });
});
```

### Testing Asynchronous Code

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should handle promises', () => {
  return asyncFunction().then(result => {
    expect(result).toBe('expected');
  });
});
```

## Test Types

### Unit Tests

Test individual functions, classes, or modules in isolation.

**Example: Testing a Validation Function**

```typescript
// tests/unit/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from '../../server/utils/validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null as any)).toBe(false);
  });
});
```

**Example: Testing a Service Class**

```typescript
// tests/unit/logger.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../../server/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('INFO'),
      expect.stringContaining('Test message')
    );
  });

  it('should log errors with stack traces', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ERROR'),
      expect.anything()
    );
  });
});

**Example: Testing Complex Services (e.g. Threat Detection)**

```typescript
// tests/unit/threatDetectionService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThreatDetectionService } from '../../server/services/threatDetectionService';

describe('ThreatDetectionService', () => {
  let service: ThreatDetectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ThreatDetectionService();
  });

  it('should detect SQL injection patterns', () => {
    const req = {
      url: '/api/users',
      query: { id: "' OR '1'='1" },
      body: {},
      ip: '127.0.0.1',
      get: vi.fn()
    };

    const event = service.analyzeRequest(req);
    expect(event).toBeDefined();
    expect(event?.type).toBe('sql_injection');
  });
});
```

### Integration Tests

Test how multiple modules work together, including database operations and API endpoints.

**Example: Testing API Endpoints**

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { pool } from '../../server/db';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await pool.query('DROP SCHEMA IF EXISTS test CASCADE');
    await pool.query('CREATE SCHEMA test');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/documents', () => {
    it('should return list of documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/documents')
        .expect(401);
    });
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const newDocument = {
        title: 'Test Document',
        content: 'Test content',
        framework: 'ISO27001'
      };

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer test-token')
        .send(newDocument)
        .expect(201);

      expect(response.body).toMatchObject({
        title: newDocument.title,
        content: newDocument.content
      });
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);
    });
  });
});
```

**Example: Testing Database Operations**

```typescript
// tests/integration/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../server/db';
import { users } from '../../shared/schema';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Clean test data
    await db.delete(users);
  });

  it('should create and retrieve users', async () => {
    // Create user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      username: 'testuser'
    }).returning();

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');

    // Retrieve user
    const retrieved = await db.select()
      .from(users)
      .where(eq(users.id, user.id));

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].email).toBe('test@example.com');
  });
});
```

### Component Tests

Test React components in isolation.

**Example: Testing Error Boundary**

```typescript
// tests/components/ErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../client/src/components/ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
```

**Example: Testing Form Component**

```typescript
// tests/components/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../client/src/components/LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should display validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking and Fixtures

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('../../server/services/openai', () => ({
  generateDocument: vi.fn().mockResolvedValue({
    content: 'Mocked content'
  })
}));
```

### Mocking Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async mocked value');
mockFn.mockRejectedValue(new Error('mock error'));
```

### Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/users.ts
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date('2024-01-01')
};

export const mockUsers = [
  mockUser,
  { ...mockUser, id: '2', email: 'user2@example.com' }
];
```

## Code Coverage

### Generate Coverage Report

```bash
npm test -- --coverage
```

### Coverage Thresholds

Current enforced staged gate:
- **Statements**: 78.5%
- **Branches**: 74.5%
- **Functions**: 67%
- **Lines**: 78.5%

Long-term target:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### View Coverage Report

Coverage reports are generated in `coverage/` directory:

```bash
# Open HTML report
open coverage/index.html
```

### Focus Areas for Coverage

1. **Critical Business Logic** (aim for 100%)
   - Authentication and authorization
   - Payment processing
   - Document generation
   - Compliance calculations

2. **API Endpoints** (aim for 90%)
   - All routes tested
   - Error handling covered

3. **Utilities** (aim for 85%)
   - Validation functions
   - Data transformations
   - Helpers

## Continuous Integration

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled daily runs

Example workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Best Practices

### Test Naming

✅ **Good:**
```typescript
it('should create document with valid data')
it('should return 400 when email is invalid')
it('should redirect to login when not authenticated')
```

❌ **Bad:**
```typescript
it('works')
it('test 1')
it('document test')
```

### Test Independence

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests
- Be runnable in isolation

```typescript
describe('Document API', () => {
  beforeEach(async () => {
    // Clean slate for each test
    await db.delete(documents);
  });

  it('test 1', () => {
    // Test with its own data
  });

  it('test 2', () => {
    // Doesn't depend on test 1
  });
});
```

### Avoid Testing Implementation Details

❌ **Bad:** Testing internal state
```typescript
it('should set loading to true', () => {
  const component = render(<Component />);
  expect(component.state.loading).toBe(true);
});
```

✅ **Good:** Testing user-visible behavior
```typescript
it('should show loading spinner', () => {
  render(<Component />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Use Descriptive Assertions

```typescript
// Not helpful
expect(result).toBeTruthy();

// Clear and specific
expect(result.status).toBe('success');
expect(result.data).toHaveLength(5);
expect(result.errors).toBeUndefined();
```

## Troubleshooting

### Tests Timeout

```typescript
// Increase timeout for slow operations
it('should handle large file', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Database Connection Issues

```bash
# Ensure test database exists
createdb cyberdocgen_test

# Update DATABASE_URL for tests
export DATABASE_URL=postgresql://localhost/cyberdocgen_test
```

### Port Already in Use

```typescript
// Use dynamic port for tests
const port = process.env.TEST_PORT || 0; // 0 = random port
```

### Flaky Tests

Common causes:
- Race conditions
- External dependencies
- Shared state between tests
- Timing issues

Solutions:
- Use `waitFor` for async operations
- Mock external services
- Isolate test data
- Use `beforeEach` and `afterEach`

### Mock Not Working

```typescript
// Mock must be called before importing module
vi.mock('./module');
import { functionToTest } from './module';
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Questions?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.
