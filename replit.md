# CyberDocGen

## Overview

CyberDocGen is an enterprise-grade compliance management system with AI-powered document analysis and generation capabilities. The platform automates the creation, analysis, and management of compliance documentation for frameworks including ISO 27001, SOC 2, FedRAMP, and NIST 800-53. It features multi-tenant architecture, role-based access control, comprehensive audit logging, and integrations with cloud storage providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state, React Hook Form for forms
- **Routing**: Wouter for lightweight client-side routing
- **Validation**: Zod schemas for form validation

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with strict type checking
- **API Pattern**: RESTful endpoints with layered architecture (Routes → Services → Database)
- **Authentication**: Replit OpenID Connect with Passport.js, session-based auth using express-session
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Database Layer
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via Drizzle Kit (`npm run db:push`)

### Security Implementation
- **Encryption**: AES-256-GCM for data at rest with field-level encryption support
- **MFA**: TOTP and SMS-based multi-factor authentication
- **Rate Limiting**: Tiered rate limiting for general requests, auth, and AI generation
- **Audit Logging**: Comprehensive audit trail with risk-level classification
- **Security Headers**: Full OWASP compliance (CSP, X-Frame-Options, HSTS)
- **PII Scrubbing**: Automatic redaction of emails, SSNs, credit cards, phone numbers, IP addresses in logs
- **AI Guardrails**: Prompt injection detection, content filtering, and response moderation via aiGuardrailsService
- **Query Limits**: Default pagination limits on all database queries to prevent memory exhaustion
- **Cache Invalidation**: Automatic cache clearing on document and company profile mutations
- **Graceful Shutdown**: SIGTERM/SIGINT handlers with 30-second timeout for clean shutdown
- **Environment Validation**: Zod-based validation of all required environment variables at startup

### AI Integration
- **Multi-Model Support**: OpenAI GPT-5.1, Anthropic Claude Opus 4.5, and Google Gemini 3.0 Pro with automatic fallback
- **Model Selection**: Intelligent routing based on task complexity and provider availability
- **Services**: Document generation, compliance analysis, gap analysis, risk assessment, quality scoring
- **AI Guardrails**: Prompt shields, PII redaction, output classifiers
- **AI Hub Insights**: Real-time analytics endpoint (`/api/ai/hub-insights`) that provides organization-scoped compliance insights, dynamic risk identification, and control status analysis based on actual database data

### Key Directories
- `client/` - React frontend application
- `server/` - Express backend with routes, services, and middleware
- `shared/` - Shared TypeScript types and database schema
- `scripts/` - Utility scripts for encryption, validation, and deployment
- `docs/` - Comprehensive documentation

## External Dependencies

### AI Services
- **OpenAI API** (`OPENAI_API_KEY`) - GPT-5.1 for document generation and analysis (latest flagship model, Nov 2025)
- **Anthropic API** (`ANTHROPIC_API_KEY`) - Claude Opus 4.5 for complex reasoning and risk assessment (latest model, Nov 2025)
- **Google AI API** (`GOOGLE_API_KEY`) - Gemini 3.0 Pro for multimodal analysis (latest model, Dec 2025)

### Database
- **Neon PostgreSQL** (`DATABASE_URL`) - Serverless PostgreSQL database

### Cloud Storage
- **Replit Object Storage** - Document asset storage
- **Google Drive** - Cloud integration for document sync
- **Microsoft OneDrive** - Cloud integration for document sync

### Authentication
- **Replit OpenID Connect** - Primary authentication provider
- Requires `REPLIT_DOMAINS`, `REPL_ID`, and `SESSION_SECRET` environment variables

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (minimum 32 characters)
- `ENCRYPTION_KEY` - 32-byte hex key for data encryption
- `OPENAI_API_KEY` - OpenAI API access (GPT-5.1)
- `ANTHROPIC_API_KEY` - Anthropic API access (Claude Opus 4.5)
- `GOOGLE_API_KEY` - Google AI API access (Gemini 3.0 Pro)

## Modernization Progress (7-Phase Plan)

### Phase 1: Navigation & Consistency ✅ Complete
- PublicHeader component standardized across all public pages
- Landing page refactored with consistent navigation
- CTA buttons standardized with proper routing

### Phase 2: Dashboard & Metrics ✅ Complete
- Dashboard API endpoints created at `/api/dashboard/*`
- Multi-tenant data isolation implemented (scoped by organizationId)
- Real-time metrics endpoints: `/api/dashboard/stats`, `/api/dashboard/recent-activity`, `/api/dashboard/compliance-overview`
- Security fix: Documents filtered via companyProfiles.organizationId relationship using Drizzle's `inArray`

### Phase 3: Framework Pages ✅ Complete
- Framework control status CRUD endpoints at `/api/framework-control-statuses`
- Compatibility routes at `/api/frameworks/:framework/control-statuses` for existing frontend
- Persistent control tracking with database-backed storage
- Control status updates include notes and last update timestamps

### Phase 4: Security, Supply Chain & Reliability ✅ Complete
- **Session Risk Scoring** (`server/services/sessionRiskScoringService.ts` - 457 lines)
  - Contextual MFA with weighted risk factors
  - Location, device, time, IP, and behavior analysis
  - Risk levels: low, medium, high, critical with adaptive authentication
  
- **Key Rotation** (`server/services/keyRotationService.ts` - 523 lines)
  - Automated rotation with per-key-type policies
  - Support for encryption, signing, API, and session keys
  - Comprehensive audit logging for all rotations
  
- **Chaos Testing** (`server/services/chaosTestingService.ts` - 493 lines)
  - Database and AI service resilience testing
  - Latency injection, failure simulation, timeout testing
  - Metrics collection: success rate, latency, error rate
  
- **SBOM Generator** (`scripts/generate-sbom.ts` - 420 lines)
  - CycloneDX and SPDX format output
  - Vulnerability scanning integration
  - SHA256 hash verification for integrity

### Phase 5: Compliance Workflows 🔄 Pending
- Document workflow automation
- Approval chains and notifications
- Compliance deadline tracking

### Phase 6: Admin & Settings 🔄 Pending
- User management interface
- Organization settings
- Audit log viewer

### Phase 7: Industry Parity 🔄 Pending
- Advanced reporting
- Export capabilities
- API documentation