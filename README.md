<div align="center">

# CyberDocGen

### Enterprise Compliance Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

**Production-ready, enterprise-grade compliance management system with AI-powered document analysis and generation capabilities.**

[Features](#-features) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Contributing](#-contributing) •
[License](#-license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Security & Compliance](#-security--compliance)
- [Contributing](#-contributing)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Support](#-support)
- [License](#-license)

## Overview

CyberDocGen (formerly ComplianceAI) is a sophisticated compliance management platform that automates the generation, analysis, and management of compliance documentation. Built for enterprise use, it supports multiple compliance frameworks including ISO 27001, SOC 2, FedRAMP, and NIST 800-53.

### Key Highlights

- 🤖 **AI-Powered** - Latest AI models (GPT-5.1, Claude Opus 4.5, Gemini 3.0 Pro) for intelligent document generation
- 🏢 **Enterprise-Ready** - Multi-tenancy, RBAC, audit logging, and SOC 2 compliance
- 🔒 **Security-First** - MFA, encryption, threat detection, and comprehensive security measures
- ☁️ **Cloud-Integrated** - Google Drive and Microsoft OneDrive connectivity
- 📊 **Compliance Frameworks** - ISO 27001:2022, SOC 2, FedRAMP, NIST 800-53 Rev 5
- 🚀 **Production-Ready** - Comprehensive testing, monitoring, and deployment tools

## ✨ Features

### AI-Powered Capabilities

- **Multi-Model AI Orchestration** - Intelligent routing between GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro with automatic fallback
- **Intelligent Document Generation** - Automated creation of compliance documents with industry-specific customization
- **Document Analysis** - AI-powered review and quality scoring with detailed feedback
- **Compliance Gap Analysis** - Identify missing controls and compliance gaps across all frameworks
- **Risk Assessment** - Automated risk analysis with maturity scoring and remediation recommendations
- **Compliance Chatbot** - Interactive AI assistant for compliance questions with context awareness
- **AI Guardrails** - Prompt injection detection, PII redaction, and output moderation
- **Model Fine-Tuning** - Custom model training for organization-specific compliance needs

### Enterprise Features

- **Multi-Factor Authentication** - TOTP-based MFA with backup codes and recovery flows (implemented)
- **Organization Management** - Multi-tenant architecture with role-based access control (RBAC)
- **User Management** - Comprehensive user administration and granular permissions
- **Cloud Integrations** - Google Drive and OneDrive endpoints (currently using mock shims - OAuth implementation needed)
- **Audit Trails** - Immutable audit logs with tamper detection for all system activities (implemented)
- **Version Control** - Complete document version history, rollback, and approval workflows
- **Model Context Protocol (MCP)** - Claude Code and agent integration for programmatic access
- **Session Risk Scoring** - Real-time session security assessment and adaptive authentication (implemented)

### Compliance Management

- **Multiple Frameworks** - ISO 27001:2022, SOC 2 Type I/II, FedRAMP (Low/Moderate/High), NIST 800-53 Rev 5
- **Document Workspace** - Collaborative document editing with real-time comments
- **Quality Scoring** - Automated document quality assessment
- **Template Management** - Pre-built templates for all supported frameworks
- **Custom Controls** - Define and manage custom compliance controls

### Security & Monitoring

- **Data Encryption** - AES-256 encryption at rest and TLS 1.3 in transit with key rotation
- **Threat Detection** - Real-time anomaly detection, pattern recognition, and automated alerting
- **Rate Limiting** - DDoS protection with tiered rate limiting (1000 requests/15 min)
- **Security Headers** - Comprehensive security header configuration with CSP and HSTS
- **Health Checks** - Kubernetes-compatible health, readiness, and liveness probes
- **Metrics Collection** - Prometheus-style metrics for observability and performance tracking
- **CSRF Protection** - Session-bound CSRF tokens for all state-changing operations
- **Input Validation** - Comprehensive Zod schema validation for all API endpoints

## 🛠 Tech Stack

### Frontend

- **React 18.3** - Modern UI framework with concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 6.4** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack React Query** - Powerful server state management
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### Backend

- **Node.js 20** - JavaScript runtime
- **Express 4.21** - Web framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL 16** - Relational database
- **Drizzle ORM 0.39** - Type-safe ORM
- **Passport.js** - Authentication middleware
- **OpenAI API** - GPT-5.1 integration (latest flagship model)
- **Anthropic API** - Claude Opus 4.5 integration (latest reasoning model)
- **Google AI API** - Gemini 3.0 Pro integration (latest multimodal model)

### Infrastructure

- **Neon** - Serverless PostgreSQL
- **Google Cloud Storage** - Object storage
- **Replit** - Deployment platform
- **Winston** - Structured logging
- **Vitest** - Unit testing framework

## 🚀 Quick Start

> **⚠️ Setup Required:** This repository requires initial setup before running. Dependencies need to be installed and environment configured. The application is ~70-75% complete with core features implemented but setup steps are needed to run it locally.

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- PostgreSQL 16+ (optional - app uses in-memory storage by default for development)
- AI API keys (OpenAI, Anthropic, Google AI) for full functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kherrera6219/cyberdocgen.git
   cd cyberdocgen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database** (optional for development)
   ```bash
   # Only required for persistent storage
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:5000
   ```

For detailed setup instructions, see [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md).

## 📚 Documentation

### Getting Started

- [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Detailed setup instructions
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Development workflow and best practices
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

### Technical Documentation

- [Architecture](docs/ARCHITECTURE.md) - System architecture and design
- [API Documentation](docs/API.md) - Complete API reference
- [Security](docs/SECURITY.md) - Security implementation details
- [Testing](docs/TESTING.md) - Testing strategies and guidelines

### Operations

- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Component Documentation

- [Frontend Documentation](client/README.md) - React frontend architecture
- [Backend Documentation](server/README.md) - Node.js backend architecture
- [MCP Integration Guide](server/mcp/README.md) - Model Context Protocol integration
- [Scripts Documentation](scripts/README.md) - Utility scripts reference

## 📁 Project Structure

```
cyberdocgen/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (40+ pages)
│   │   ├── components/    # Reusable components (80+)
│   │   ├── hooks/         # Custom React hooks (5 hooks)
│   │   ├── contexts/      # Context API providers
│   │   └── lib/           # Utility libraries
│   └── README.md          # Frontend documentation
│
├── server/                 # Node.js backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── routes/            # Route modules (16 modules)
│   ├── services/          # Business logic (33 services)
│   ├── middleware/        # Express middleware (4 files)
│   ├── mcp/               # Model Context Protocol integration
│   ├── monitoring/        # Metrics and monitoring
│   ├── utils/             # Utilities (logging, validation)
│   └── README.md          # Backend documentation
│
├── shared/                 # Shared code
│   └── schema.ts          # Database schema (Drizzle)
│
├── scripts/                # Utility scripts
│   └── README.md          # Scripts documentation
│
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── components/        # Component tests
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── ENVIRONMENT_SETUP.md
│   ├── TESTING.md
│   └── TROUBLESHOOTING.md
│
├── .github/                # GitHub configuration
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── CONTRIBUTING.md         # Contributing guidelines
├── CODE_OF_CONDUCT.md      # Code of conduct
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── README.md               # This file
```

## 🔒 Security & Compliance

CyberDocGen is designed with enterprise security as a top priority:

### Security Features

- ✅ **Multi-Factor Authentication** - TOTP-based MFA with recovery codes
- ✅ **Data Encryption** - AES-256 encryption for sensitive data
- ✅ **Secure Sessions** - HttpOnly, Secure cookies with session rotation
- ✅ **Rate Limiting** - DDoS protection and request throttling
- ✅ **Input Validation** - Comprehensive input sanitization and validation
- ✅ **SQL Injection Prevention** - Parameterized queries with Drizzle ORM
- ✅ **XSS Protection** - Content Security Policy and output encoding
- ✅ **Audit Logging** - Immutable audit trails for all operations
- ✅ **Threat Detection** - Real-time anomaly detection

### Compliance

- **SOC 2 Type II Ready** - Complete audit trail and security controls
- **ISO 27001:2022** - Information security management
- **FedRAMP** - Federal compliance requirements
- **NIST 800-53 Rev 5** - Security and privacy controls
- **GDPR** - Data protection and privacy considerations

See [Security Documentation](docs/SECURITY.md) for detailed information.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### Branch Strategy & Stability

- **Single Source of Truth**: All active development is consolidated on the `main` branch so downstream branches can be safely deleted after merging.
- **Feature Branches Only for Work-In-Progress**: Create short-lived feature branches from `main` and open pull requests back to `main`.
- **Quality Gate Visibility**: `npm run check` currently reports outstanding type errors in legacy UI flows; fixes are being staged incrementally alongside security hardening.
- **Security Posture**: GitHub security alerts are being triaged on `main` with dependency updates prioritized for high/critical advisories.

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run check        # TypeScript type checking
npm test             # Run tests
npm run db:push      # Apply database changes
```

### Development Workflow

1. Create a new branch for your feature
2. Make your changes with tests
3. Run tests and type checking
4. Submit a pull request

See [Development Guide](docs/DEVELOPMENT_GUIDE.md) for detailed information.

## 🧪 Testing

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

See [Testing Documentation](docs/TESTING.md) for testing guidelines.

## 🚀 Deployment

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

### Deployment Options

- **Replit** - Configured and ready
- **Docker** - Containerized deployment
- **Traditional VPS** - Linux server deployment
- **Cloud Platforms** - AWS, GCP, Azure

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 📈 Production Status

🔄 **ACTIVE DEVELOPMENT** - ~70-75% Complete

This application has:
- ✅ Core application features complete (40 pages, 86 components)
- ✅ Security architecture implemented
- ✅ Multi-model AI orchestration code written (GPT-5.1, Claude Opus 4.5, Gemini 3.0 Pro)
- ✅ Real-time threat detection and anomaly monitoring implemented
- ✅ Immutable audit trails for compliance
- ✅ Multi-tenant architecture with organization isolation
- ✅ Comprehensive documentation suite (excellent!)
- ✅ Design system documentation complete (1072 lines)
- ⚠️ **Dependencies installation required** - Currently incomplete
- ⚠️ **Environment configuration needed** - .env file missing
- 🔄 Partial wireframe coverage (11/28 wireframes = 39%)
- 🔄 TypeScript type safety improvements in progress
- 🔄 Test coverage expansion needed (currently ~25%, target 80%+)
- 🔄 Cloud integrations using mock shims (need real OAuth implementation)

### Current Development Status

**Phase 1 - Foundation** (⚠️ Incomplete - Setup Required)
- ⚠️ Dependencies need installation (`npm install` - many UNMET DEPENDENCY errors)
- ⚠️ Environment configuration needed (copy `.env.example` to `.env`)
- ❌ Build directory missing (`/dist` - run `npm run build`)
- ❌ Application not verified running
- ℹ️ Database schema ready (needs `npm run db:push`)

**Phase 2 - UI/UX Design & Type Safety** (In Progress - 40% Complete)
- ✅ Design system documentation complete
- ✅ 11 wireframes created (Login, Dashboard, Documents, Gap Analysis, MFA, Signup, Audit Trail, Cloud, AI Assistant, Profile)
- 🔄 TypeScript type errors (due to missing dependencies)
- 📋 17 additional wireframes needed (Registration, Password Recovery, Document Editor, Reports, Admin pages, etc.)
- 📋 Service TODOs completion pending (audit, PDF security, MFA backup codes)

**Phase 3 - Feature Completion & Testing** (Planned)
- 📋 Complete cloud integrations (replace mock shims with real Google Drive/OneDrive OAuth)
- 📋 Increase test coverage from 25% to 80%+ (unit, integration, E2E tests)
- 📋 WCAG 2.2 AA accessibility compliance and testing
- 📋 PWA offline support completion
- 📋 OpenAPI 3.1 specification generation
- 📋 Security enhancements (nonce-based CSP, user-based rate limiting)

**Phase 4 - Production Polish & Deployment** (Planned)
- 📋 OpenTelemetry observability integration
- 📋 Component Storybook for all 86+ components
- 📋 Compliance documentation finalization (SOC 2, ISO 27001)
- 📋 Performance optimization (Lighthouse >90)
- 📋 Production deployment and CI/CD

See [Development TODO](docs/todo.md), [Modernization Roadmap](docs/modernization-roadmap.md), and [Phased Plan](docs/modernization-phased-plan.md) for detailed tasks and 2025 enhancements.

### Recent Updates (December 2025)

- ✅ **Latest AI Models Integration** - Code written for GPT-5.1 (OpenAI), Claude Opus 4.5 (Anthropic), and Gemini 3.0 Pro (Google)
- ✅ **Multi-Model AI Orchestration** - Intelligent model selection with automatic fallback between providers (implemented)
- ✅ **Enhanced Documentation** - Complete documentation suite with setup guides, testing guides, and troubleshooting
- ✅ **Design System Complete** - Comprehensive 1072-line design system documentation
- ✅ **11 Wireframes Created** - Core user flows documented (login, dashboard, documents, gap analysis, etc.)
- ✅ **Enhanced Audit Service** - Audit logging with tamper detection and immutability (code complete)
- ✅ **Security Architecture** - Comprehensive security middleware stack implemented
- ✅ **Performance Monitoring** - Metrics collection and observability framework in place
- ⚠️ **Setup Required** - Dependencies and environment configuration needed before running

### 2025 Roadmap Highlights

**Planned Enhancements:**
- 🎯 **WCAG 2.2 AA+ Compliance** - Enhanced accessibility with automated testing
- 🎯 **PWA Support** - Progressive Web App with offline capabilities
- 🎯 **WebAuthn/FIDO2** - Hardware-backed authentication
- 🎯 **OpenAPI 3.1** - Complete API documentation with auto-generated clients
- 🎯 **AI Safety Guardrails** - Enhanced prompt shields and PII redaction
- 🎯 **Data Residency Controls** - Tenant-level geographic data controls
- 🎯 **Advanced Observability** - OpenTelemetry integration with distributed tracing

For complete roadmap details, see [docs/modernization-roadmap.md](docs/modernization-roadmap.md).

## 💬 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/kherrera6219/cyberdocgen/issues)
- 💬 [Discussions](https://github.com/kherrera6219/cyberdocgen/discussions)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Node.js](https://nodejs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AI powered by [OpenAI](https://openai.com/), [Anthropic](https://www.anthropic.com/), and [Google AI](https://ai.google.dev/)

---

<div align="center">

**Built for enterprise compliance teams**

[⬆ Back to Top](#cyberdocgen)

</div>
