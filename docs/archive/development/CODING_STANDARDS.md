# Coding Standards

**Last Updated:** January 20, 2026  
**Status:** Enforced  
**Owner:** Engineering Team

## Overview

This document defines code quality standards for the CyberDocGen project. All contributors must follow these guidelines.

## TypeScript Standards

### Configuration

**Strict Mode Required:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Safety

**✅ Good:**
```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'auditor';
}

function getUser(id: string): Promise<User | null> {
  // Implementation
}
```

**❌ Bad:**
```typescript
function getUser(id: any): Promise<any> {
  // No type safety
}
```

### Avoid `any`

Use `unknown` for truly dynamic types, then narrow with type guards:

```typescript
// ✅ Good
function processData(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  } else if (isUser(data)) {
    console.log(data.email);
  }
}

// ❌ Bad
function processData(data: any): void {
  console.log(data.anything); // No safety
}
```

### Null Safety

**Always handle null/undefined:**

```typescript
// ✅ Good
const user = await getUser(id);
if (!user) {
  throw new Error('User not found');
}
console.log(user.email); // Safe

// ❌ Bad
const user = await getUser(id);
console.log(user.email); // May be null!
```

## Code Organization

### File Naming

- **React Components:** PascalCase (`UserProfile.tsx`)
- **Utilities/Services:** camelCase (`authService.ts`)
- **Types/Interfaces:** PascalCase (`User.ts`)
- **Constants:** SCREAMING_SNAKE_CASE file (`API_CONSTANTS.ts`)

### Directory Structure

```
server/
├── config/           # Configuration modules
├── providers/        # Provider implementations
│   ├── interfaces.ts # Interface definitions
│   ├── index.ts      # Factory
│   ├── db/           # Database providers
│   ├── storage/      # Storage providers
│   ├── auth/         # Auth providers
│   └── secrets/      # Secrets providers
├── services/         # Business logic
├── routes/           # API endpoints
├── middleware/       # Express middleware
└── utils/            # Shared utilities

client/src/
├── pages/            # Route-level components
├── components/       # Reusable components
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── api/              # API client functions
└── utils/            # Frontend utilities
```

### Import Order

**Standard order:**
```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import express from 'express';

// 2. Internal absolute imports
import { getRuntimeConfig } from '@/server/config/runtime';
import { getProviders } from '@/server/providers';

// 3. Relative imports
import { UserProfile } from './UserProfile';
import type { User } from './types';

// 4. Styles
import './styles.css';
```

## Naming Conventions

### Variables & Functions

```typescript
// ✅ Good: Descriptive camelCase
const userEmail = 'user@example.com';
const isAuthenticated = true;

function calculateComplianceScore(data: AnalysisData): number {
  // Clear purpose
}

// ❌ Bad: Abbreviations, unclear names
const e = 'user@example.com';
const flag = true;

function calc(d: any): number {
  // What does this do?
}
```

### Constants

```typescript
// ✅ Good: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'https://api.example.com';

// ❌ Bad
const maxRetryAttempts = 3;
const defaultTimeout = 5000;
```

### Classes & Interfaces

```typescript
// ✅ Good: PascalCase, descriptive names
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}

class ComplianceAnalyzer {
  analyze(document: Document): AnalysisResult {
    // Implementation
  }
}

// ❌ Bad
interface prefs {
  t: string;
  n: boolean;
}

class analyzer {
  // No clear responsibility
}
```

### Provider Interfaces

**Prefix with `I`:**
```typescript
interface IDbProvider { ... }
interface IStorageProvider { ... }
interface IAuthProvider { ... }
```

**Implementations use descriptive names:**
```typescript
class PostgresDbProvider implements IDbProvider { ... }
class SqliteDbProvider implements IDbProvider { ... }
```

## Function Design

### Keep Functions Small

**Target:** < 50 lines per function

```typescript
// ✅ Good: Single responsibility
async function createUser(data: CreateUserData): Promise<User> {
  validateUserData(data);
  const hashedPassword = await hashPassword(data.password);
  const user = await saveUser({ ...data, password: hashedPassword });
  await sendWelcomeEmail(user.email);
  return user;
}

// ❌ Bad: Too many responsibilities
async function createUser(data: any): Promise<any> {
  // 200 lines of validation, hashing, saving, emailing, logging...
}
```

### Pure Functions Preferred

```typescript
// ✅ Good: Pure (no side effects)
function calculateScore(data: AnalysisData): number {
  return data.passed / data.total;
}

// ⚠️ OK but document side effects
async function saveAnalysis(data: AnalysisData): Promise<void> {
  // Side effect: writes to database
  await db.insert(analysisTable).values(data);
}
```

## Error Handling

### Use Try/Catch for Async

```typescript
// ✅ Good
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}

// ❌ Bad: Unhandled promise rejection
async function fetchUser(id: string): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  return user;
}
```

### Custom Error Classes

```typescript
// ✅ Good
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public fields: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use them
throw new NotFoundError('Document not found');
throw new ValidationError('Invalid input', ['email', 'password']);
```

## Comments & Documentation

### JSDoc for Public APIs

```typescript
/**
 * Calculate compliance score based on analysis data
 * 
 * @param data - The analysis data containing passed and total checks
 * @returns A score between 0 and 1
 * @throws {ValidationError} If data is invalid
 * 
 * @example
 * ```typescript
 * const score = calculateScore({ passed: 8, total: 10 });
 * console.log(score); // 0.8
 * ```
 */
export function calculateScore(data: AnalysisData): number {
  if (data.total === 0) {
    throw new ValidationError('Total cannot be zero');
  }
  return data.passed / data.total;
}
```

