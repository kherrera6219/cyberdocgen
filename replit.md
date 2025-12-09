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

### AI Integration
- **Multi-Model Support**: OpenAI GPT-4o and Anthropic Claude with automatic fallback
- **Services**: Document generation, compliance analysis, gap analysis, risk assessment, quality scoring
- **AI Guardrails**: Prompt shields, PII redaction, output classifiers

### Key Directories
- `client/` - React frontend application
- `server/` - Express backend with routes, services, and middleware
- `shared/` - Shared TypeScript types and database schema
- `scripts/` - Utility scripts for encryption, validation, and deployment
- `docs/` - Comprehensive documentation

## External Dependencies

### AI Services
- **OpenAI API** (`OPENAI_API_KEY`) - GPT-4o for document generation and analysis
- **Anthropic API** (`ANTHROPIC_API_KEY`) - Claude for complex reasoning and risk assessment

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
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access