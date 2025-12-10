# CyberDocGen - Development Guide

## Overview

CyberDocGen is an enterprise-grade compliance management platform with AI-powered document generation and analysis. This guide covers development workflows, architecture patterns, and best practices for contributing to the project.

## Architecture

### Frontend Stack
- **React 18.3** - UI framework with concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 6.4** - Lightning-fast build tool with HMR
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack React Query 5.90** - Server state management
- **React Hook Form 7.66** - Performant form handling
- **Wouter 3.7** - Lightweight client-side routing
- **Zod 3.25** - Runtime type validation

### Backend Stack
- **Node.js 20** - JavaScript runtime
- **Express 4.21** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL 16** - Relational database (Neon serverless)
- **Drizzle ORM 0.39** - Type-safe database queries
- **Passport.js 0.7** - Authentication middleware

### AI Integration
- **OpenAI SDK 5.23** - GPT-5.1 (latest flagship model)
- **Anthropic SDK 0.70** - Claude Opus 4.5 (latest reasoning model)
- **Google GenAI 1.30** - Gemini 3.0 Pro (latest multimodal model)
- **Multi-Model Orchestration** - Intelligent routing with automatic fallback
- **AI Guardrails** - Safety checks, PII detection, prompt injection prevention

### Key Components

**40+ Page Components** including:
- Authentication (login, signup, MFA setup, password reset)
- Dashboards (main dashboard, admin settings)
- Frameworks (ISO 27001, SOC 2, FedRAMP, NIST)
- Documents (workspace, versions, AI generator)
- Compliance (gap analysis, control approvals, auditor workspace)
- Analytics (audit trail, metrics)
- Integrations (cloud sync, MCP tools)

**80+ Reusable Components** organized by domain:
- `ai/` - AI-specific components (11 files)
- `auth/` - Authentication components
- `compliance/` - Compliance UI
- `ui/` - Base UI components (Radix-based)

**16 API Route Modules**:
- `ai.ts` (538 LOC) - AI operations
- `documents.ts` (428 LOC) - Document CRUD
- `storage.ts` (429 LOC) - File storage
- `admin.ts` (408 LOC) - Admin operations
- `mfa.ts` (394 LOC) - Multi-factor auth
- `enterpriseAuth.ts` (449 LOC) - Enterprise auth
- `gapAnalysis.ts` (263 LOC) - Gap analysis
- Plus 9 more modules

**33 Business Services**:
- AI services (orchestrator, guardrails, fine-tuning)
- Compliance services (gap analysis, quality scoring, risk assessment)
- Security services (audit, threat detection, MFA, encryption)
- Enterprise services (auth, cloud integration, chatbot)
- Operational services (alerting, monitoring, key rotation)

## Development Workflow

### Quick Start
```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Run type checking
npm run check

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build

# Run production server
npm start

# Database operations
npm run db:push  # Apply schema changes
```

### Development Server
The development server runs on `http://localhost:5000` with:
- **Hot Module Replacement (HMR)** - Instant updates on file changes
- **TypeScript Compilation** - Real-time type checking
- **API Proxy** - Frontend proxies to backend
- **Auto-restart** - Backend restarts on changes

### Project Structure
```
cyberdocgen/
├── client/                 # React frontend (8,000+ LOC)
│   ├── src/
│   │   ├── pages/         # 40+ page components
│   │   ├── components/    # 80+ reusable components
│   │   ├── hooks/         # 5 custom hooks
│   │   ├── contexts/      # Context providers
│   │   ├── lib/           # Utilities (queryClient, auth)
│   │   └── main.tsx       # Entry point
│   └── index.html
│
├── server/                 # Express backend (8,000+ LOC)
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # Route registration
│   ├── routes/            # 16 route modules
│   ├── services/          # 33 business services
│   ├── middleware/        # 4 middleware files
│   ├── mcp/               # Model Context Protocol
│   ├── monitoring/        # Metrics collection
│   ├── utils/             # Logging, validation
│   └── validation/        # Request schemas
│
├── shared/                 # Shared code
│   └── schema.ts          # Database schema (1,000+ LOC)
│
├── tests/                  # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── components/        # Component tests
│
├── scripts/                # Utility scripts (13 files)
└── docs/                   # Documentation (14 files)
```

## Branching Strategy

