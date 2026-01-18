# CyberDocGen

## Overview

CyberDocGen is an enterprise-grade compliance management system leveraging AI for document analysis and generation. It automates compliance documentation for frameworks like ISO 27001, SOC 2, FedRAMP, and NIST 800-53. Key features include multi-tenant architecture, role-based access control, comprehensive audit logging, and integrations with cloud storage providers, aiming to streamline and secure compliance processes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 (TypeScript, Vite)
- **UI**: Radix UI primitives, shadcn/ui, Tailwind CSS
- **State Management**: TanStack React Query (server state), React Hook Form (forms)
- **Routing**: Wouter
- **Validation**: Zod

### Backend
- **Runtime**: Node.js 20, Express.js (TypeScript)
- **API**: RESTful, layered architecture
- **Authentication**: Replit OpenID Connect, Passport.js, session-based (express-session, connect-pg-simple)
- **Security**:
    - Multi-Tenant Isolation: Organization-scoped data access and enforcement on all API routes.
    - CSRF Protection: User-bound tokens with HMAC-SHA256.
    - AI Endpoint Security: Request size validation and rate limiting.
    - Encryption: AES-256-GCM for data at rest.
    - MFA: TOTP and SMS-based.
    - Rate Limiting: Tiered for general, auth, and AI requests.
    - Audit Logging: Comprehensive with risk-level classification.
    - Security Headers: OWASP compliant.
    - PII Scrubbing: Automatic redaction in logs.
    - AI Guardrails: Prompt injection detection, content filtering.

### Database
- **Type**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Schema**: `shared/schema.ts`
- **Migrations**: Drizzle Kit

### AI Integration
- **Models**: OpenAI GPT-5.1, Anthropic Claude Opus 4.5, Google Gemini 3.0 Pro with automatic fallback.
- **Capabilities**: Document generation, compliance/gap analysis, risk assessment, quality scoring.
- **Insights**: Real-time analytics (`/api/ai/hub-insights`) for compliance and risk identification.

### System Design
- **Core Services**: Session risk scoring, key rotation, chaos testing, SBOM generation.
- **Compliance Workflows**: Automated document lifecycle, approval chains, notifications, deadline tracking.
- **Admin Features**: Admin settings (OAuth, PDF security, cloud integration, user/role management), audit log viewer.
- **Reporting**: AI-powered risk assessment, compliance gap analysis, document quality analysis.
- **Export**: PDF, DOCX, TXT, HTML, JSON, Markdown formats.
- **API Documentation**: OpenAPI 3.1 specification, interactive Swagger UI.
- **Templates**: 50 document templates across ISO 27001, SOC 2, FedRAMP, NIST 800-53.

## External Dependencies

### AI Services
- **OpenAI API**: GPT-5.1 (`OPENAI_API_KEY`)
- **Anthropic API**: Claude Opus 4.5 (`ANTHROPIC_API_KEY`)
- **Google AI API**: Gemini 3.0 Pro (`GOOGLE_API_KEY`)

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL (`DATABASE_URL`)

### Cloud Storage
- **Replit Object Storage**
- **Google Drive**
- **Microsoft OneDrive**

### Authentication
- **Replit OpenID Connect** (`REPLIT_DOMAINS`, `REPL_ID`, `SESSION_SECRET`)