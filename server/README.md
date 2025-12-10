# Server Backend Documentation

This directory contains the Node.js/Express backend server for CyberDocGen.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Key Technologies](#key-technologies)
- [API Routes](#api-routes)
- [Services](#services)
- [Middleware](#middleware)
- [Database](#database)
- [Security](#security)
- [Development](#development)

## Overview

The backend is an enterprise-grade Node.js server built with Express and TypeScript. It provides RESTful APIs for compliance management, AI-powered document generation, authentication, and enterprise features.

### Key Features

- **RESTful API** - Comprehensive API endpoints for all features
- **AI Integration** - OpenAI GPT-4o and Anthropic Claude integration
- **Enterprise Authentication** - Multi-factor authentication and session management
- **Database Management** - PostgreSQL with Drizzle ORM
- **Security** - Rate limiting, encryption, audit logging, threat detection
- **Cloud Integration** - Google Cloud Storage, Google Drive, OneDrive
- **Monitoring** - Health checks, metrics, structured logging

## Architecture

### Technology Stack

- **Node.js 20** - Runtime environment
- **Express 4.21** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL 16** - Primary database
- **Drizzle ORM 0.39** - Database ORM
- **Passport.js** - Authentication middleware
- **OpenID Connect** - Authentication protocol
- **bcrypt** - Password hashing
- **express-session** - Session management

### Design Patterns

- **Layered Architecture** - Routes → Services → Database
- **Service Layer Pattern** - Business logic encapsulation
- **Middleware Pattern** - Request processing pipeline
- **Repository Pattern** - Data access abstraction
- **Dependency Injection** - Loose coupling
- **Error Handling** - Centralized error management

## Directory Structure

```
server/
├── index.ts                  # Server entry point & setup
├── routes.ts                 # Main API routes (2,600+ lines)
├── db.ts                     # Database connection
├── storage.ts                # Storage abstraction layer
├── vite.ts                   # Vite integration
├── replitAuth.ts             # Replit OpenID auth
│
├── routes/                   # Modular route handlers
│   ├── admin.ts                     # Admin operations
│   ├── enterpriseAuth.ts            # Authentication
│   ├── mfa.ts                       # Multi-factor auth
│   └── cloudIntegration.ts          # Cloud services
│
├── services/                 # Business logic (23 services)
│   ├── aiOrchestrator.ts            # Multi-model AI orchestration
│   ├── openai.ts                    # OpenAI GPT-4o integration
│   ├── anthropic.ts                 # Anthropic Claude integration
│   ├── documentGeneration.ts        # Document generation
│   ├── documentAnalysis.ts          # Document analysis
│   ├── complianceGapAnalysis.ts     # Gap analysis
│   ├── complianceFrameworks.ts      # Framework definitions
│   ├── riskAssessment.ts            # Risk analysis
│   ├── qualityScoring.ts            # Quality analysis
│   ├── cloudIntegrationService.ts   # Cloud storage
│   ├── auditService.ts              # Audit logging
│   ├── encryption.ts                # Data encryption
│   ├── mfaService.ts                # MFA handling
│   ├── performanceService.ts        # Performance tracking
│   ├── documentTemplates.ts         # Template management (92KB)
│   └── ... (8 more services)
│
├── middleware/               # Request middleware
│   ├── security.ts                  # Security headers, rate limiting
│   ├── production.ts                # Production middleware
│   ├── mfa.ts                       # MFA enforcement
│   └── routeValidation.ts           # Request validation
│
├── monitoring/               # Metrics and monitoring
│   └── metrics.ts                   # Prometheus-style metrics
│
└── utils/                    # Utility functions
    ├── validation.ts                # Input validation schemas
    ├── logger.ts                    # Structured logging
    ├── errorHandler.ts              # Error handling
    └── health.ts                    # Health check utilities
```

## Key Technologies

### Express.js

Web framework with middleware:

```typescript
import express from 'express';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});
```

### Drizzle ORM

Type-safe database queries:

```typescript
import { db } from './db';
import { users, documents } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Select
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));

// Insert
await db.insert(documents).values({
  title: 'Document',
  content: 'Content',
  userId: userId
});

// Update
await db.update(documents)
  .set({ status: 'published' })
  .where(eq(documents.id, docId));
```

### Passport.js

Authentication strategies:

```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

passport.use(new LocalStrategy(
  async (username, password, done) => {
    // Verify credentials
  }
));
```

### Express Session

Session management:

```typescript
import session from 'express-session';
import connectPg from 'connect-pg-simple';

app.use(session({
  store: new (connectPg(session))({ pool }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

## API Routes

### Public Endpoints

```
GET  /health              System health check
GET  /metrics             Performance metrics
GET  /api/ai/health       AI services health
GET  /api/test/openai     OpenAI API test
```

### Authentication

```
POST /api/auth/login      User login
POST /api/auth/logout     User logout
POST /api/auth/signup     User registration
GET  /api/auth/me         Current user
POST /api/auth/verify-mfa Verify MFA token
```

### Organizations

```
GET    /api/organizations              List organizations
POST   /api/organizations              Create organization
GET    /api/organizations/:id          Get organization
PUT    /api/organizations/:id          Update organization
DELETE /api/organizations/:id          Delete organization
POST   /api/organizations/:id/members  Add member
DELETE /api/organizations/:id/members/:userId  Remove member
```

### Documents

```
GET    /api/documents                 List documents
POST   /api/documents                 Create document
GET    /api/documents/:id             Get document
PUT    /api/documents/:id             Update document
DELETE /api/documents/:id             Delete document
POST   /api/documents/:id/generate    Generate with AI
POST   /api/documents/:id/analyze     Analyze document
GET    /api/documents/:id/versions    Get versions
```

### Compliance

```
POST /api/gap-analysis              Perform gap analysis
GET  /api/frameworks                 List frameworks
GET  /api/company-profiles           Get profiles
POST /api/company-profiles           Create profile
PUT  /api/company-profiles/:id      Update profile
```

### Audit Trail

```
GET  /api/audit-trail               Get audit logs
POST /api/audit-trail               Create log entry
GET  /api/audit-trail/:id           Get log entry
```

### MFA

```
POST /api/mfa/setup                 Setup MFA
POST /api/mfa/verify                Verify MFA token
POST /api/mfa/disable               Disable MFA
GET  /api/mfa/backup-codes          Get backup codes
```

### Cloud Integrations

```
GET    /api/cloud-integrations           List integrations
POST   /api/cloud-integrations/google    Connect Google Drive
POST   /api/cloud-integrations/microsoft Connect OneDrive
DELETE /api/cloud-integrations/:id       Disconnect
POST   /api/cloud-integrations/:id/sync  Sync files
```

### Admin

```
GET    /api/admin/users               List all users
DELETE /api/admin/users/:id           Delete user
GET    /api/admin/stats               System statistics
POST   /api/admin/settings            Update settings
```

See [API.md](../docs/API.md) for complete API documentation.

## Services

### AI Orchestrator (`aiOrchestrator.ts`)

Multi-model AI orchestration with automatic fallback:

```typescript
import { generateWithAI } from './services/aiOrchestrator';

const result = await generateWithAI({
  prompt: 'Generate ISO 27001 policy',
  framework: 'ISO27001',
  preferredModel: 'gpt-4.1'
});
```

**Features:**
- Automatic model fallback (OpenAI → Anthropic → Google)
- Retry logic with exponential backoff
- Token usage tracking
- Response validation

### OpenAI Service (`openai.ts`)

OpenAI GPT-4o integration:

```typescript
import { generateDocument } from './services/openai';

const document = await generateDocument({
  framework: 'ISO27001',
  section: 'A.5.1',
  companyInfo: { ... }
});
```

### Anthropic Service (`anthropic.ts`)

Anthropic Claude integration for complex reasoning:

```typescript
import { analyzeCompliance } from './services/anthropic';

const analysis = await analyzeCompliance({
  document: content,
  framework: 'SOC2'
});
```

### Document Generation (`documentGeneration.ts`)

Document generation pipeline:

```typescript
import { generateComplianceDocument } from './services/documentGeneration';

const job = await generateComplianceDocument({
  framework: 'ISO27001',
  sections: ['all'],
  organizationId: orgId
});
```

### Compliance Gap Analysis (`complianceGapAnalysis.ts`)

Gap analysis service:

```typescript
import { performGapAnalysis } from './services/complianceGapAnalysis';

const gaps = await performGapAnalysis({
  framework: 'SOC2',
  existingControls: [...],
  companyProfile: { ... }
});
```

### Audit Service (`auditService.ts`)

Comprehensive audit logging:

```typescript
import { logAuditEvent } from './services/auditService';

await logAuditEvent({
  action: 'DOCUMENT_UPDATED',
  userId: user.id,
  resourceType: 'document',
  resourceId: docId,
  metadata: { changes: [...] }
});
```

### Encryption Service (`encryption.ts`)

Data encryption for sensitive information:

```typescript
import { encrypt, decrypt } from './services/encryption';

const encrypted = await encrypt(sensitiveData);
const decrypted = await decrypt(encrypted);
```

### MFA Service (`mfaService.ts`)

Multi-factor authentication:

```typescript
import { generateMFASecret, verifyMFAToken } from './services/mfaService';

const secret = generateMFASecret();
const isValid = verifyMFAToken(secret, token);
```

### Performance Service (`performanceService.ts`)

Performance tracking and metrics:

```typescript
import { trackPerformance } from './services/performanceService';

await trackPerformance('document_generation', duration, {
  framework: 'ISO27001',
  model: 'gpt-4.1'
});
```

## Middleware

### Security Middleware (`middleware/security.ts`)

Comprehensive security measures:

```typescript
import { setupSecurity } from './middleware/security';

setupSecurity(app);
```

**Features:**
- Rate limiting (configurable)
- Helmet security headers
- CORS configuration
- XSS protection
- Input sanitization
- DDoS protection

### Authentication Middleware

```typescript
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/protected', requireAuth, handler);
```

### MFA Middleware (`middleware/mfa.ts`)

MFA enforcement:

```typescript
import { requireMFA } from './middleware/mfa';

app.get('/api/sensitive', requireAuth, requireMFA, handler);
```

### Validation Middleware (`middleware/routeValidation.ts`)

Request validation:

```typescript
import { validateRequest } from './middleware/routeValidation';

app.post('/api/documents',
  validateRequest(documentSchema),
  handler
);
```

## Database

### Connection (`db.ts`)

PostgreSQL connection with pooling:

```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL!
});

export const db = drizzle(pool);
```

### Schema (`../shared/schema.ts`)

Database schema with 15+ tables:

- `users` - User accounts
- `organizations` - Organizations
- `documents` - Compliance documents
- `documentVersions` - Version history
- `companyProfiles` - Company information
- `generationJobs` - AI generation jobs
- `auditTrail` - Audit logs
- `mfaTokens` - MFA tokens
- `sessions` - User sessions
- And more...

### Queries

Type-safe queries with Drizzle:

```typescript
// Select with joins
const result = await db
  .select()
  .from(documents)
  .leftJoin(users, eq(documents.userId, users.id))
  .where(eq(documents.organizationId, orgId));

// Transactions
await db.transaction(async (tx) => {
  await tx.insert(documents).values({ ... });
  await tx.insert(auditTrail).values({ ... });
});
```

## Security

### Authentication

- **Session-based auth** with secure cookies
- **Password hashing** with bcrypt (10 rounds)
- **Multi-factor authentication** (TOTP)
- **OpenID Connect** integration

### Authorization

- **Role-based access control** (RBAC)
- **Organization-level permissions**
- **Resource ownership checks**

### Data Protection

- **Encryption at rest** (ENCRYPTION_KEY)
- **Encryption in transit** (HTTPS/TLS)
- **Input sanitization**
- **SQL injection prevention** (parameterized queries)

### Security Headers

```typescript
// Helmet configuration
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### Rate Limiting

```typescript
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit per window
  message: 'Too many requests'
})
```

### Audit Logging

All sensitive operations logged:

```typescript
await logAuditEvent({
  action: 'USER_LOGIN',
  userId: user.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});
```

## Development

### Running Development Server

```bash
npm run dev
```

Runs with tsx (TypeScript execution):
- Hot reload enabled
- Source maps for debugging
- Environment: development

### Building for Production

```bash
npm run build
```

Creates:
- `dist/index.js` - Bundled server
- ESM format
- Minified code

### Type Checking

```bash
npm run check
```

Verifies TypeScript types without building.

### Database Operations

```bash
# Apply schema changes
npm run db:push

# Generate migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

### Adding New Routes

1. **Create route handler:**
   ```typescript
   // routes.ts or routes/feature.ts
   app.get('/api/feature', async (req, res) => {
     try {
       const data = await featureService.getData();
       res.json(data);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Add validation:**
   ```typescript
   import { z } from 'zod';

   const schema = z.object({
     name: z.string().min(1),
     value: z.number()
   });

   app.post('/api/feature', validateRequest(schema), handler);
   ```

3. **Add tests:**
   ```typescript
   // tests/integration/feature.test.ts
   describe('Feature API', () => {
     it('should handle requests', async () => {
       const response = await request(app).get('/api/feature');
       expect(response.status).toBe(200);
     });
   });
   ```

### Adding New Services

1. **Create service file:**
   ```typescript
   // services/myService.ts
   export async function performAction(params: Params): Promise<Result> {
     // Service logic
     return result;
   }
   ```

2. **Add types:**
   ```typescript
   interface Params {
     id: string;
     options: Options;
   }

   interface Result {
     success: boolean;
     data: Data;
   }
   ```

3. **Use in routes:**
   ```typescript
   import { performAction } from './services/myService';

   app.post('/api/action', async (req, res) => {
     const result = await performAction(req.body);
     res.json(result);
   });
   ```

## Best Practices

### Error Handling

```typescript
// Use try-catch
try {
  const result = await riskyOperation();
  res.json(result);
} catch (error) {
  logger.error('Operation failed', { error });
  res.status(500).json({ error: 'Internal server error' });
}

// Use centralized error handler
app.use(errorHandler);
```

### Logging

```typescript
import { logger } from './utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err });
logger.debug('Query executed', { query, duration });
```

### Validation

```typescript
// Always validate input
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const validated = schema.parse(req.body);
```

### Database Queries

```typescript
// Use parameterized queries
await db.select()
  .from(users)
  .where(eq(users.email, userEmail)); // ✅ Safe

// Never use string interpolation
await db.execute(`SELECT * FROM users WHERE email = '${email}'`); // ❌ Dangerous
```

### Async/Await

```typescript
// Use async/await for clarity
async function handleRequest(req, res) {
  const data = await fetchData();
  const processed = await processData(data);
  res.json(processed);
}

// Handle errors
async function handleRequest(req, res) {
  try {
    const result = await operation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Monitoring

### Health Checks

```typescript
// System health
GET /health

// Detailed health
{
  status: 'healthy',
  database: 'connected',
  ai: {
    openai: 'available',
    anthropic: 'available'
  },
  uptime: 3600,
  memory: { ... }
}
```

### Metrics

```typescript
// Prometheus-style metrics
GET /metrics

# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",path="/api/documents",status="200"} 1234
```

### Logging

Structured logging with Winston:

```typescript
logger.info('Request processed', {
  method: req.method,
  path: req.path,
  duration: duration,
  userId: req.user?.id
});
```

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Passport.js](http://www.passportjs.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

For more information, see the main [README.md](../README.md) and [API.md](../docs/API.md).