### Mainline Development
- **`main` branch** - Single source of truth, all active development
- **Feature branches** - Short-lived, tight scope, merge via PR
- **Delete after merge** - Keep repository clean

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with tests
3. Run `npm run check` and `npm test`
4. Open PR with clear description
5. Address review feedback
6. Merge and delete branch

## Quality Gates

### Type Safety
```bash
# Run TypeScript type checking
npm run check

# Fix type errors before committing
# Known legacy UI forms have type errors - prioritize fixing touched areas
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/unit/validation.test.ts

# Watch mode
npm test -- --watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Format code with Prettier (if configured)
npm run format
```

### Security
```bash
# Check for vulnerabilities
npm audit --audit-level=high

# Review GitHub security alerts
# Patch or pin vulnerable packages
```

## Key Development Patterns

### API Route Handler Pattern
```typescript
// server/routes/example.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

router.post('/endpoint', validateRequest(schema), async (req, res) => {
  try {
    // Business logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
```

### React Component Pattern
```typescript
// client/src/components/Example.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function Example() {
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then(r => r.json())
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>{data?.message}</div>;
}
```

### Service Pattern
```typescript
// server/services/exampleService.ts
export class ExampleService {
  async processData(input: string): Promise<Result> {
    // Business logic
    return { success: true, data: input };
  }
}

export const exampleService = new ExampleService();
```

## Database Development

### Schema Changes
```typescript
// shared/schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const newTable = pgTable('new_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

### Apply Schema
```bash
npm run db:push
```

### Query Data
```typescript
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Select
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, '123'));

// Insert
await db.insert(users).values({ email: 'test@example.com' });

// Update
await db.update(users).set({ name: 'New Name' }).where(eq(users.id, '123'));

// Delete
await db.delete(users).where(eq(users.id, '123'));
```

## Environment Setup

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed setup instructions.

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (32+ chars)
- `ENCRYPTION_KEY` - Data encryption key (32-byte hex)
- `OPENAI_API_KEY` - GPT-5.1 API key
- `ANTHROPIC_API_KEY` - Claude Opus 4.5 API key
- `GOOGLE_API_KEY` - Gemini 3.0 Pro API key

## Testing Strategy

See [TESTING.md](TESTING.md) for comprehensive testing guide.

- **Unit Tests** - Test individual functions and services
- **Integration Tests** - Test API endpoints and database operations
- **Component Tests** - Test React components in isolation
- **E2E Tests** - Test critical user flows (planned)

**Coverage Targets:**
- Critical business logic: 100%
- API endpoints: 90%
- Utilities: 85%
- Overall: 80%

## Security Best Practices

### Input Validation
Always validate user input with Zod schemas:
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error });
}
```

### Authentication Checks
```typescript
// Require authenticated user
if (!req.isAuthenticated()) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Require specific role
if (req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Audit Logging
```typescript
import { auditService } from './services/auditService';

await auditService.log({
  userId: req.user.id,
  action: 'CREATE',
  entityType: 'document',
  entityId: document.id,
  riskLevel: 'low'
});
```

## Key Features Implementation

### Multi-Model AI Orchestration
The `aiOrchestrator` service intelligently routes requests to the best available model:
- GPT-5.1 for general document generation
- Claude Opus 4.5 for complex reasoning
- Gemini 3.0 Pro for multimodal analysis
- Automatic fallback if primary model unavailable

### Threat Detection
Real-time pattern detection for:
- SQL injection attempts
- XSS attacks
- Path traversal
- Command injection
- Rate limit violations

### Compliance Gap Analysis
Framework-based analysis for:
- ISO 27001:2022 (114 controls)
- SOC 2 Type I/II
- FedRAMP (Low/Moderate/High)
- NIST 800-53 Rev 5

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

**Common Issues:**
- Port 5000 in use: Change PORT in .env
- Database connection error: Verify PostgreSQL is running
- Missing env vars: Check .env.example
- Type errors: Run `npm run check`
- Build errors: Clear `node_modules` and reinstall

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

**Deployment Checklist:**
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Type checking passes
- [ ] Tests pass
- [ ] Security audit complete
- [ ] Performance tested
- [ ] Monitoring configured

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## Additional Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Security Documentation](SECURITY.md)
- [Testing Guide](TESTING.md)
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

**Questions?** Open an issue or check the documentation.