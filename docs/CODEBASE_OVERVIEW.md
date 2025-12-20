# CyberDocGen - Complete Codebase Overview

**Last Updated:** December 20, 2025
**Version:** 1.0.0 (Production Ready)
**Status:** ✅ 100% Core Features Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Project Statistics](#project-statistics)
4. [Directory Structure](#directory-structure)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Key Features](#key-features)
10. [Development Workflow](#development-workflow)

---

## Executive Summary

**CyberDocGen** is a production-ready, enterprise-grade compliance management platform with AI-powered capabilities. It automates the generation, analysis, and management of compliance documentation for multiple frameworks including ISO 27001:2022, SOC 2, FedRAMP, and NIST 800-53 Rev 5.

### Key Characteristics

- **Type**: Full-stack TypeScript monorepo
- **Architecture**: Multi-tier (Client → API → Services → Database)
- **Deployment**: Production-ready with zero critical issues
- **Testing**: 498/498 tests passing (100%)
- **Security**: Zero vulnerabilities, enterprise-grade security
- **Performance**: 86% bundle size reduction, optimized for production

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework with concurrent features |
| **TypeScript** | 5.9 | Type-safe development |
| **Vite** | 6.4 | Lightning-fast build tool |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Radix UI** | Latest | Accessible component primitives (51+ components) |
| **TanStack Query** | Latest | Server state management |
| **React Hook Form** | Latest | Performant form handling |
| **Zod** | Latest | TypeScript-first schema validation |
| **Wouter** | Latest | Lightweight routing |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20 | JavaScript runtime |
| **Express** | 4.21 | Web application framework |
| **TypeScript** | 5.9 | Type safety |
| **PostgreSQL** | 16 | Relational database |
| **Drizzle ORM** | 0.39 | Type-safe ORM |
| **Passport.js** | Latest | Authentication middleware |
| **Winston** | Latest | Structured logging |

### AI Integration

| Provider | Model | Purpose |
|----------|-------|---------|
| **OpenAI** | GPT-5.1 | Document generation, content analysis (Flagship) |
| **Anthropic** | Claude Opus 4.5 | Complex reasoning, risk assessment (Latest) |
| **Google** | Gemini 3.0 Pro | Multimodal analysis, compliance review (Latest) |

### Infrastructure

- **Database**: Neon Serverless PostgreSQL
- **Storage**: Google Cloud Storage (via Replit Object Storage)
- **Deployment**: Replit Deployments
- **Logging**: Winston structured logging
- **Testing**: Vitest + Testing Library

---

## Project Statistics

### Codebase Metrics (December 2025)

| Category | Count | Details |
|----------|-------|---------|
| **Frontend Pages** | 41 | Fully implemented page components |
| **UI Components** | 93+ | Organized by feature/domain |
| **Custom Hooks** | 6 | Specialized React hooks |
| **Backend Routes** | 25 | API route modules |
| **Services** | 36 | Business logic services |
| **Middleware** | 4 | Express middleware modules |
| **Database Tables** | 40+ | Multi-tenant schema |
| **Schema Lines** | 1,670+ | Database schema definition |
| **Tests** | 498 | 100% passing rate |
| **Documentation** | 20+ | Comprehensive guides |

### Code Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **TypeScript Errors** | 0 | ✅ |
| **Test Pass Rate** | 100% (498/498) | ✅ |
| **Security Vulnerabilities** | 0 | ✅ |
| **Bundle Size (Largest)** | 154 KB | ✅ (86% reduction) |
| **Code Splitting** | 40+ routes | ✅ |
| **Test Coverage** | ~60% | 🎯 Target: 80%+ |

---

## Directory Structure

```
cyberdocgen/
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── pages/                  # 41 Page Components
│   │   │   ├── landing.tsx         # Landing page
│   │   │   ├── dashboard.tsx       # Main dashboard
│   │   │   ├── documents.tsx       # Document management
│   │   │   ├── iso27001-framework.tsx
│   │   │   ├── soc2-framework.tsx
│   │   │   ├── fedramp-framework.tsx
│   │   │   ├── nist-framework.tsx
│   │   │   ├── ai-hub.tsx          # AI features hub
│   │   │   ├── ai-assistant.tsx    # AI chatbot
│   │   │   ├── ai-doc-generator.tsx
│   │   │   ├── document-workspace.tsx
│   │   │   ├── auditor-workspace.tsx
│   │   │   ├── enterprise-login.tsx
│   │   │   ├── enterprise-signup.tsx
│   │   │   ├── admin-settings.tsx
│   │   │   ├── audit-trail.tsx
│   │   │   ├── cloud-integrations.tsx
│   │   │   └── ... (30+ more pages)
│   │   │
│   │   ├── components/             # 93+ UI Components
│   │   │   ├── ui/                 # 51 Radix UI components
│   │   │   ├── ai/                 # AI-specific components
│   │   │   ├── compliance/         # Compliance features
│   │   │   ├── auth/               # Authentication UI
│   │   │   ├── navigation/         # Navigation components
│   │   │   ├── templates/          # Template components
│   │   │   ├── collaboration/      # Collaboration features
│   │   │   └── notifications/      # Notification system
│   │   │
│   │   ├── hooks/                  # 6 Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── use-toast.ts
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-storage.ts
│   │   │   ├── useAccessibility.ts
│   │   │   └── useOnlineStatus.ts
│   │   │
│   │   ├── contexts/               # React Context Providers
│   │   ├── lib/                    # Utility Libraries
│   │   └── styles/                 # CSS and Styling
│   │
│   ├── public/                      # Static Assets
│   └── README.md                    # Frontend Documentation
│
├── server/                          # Node.js Backend Application
│   ├── index.ts                    # Server Entry Point
│   ├── routes.ts                   # API Routes Aggregation
│   │
│   ├── routes/                     # 25 API Route Modules
│   │   ├── organizations.ts        # Multi-tenant management
│   │   ├── companyProfiles.ts      # Company data
│   │   ├── documents.ts            # Document CRUD
│   │   ├── ai.ts                   # AI operations
│   │   ├── analytics.ts            # Analytics & gap analysis
│   │   ├── dashboard.ts            # Dashboard data
│   │   ├── gapAnalysis.ts          # Gap analysis
│   │   ├── templates.ts            # Document templates
│   │   ├── controls.ts             # Control management
│   │   ├── evidence.ts             # Evidence linking
│   │   ├── auditor.ts              # Auditor workspace
│   │   ├── approvals.ts            # Approval workflows
│   │   ├── admin.ts                # Admin functionality
│   │   ├── userProfile.ts          # User management
│   │   ├── roles.ts                # RBAC
│   │   ├── enterpriseAuth.ts       # Enterprise auth
│   │   ├── mfa.ts                  # Multi-factor auth
│   │   ├── cloudIntegration.ts     # Cloud storage
│   │   ├── export.ts               # Document export
│   │   ├── notifications.ts        # Notification system
│   │   ├── aiSessions.ts           # AI chat sessions
│   │   ├── auditTrail.ts           # Audit logging
│   │   └── ... (25 total modules)
│   │
│   ├── services/                   # 36 Business Logic Services
│   │   ├── AI Services/
│   │   │   ├── aiOrchestrator.ts   # Multi-model orchestration (18.8 KB)
│   │   │   ├── openai.ts           # GPT-5.1 integration (112 KB)
│   │   │   ├── anthropic.ts        # Claude Opus 4.5 (9 KB)
│   │   │   ├── aiGuardrailsService.ts # AI safety (17 KB)
│   │   │   ├── aiFineTuningService.ts # Model fine-tuning (16 KB)
│   │   │   ├── chatbot.ts          # Compliance chatbot (12 KB)
│   │   │   └── geminiVision.ts     # Google Gemini (6 KB)
│   │   │
│   │   ├── Document Services/
│   │   │   ├── documentTemplates.ts # Templates (214 KB - largest)
│   │   │   ├── documentAnalysis.ts  # Quality analysis (9 KB)
│   │   │   ├── documentWorkflowService.ts # Workflows (14 KB)
│   │   │   ├── qualityScoring.ts    # Quality scoring (14 KB)
│   │   │   └── versionService.ts    # Version control (8 KB)
│   │   │
│   │   ├── Compliance Services/
│   │   │   ├── complianceGapAnalysis.ts # Gap analysis (18 KB)
│   │   │   ├── complianceDeadlineService.ts # Deadlines (13.5 KB)
│   │   │   ├── frameworkSpreadsheetService.ts # Exports (16 KB)
│   │   │   └── riskAssessment.ts    # Risk analysis (13 KB)
│   │   │
│   │   ├── Security Services/
│   │   │   ├── auditService.ts      # Audit logging (14 KB)
│   │   │   ├── encryption.ts        # Data encryption (9 KB)
│   │   │   ├── mfaService.ts        # MFA implementation (11 KB)
│   │   │   ├── enterpriseAuthService.ts # Enterprise auth (19 KB)
│   │   │   ├── sessionRiskScoringService.ts # Session security (14 KB)
│   │   │   ├── threatDetectionService.ts # Threat detection (8 KB)
│   │   │   ├── keyRotationService.ts # Key rotation (14 KB)
│   │   │   └── pdfSecurityService.ts # PDF security (12 KB)
│   │   │
│   │   └── Infrastructure Services/
│   │       ├── cloudIntegrationService.ts # Cloud storage (16 KB)
│   │       ├── objectStorageService.ts # Object storage (17 KB)
│   │       ├── dataResidencyService.ts # Data residency (7 KB)
│   │       ├── dataRetentionService.ts # Data retention (13 KB)
│   │       ├── performanceService.ts # Metrics (7 KB)
│   │       └── alertingService.ts   # Alerts (6 KB)
│   │
│   ├── middleware/                 # 4 Express Middleware Modules
│   │   ├── rateLimiting.ts         # DDoS protection
│   │   ├── multiTenant.ts          # Multi-tenant context
│   │   ├── csrf.ts                 # CSRF protection
│   │   └── security.ts             # Security headers
│   │
│   ├── mcp/                        # Model Context Protocol
│   │   ├── server.ts               # MCP server implementation
│   │   ├── agentClient.ts          # Agent communication
│   │   ├── toolRegistry.ts         # Tool registry
│   │   ├── tools/
│   │   │   ├── internal.ts         # Internal tools
│   │   │   ├── external.ts         # External APIs
│   │   │   └── advanced.ts         # Advanced operations
│   │   ├── README.md               # MCP documentation
│   │   └── INTEGRATION_GUIDE.md    # Integration guide
│   │
│   ├── monitoring/                 # Metrics and Monitoring
│   │   └── metrics.ts              # Prometheus metrics
│   │
│   ├── utils/                      # Utilities
│   │   ├── logging.ts              # Winston logging
│   │   ├── validation.ts           # Input validation
│   │   └── health.ts               # Health checks
│   │
│   └── README.md                   # Backend Documentation
│
├── shared/                         # Shared TypeScript Code
│   └── schema.ts                   # Database Schema (1,670+ lines)
│
├── tests/                          # Test Suite (498 tests)
│   ├── setup.ts                    # Test configuration
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   ├── components/                 # Component tests
│   └── accessibility/              # Accessibility tests
│
├── docs/                           # Documentation (20+ guides)
│   ├── ARCHITECTURE.md             # System architecture
│   ├── API.md                      # API reference
│   ├── SECURITY.md                 # Security implementation
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── DEVELOPMENT_GUIDE.md        # Development workflow
│   ├── ENVIRONMENT_SETUP.md        # Setup instructions
│   ├── TESTING.md                  # Testing guidelines
│   ├── TROUBLESHOOTING.md          # Common issues
│   ├── DESIGN_SYSTEM.md            # Component design (1,072 lines)
│   ├── CODEBASE_OVERVIEW.md        # This file
│   ├── wireframes/                 # UI wireframes (25 screens)
│   └── ... (additional docs)
│
├── development-archive/            # Historical Documentation
│   ├── build-reports/
│   ├── compliance-docs/
│   └── testing-reports/
│
├── scripts/                        # Utility Scripts
│   └── README.md
│
├── .github/                        # GitHub Configuration
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── CONTRIBUTING.md                 # Contributing guidelines
├── CODE_OF_CONDUCT.md              # Code of conduct
├── CHANGELOG.md                    # Version history
├── PHASE_5_FINAL_SUMMARY.md        # Phase 5 completion report
├── PHASE_5.3_COMPLETION_REPORT.md  # Backend TODO completion
├── LICENSE                         # MIT License
└── README.md                       # Main README
```

---

## Frontend Architecture

### Pages Overview (41 Total)

#### Core Pages
- **landing.tsx** - Marketing landing page
- **dashboard.tsx** - Main application dashboard
- **documents.tsx** - Document management hub

#### Compliance Framework Pages
- **iso27001-framework.tsx** - ISO 27001:2022 compliance
- **soc2-framework.tsx** - SOC 2 Type I/II compliance
- **fedramp-framework.tsx** - FedRAMP compliance (Low/Moderate/High)
- **nist-framework.tsx** - NIST 800-53 Rev 5 compliance

#### AI Features Pages
- **ai-hub.tsx** - AI features central hub
- **ai-assistant.tsx** - Compliance chatbot
- **ai-doc-generator.tsx** - AI document generation
- **ai-doc-analyzer.tsx** - Document analysis
- **ai-risk-assessment.tsx** - Risk assessment

#### Document Management Pages
- **document-workspace.tsx** - Collaborative editing
- **document-versions.tsx** - Version history
- **document-templates.tsx** - Template management
- **template-view.tsx** - Template viewer

#### Enterprise Pages
- **organization-setup.tsx** - Organization configuration
- **enhanced-company-profile.tsx** - Company profile management
- **company-profile.tsx** - Basic company profile
- **admin-settings.tsx** - System administration
- **auditor-workspace.tsx** - Auditor tools
- **control-approvals.tsx** - Approval workflows

#### Authentication & Security Pages
- **enterprise-login.tsx** - Enterprise SSO login
- **enterprise-signup.tsx** - Enterprise registration
- **audit-trail.tsx** - Audit log viewer
- **cloud-integrations.tsx** - OAuth cloud connections

#### User Management Pages
- **user-profile.tsx** - User profile settings
- **team-collaboration.tsx** - Team features

### Component Organization (93+ Total)

#### UI Components (51 Radix UI)
- Accordion, Alert, Avatar, Badge, Button, Card
- Checkbox, Collapsible, Dialog, Dropdown Menu
- Form, Input, Label, Popover, Progress, Radio Group
- ScrollArea, Select, Separator, Sheet, Skeleton
- Slider, Switch, Table, Tabs, Textarea, Toast
- Toggle, Tooltip, and more...

#### Feature-Specific Components
- **AI Components**: AIChat, ModelSelector, GenerationProgress
- **Compliance Components**: FrameworkSelector, ControlStatus, GapAnalysisChart
- **Auth Components**: LoginForm, MFASetup, SecuritySettings
- **Navigation Components**: Sidebar, TopNav, Breadcrumbs
- **Collaboration Components**: Comments, VersionHistory, ApprovalWorkflow

### Custom Hooks (6)

| Hook | Purpose | Usage |
|------|---------|-------|
| `useAuth.ts` | Authentication state management | User login/logout, session |
| `use-toast.ts` | Toast notifications | Success/error messages |
| `use-mobile.tsx` | Mobile detection | Responsive UI |
| `use-storage.ts` | Local storage abstraction | Persistent state |
| `useAccessibility.ts` | Accessibility features | WCAG compliance |
| `useOnlineStatus.ts` | Network status monitoring | Offline handling |

### Performance Optimizations

- **Code Splitting**: 40+ lazy-loaded routes
- **Bundle Optimization**: 86% size reduction (1,121 KB → 154 KB)
- **Vendor Chunks**: 7 optimized chunks for caching
  - `vendor-react` (148 KB) - React core + routing
  - `vendor-ui` (154 KB) - Radix UI components
  - `vendor-forms` (88 KB) - Form handling
  - `vendor-query` (40 KB) - React Query
  - `vendor-icons` (50 KB) - Icons + animations
  - `vendor-utils` (26 KB) - Utility libraries
  - `vendor-charts` - Recharts (lazy loaded)

---

## Backend Architecture

### Route Modules (25 Total)

#### Core Routes
1. **organizations.ts** - Multi-tenant organization management
2. **companyProfiles.ts** - Company data and profiles
3. **documents.ts** - Document CRUD operations
4. **ai.ts** - AI operations and statistics
5. **analytics.ts** - Analytics and gap analysis
6. **dashboard.ts** - Dashboard data aggregation

#### Compliance Routes
7. **gapAnalysis.ts** - Compliance gap analysis
8. **templates.ts** - Document template management
9. **controls.ts** - Control management and approvals
10. **evidence.ts** - Evidence upload and linking
11. **auditor.ts** - Auditor workspace endpoints
12. **approvals.ts** - Approval workflows
13. **frameworkControlStatuses.ts** - Control status tracking

#### Enterprise Routes
14. **admin.ts** - System administration
15. **userProfile.ts** - User profile management
16. **roles.ts** - RBAC role management
17. **projects.ts** - Project collaboration
18. **enterpriseAuth.ts** - Enterprise authentication
19. **mfa.ts** - Multi-factor authentication

#### Integration Routes
20. **cloudIntegration.ts** - Google Drive/OneDrive OAuth
21. **storage.ts** - File storage operations
22. **export.ts** - Document export (PDF/Word)
23. **notifications.ts** - Notification system
24. **aiSessions.ts** - AI chat session management
25. **auditTrail.ts** - Audit log access

### Service Layer (36 Services)

#### AI Services (8)
- **aiOrchestrator.ts** - Multi-model coordination and intelligent routing
- **openai.ts** - GPT-5.1 integration (latest flagship model, Nov 2025)
- **anthropic.ts** - Claude Opus 4.5 integration (latest reasoning model)
- **aiGuardrailsService.ts** - Prompt injection detection, PII redaction
- **aiFineTuningService.ts** - Custom model training
- **chatbot.ts** - Context-aware compliance chatbot
- **geminiVision.ts** - Google Gemini 3.0 Pro integration
- **aiClients.ts** - AI client configuration

#### Document Services (5)
- **documentTemplates.ts** - Comprehensive template library (214 KB)
- **documentAnalysis.ts** - AI-powered document review
- **documentWorkflowService.ts** - Workflow management
- **qualityScoring.ts** - Document quality assessment
- **versionService.ts** - Version control and history

#### Compliance Services (4)
- **complianceGapAnalysis.ts** - Framework gap analysis
- **complianceDeadlineService.ts** - Deadline tracking
- **frameworkSpreadsheetService.ts** - Framework exports
- **riskAssessment.ts** - Risk identification and scoring

#### Security Services (8)
- **auditService.ts** - Immutable audit trails with tamper detection
- **encryption.ts** - AES-256 encryption
- **mfaService.ts** - TOTP-based MFA
- **enterpriseAuthService.ts** - Enterprise SSO
- **sessionRiskScoringService.ts** - Adaptive authentication
- **threatDetectionService.ts** - Real-time threat detection
- **keyRotationService.ts** - Automated key rotation
- **pdfSecurityService.ts** - Secure PDF generation

#### Infrastructure Services (11)
- **cloudIntegrationService.ts** - Google Drive/OneDrive sync
- **objectStorageService.ts** - Cloud storage abstraction
- **dataResidencyService.ts** - Geographic data controls
- **dataRetentionService.ts** - Data lifecycle management
- **performanceService.ts** - Performance metrics
- **alertingService.ts** - Multi-channel alerting
- **modelTransparencyService.ts** - AI usage tracking
- **systemConfigService.ts** - System configuration
- **companyDataExtractionService.ts** - AI-powered data extraction
- **chaosTestingService.ts** - Resilience testing

### Middleware Stack (10 Layers)

1. **Security Headers** - CORS, CSP, XSS protection, HSTS
2. **Cookie Parser** - Secure cookie handling
3. **CSRF Protection** - Session-bound CSRF tokens
4. **Threat Detection** - Real-time threat pattern detection
5. **Audit Logger** - Immutable audit trail
6. **Route Access Validation** - Route-level access control
7. **Performance Logging** - Request/response time tracking
8. **Rate Limiting** - Tiered limits (1000 req/15 min general, 10/hour AI)
9. **MFA Enforcement** - Multi-factor authentication for high-risk ops
10. **Request Validation** - Comprehensive Zod schema validation

---

## Database Schema

### Overview
- **Tables**: 40+ tables
- **Lines of Code**: 1,670+ lines
- **ORM**: Drizzle ORM 0.39
- **Database**: PostgreSQL 16
- **Architecture**: Multi-tenant with organization-based isolation

### Major Table Categories

#### User Management (10 tables)
- `users` - User profiles with enterprise auth
- `sessions` - Session storage
- `userOrganizations` - Multi-tenant memberships
- `userInvitations` - User invites
- `userSessions` - Session tracking
- `passwordResetTokens` - Password resets
- `emailVerificationTokens` - Email verification
- `passkeyCredentials` - WebAuthn/FIDO2
- `mfaSettings` - MFA configuration
- `oauthProviders` - OAuth SSO

#### Organization & Access (5 tables)
- `organizations` - Multi-tenant organizations
- `roles` - RBAC role definitions
- `roleAssignments` - User role assignments
- `projects` - Team collaboration
- `projectMemberships` - Project access

#### Documents & Compliance (7 tables)
- `companyProfiles` - Company data (280 lines of schema)
- `documents` - Compliance documents
- `documentTemplates` - Reusable templates
- `documentVersions` - Version history
- `documentWorkspace` - Collaborative editing
- `documentApprovals` - Approval workflows
- `frameworkControlStatuses` - Control tracking

#### Gap Analysis (3 tables)
- `gapAnalysisReports` - Gap analysis results
- `gapAnalysisFindings` - Individual gaps
- `remediationRecommendations` - Remediation plans
- `complianceMaturityAssessments` - Maturity scoring

#### AI & Analytics (7 tables)
- `industryConfigurations` - Industry-specific configs
- `organizationFineTuning` - Custom model training
- `fineTuningMetrics` - Model performance
- `aiSessions` - AI chat sessions
- `aiMessages` - Chat messages
- `aiGuardrailsLogs` - AI safety logs
- `modelCards` - AI model transparency
- `aiUsageDisclosures` - AI usage tracking

#### Storage & Security (8+ tables)
- `cloudIntegrations` - OAuth integrations
- `cloudFiles` - Cloud file metadata
- `pdfSecuritySettings` - PDF encryption
- `systemConfigurations` - System settings
- `dataResidencyPolicies` - Geographic controls
- `dataRetentionPolicies` - Data lifecycle
- `auditLogs` - Security audit logs
- `auditTrail` - Extended audit trail
- `notifications` - In-app notifications

---

## API Endpoints

### Authentication & User Management
```
POST   /api/auth/temp-login           - Temporary demo login
POST   /api/auth/temp-logout          - Logout
GET    /api/auth/user                 - Get current user
GET    /api/csrf-token                - CSRF token
POST   /api/auth/enterprise/*         - Enterprise authentication
POST   /api/auth/mfa/*                - MFA operations
```

### Organizations & Profiles
```
GET    /api/organizations             - List organizations
POST   /api/organizations             - Create organization
GET    /api/organizations/:id         - Get organization
GET    /api/company-profiles          - List profiles
POST   /api/company-profiles          - Create profile
GET    /api/company-profiles/:id      - Get profile
PUT    /api/company-profiles/:id      - Update profile
```

### Documents
```
GET    /api/documents                 - List documents
POST   /api/documents                 - Create document
GET    /api/documents/:id             - Get document
PUT    /api/documents/:id             - Update document
DELETE /api/documents/:id             - Delete document
GET    /api/documents/:id/history     - Version history
POST   /api/documents/generate        - Generate document
```

### AI Operations
```
POST   /api/ai/chat                   - Chat with AI assistant
POST   /api/ai/generate               - Generate content
POST   /api/ai/analyze                - Analyze document
POST   /api/ai/gap-analysis           - Compliance gap analysis
GET    /api/ai/health                 - AI service health
GET    /api/ai/stats                  - AI usage statistics
```

### Compliance & Analytics
```
GET    /api/gap-analysis              - Gap analysis reports
POST   /api/gap-analysis              - Create analysis
GET    /api/analytics/gap-analysis/:framework - Framework gap analysis
GET    /api/analytics/compliance-trends - Compliance trends
GET    /api/frameworks                - List frameworks
GET    /api/frameworks/:id/controls   - Framework controls
```

### Controls & Evidence
```
GET    /api/controls                  - List controls
GET    /api/controls/approvals        - Pending approvals
POST   /api/controls/:id/approve      - Approve control
GET    /api/evidence                  - List evidence
POST   /api/evidence                  - Upload evidence
POST   /api/evidence/:id/controls     - Link to control
```

### Auditor Workspace
```
GET    /api/auditor/documents         - List documents for audit
GET    /api/auditor/overview          - Compliance overview
GET    /api/auditor/export            - Export audit reports
```

### Monitoring & Health
```
GET    /health                        - Health check
GET    /metrics                       - Prometheus metrics
GET    /api-docs                      - Swagger UI (dev only)
GET    /api-docs.json                 - OpenAPI spec
```

---

## Key Features

### AI-Powered Capabilities
- **Multi-Model Orchestration**: GPT-5.1, Claude Opus 4.5, Gemini 3.0 Pro
- **Intelligent Document Generation**: Framework-specific templates
- **Document Analysis**: Quality scoring and recommendations
- **Compliance Gap Analysis**: Automated gap identification
- **Risk Assessment**: Maturity scoring and prioritization
- **Compliance Chatbot**: Context-aware Q&A
- **AI Guardrails**: Prompt injection detection, PII redaction

### Enterprise Features
- **Multi-Factor Authentication**: TOTP-based with backup codes
- **Organization Management**: Multi-tenant architecture
- **Cloud Integrations**: Google Drive, OneDrive OAuth
- **Audit Trails**: Immutable logs with tamper detection
- **Version Control**: Complete document history
- **Session Risk Scoring**: Adaptive authentication
- **Model Context Protocol**: Claude Code integration

### Compliance Management
- **Frameworks**: ISO 27001:2022, SOC 2, FedRAMP, NIST 800-53 Rev 5
- **Document Workspace**: Collaborative editing
- **Template Management**: Pre-built templates
- **Control Status Tracking**: Implementation tracking
- **Evidence Management**: File upload and linking
- **Approval Workflows**: Review and approval system

### Security & Monitoring
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Threat Detection**: Real-time anomaly detection
- **Rate Limiting**: DDoS protection (1000 req/15 min)
- **Security Headers**: CSP, HSTS, XSS protection
- **Health Checks**: Kubernetes-compatible probes
- **Metrics Collection**: Prometheus-style metrics

---

## Development Workflow

### Getting Started

```bash
# Clone repository
git clone https://github.com/kherrera6219/cyberdocgen.git
cd cyberdocgen

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (optional)
npm run db:push

# Start development server
npm run dev

# Access application
open http://localhost:5000
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run check        # TypeScript type checking
npm test             # Run test suite
npm test -- --watch  # Watch mode
npm run db:push      # Apply database changes
npm run db:studio    # Open Drizzle Studio
```

### Development Best Practices

1. **Type Safety**: Use TypeScript throughout, avoid `any` types
2. **Testing**: Write tests for new features, maintain 100% pass rate
3. **Security**: Follow OWASP guidelines, use validation
4. **Documentation**: Update docs with code changes
5. **Code Review**: Submit PRs for all changes
6. **Performance**: Monitor bundle size, use code splitting
7. **Accessibility**: Follow WCAG 2.2 AA guidelines

### Testing Strategy

- **Unit Tests**: Individual function and component tests
- **Integration Tests**: API endpoint and service tests
- **Component Tests**: React component rendering tests
- **Accessibility Tests**: WCAG compliance tests
- **Coverage Target**: 80%+ (currently ~60%)

### Deployment

```bash
# Production build
npm run build

# Run production server
NODE_ENV=production npm start
```

**Deployment Platforms**:
- Replit Deployments (configured)
- Docker (containerized)
- Traditional VPS
- Cloud platforms (AWS, GCP, Azure)

---

## Additional Resources

### Documentation
- [Architecture Guide](ARCHITECTURE.md) - System architecture
- [API Reference](API.md) - Complete API documentation
- [Security Guide](SECURITY.md) - Security implementation
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Development Guide](DEVELOPMENT_GUIDE.md) - Development workflow
- [Testing Guide](TESTING.md) - Testing strategies

### Reports
- [Phase 5 Final Summary](../PHASE_5_FINAL_SUMMARY.md) - Completion report
- [Phase 5.3 Completion](../PHASE_5.3_COMPLETION_REPORT.md) - Backend TODO completion

### Support
- [Issue Tracker](https://github.com/kherrera6219/cyberdocgen/issues)
- [Discussions](https://github.com/kherrera6219/cyberdocgen/discussions)

---

**Last Updated:** December 20, 2025
**Maintainer:** CyberDocGen Team
**License:** MIT