### Inline Comments: Why, Not What

```typescript
// ✅ Good: Explains rationale
// Use setTimeout to avoid blocking the event loop during heavy computation
await new Promise(resolve => setTimeout(resolve, 0));

// ❌ Bad: States the obvious
// Increment counter
counter++;
```

### TODOs Must Have Owner & Date

```typescript
// ✅ Good
// TODO(sprint-1): Implement SQLite provider - Kevin - 2026-01-20
// TODO(kevin): Add retry logic - 2026-01-20

// ❌ Bad
// TODO: fix this
```

## Testing Standards

### Test File Naming

- Unit tests: `filename.test.ts`
- Integration tests: `filename.integration.test.ts`
- E2E tests: `filename.e2e.test.ts`

### Test Structure (AAA Pattern)

```typescript
describe('calculateScore', () => {
  it('should return correct score for valid data', () => {
    // Arrange
    const data = { passed: 8, total: 10 };
    
    // Act
    const score = calculateScore(data);
    
    // Assert
    expect(score).toBe(0.8);
  });

  it('should throw ValidationError when total is zero', () => {
    // Arrange
    const data = { passed: 0, total: 0 };
    
    // Act & Assert
    expect(() => calculateScore(data)).toThrow(ValidationError);
  });
});
```

### Mock Providers in Tests

```typescript
// ✅ Good: Mock provider interfaces
const mockDbProvider: IDbProvider = {
  query: vi.fn().mockResolvedValue([]),
  connect: vi.fn(),
  migrate: vi.fn(),
  transaction: vi.fn(),
  healthCheck: vi.fn().mockResolvedValue(true),
  close: vi.fn(),
};

// Use in tests
const result = await someService(mockDbProvider);
```

## Git Workflow

### Branch Naming

**Format:** `<type>/<sprint>/<short-description>`

**Examples:**
- `feat/sprint-1/sqlite-provider`
- `fix/sprint-2/auth-bypass-bug`
- `docs/sprint-0/architecture`
- `refactor/sprint-1/provider-factory`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build/tooling changes

### Commit Messages (Conventional Commits)

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
```
feat(providers): add SQLite database provider

Implement SqliteDbProvider with auto-migration support.
Stores database file in Electron userData directory.

Closes #123
```

```
fix(auth): resolve localhost binding in local mode

Server was binding to 0.0.0.0 even in local mode.
Now correctly binds to 127.0.0.1 when DEPLOYMENT_MODE=local.

Fixes #456
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### Pull Request Requirements

**All PRs must have:**
1. ✅ Descriptive title (same as commit message format)
2. ✅ Description of changes
3. ✅ Screenshots (if UI changes)
4. ✅ Test plan (manual or automated)
5. ✅ Reviewer approval (minimum 1)
6. ✅ CI passing (linting, tests, build)

**PR Template:**
```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Linting & Formatting

### ESLint

**Required rules:**
- `@typescript-eslint/no-explicit-any` - Error
- `@typescript-eslint/no-unused-vars` - Error
- `@typescript-eslint/explicit-function-return-type` - Warn

### Prettier

**Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Pre-commit Hooks

**Required hooks:**
```bash
# Husky + lint-staged
npm run lint      # ESLint check
npm run format    # Prettier check
npm run typecheck # TypeScript compilation
npm test          # Run tests
```

## Security Standards

### Never Commit Secrets

```typescript
// ❌ NEVER
const API_KEY = 'sk-proj-abc123...';

// ✅ Always use environment variables or secrets provider
const providers = await getProviders();
const apiKey = await providers.secrets.get('openai-api-key');
```

### Validate All Inputs

```typescript
// ✅ Good: Zod validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'auditor']),
});

app.post('/api/users', async (req, res) => {
  const data = CreateUserSchema.parse(req.body);
  // Safe to use data
});
```

### Sanitize Log Output

```typescript
// ✅ Good: Redact sensitive data
logger.info('User login', { 
  userId: user.id, 
  email: maskEmail(user.email) 
});

// ❌ Bad: Logs sensitive data
logger.info('User login', { password: req.body.password });
```

## Performance Guidelines

### Async/Await Over Callbacks

```typescript
// ✅ Good
const user = await getUser(id);
const profile = await getProfile(user.profileId);

// ❌ Bad
getUser(id, (user) => {
  getProfile(user.profileId, (profile) => {
    // Callback hell
  });
});
```

### Parallel Requests When Possible

```typescript
// ✅ Good: Parallel
const [user, settings, preferences] = await Promise.all([
  getUser(id),
  getSettings(id),
  getPreferences(id),
]);

// ❌ Bad: Sequential (slower)
const user = await getUser(id);
const settings = await getSettings(id);
const preferences = await getPreferences(id);
```

## Accessibility (Frontend)

### Semantic HTML

```tsx
// ✅ Good
<button onClick={handleClick}>Submit</button>
<nav><a href="/dashboard">Dashboard</a></nav>

// ❌ Bad
<div onClick={handleClick}>Submit</div>
<div><span onClick={goTo}>Dashboard</span></div>
```

### ARIA Labels

```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon />
</button>

// ❌ Bad
<button onClick={onClose}>
  <XIcon />
</button>
```

## Code Review Checklist

**Reviewers must verify:**
- [ ] Code follows TypeScript strict mode
- [ ] No `any` types (or justified)
- [ ] Error handling present
- [ ] Tests added/updated
- [ ] No security vulnerabilities
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] Deployment mode handled correctly (if applicable)
- [ ] Provider pattern used (if environment-specific)

## References

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

## Changelog

- 2026-01-20 - Initial coding standards (Sprint 0)
