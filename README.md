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

CyberDocGen (formerly ComplianceAI) is a sophisticated compliance management platform that automates the generation, analysis, and management of compliance documentation. Built for enterprise use, it provides the industry's most comprehensive framework coverage with 34+ compliance standards and 788+ document templates spanning security, privacy, healthcare, financial services, and cloud governance.

### Key Highlights

- 🤖 **AI-Powered** - Latest AI models (GPT-5.1, Claude Opus 4.5, Gemini 3.0 Pro) for intelligent document generation
- 🏢 **Enterprise-Ready** - Multi-tenancy, RBAC, audit logging, and SOC 2 compliance
- 🔒 **Security-First** - MFA, encryption, threat detection, and comprehensive security measures
- ☁️ **Cloud-Integrated** - Google Drive and Microsoft OneDrive connectivity
- 📊 **34+ Compliance Frameworks** - Complete coverage: ISO 27001/27002/27701/42001/9001/22301, SOC 2, FedRAMP, NIST 800-53/CSF 2.0, HIPAA, GDPR, CCPA, PCI DSS 4.0, NYDFS, NIS2, PSD2/3, AWS Well-Architected, CISA Zero Trust
- 📝 **788+ Templates** - Pre-built document templates plus internal SOPs, board governance, and training materials
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

- **Multi-Factor Authentication** - TOTP-based MFA with backup codes and recovery flows
- **Organization Management** - Multi-tenant architecture with role-based access control (RBAC)
- **User Management** - Comprehensive user administration and granular permissions
- **Cloud Integrations** - Google Drive and Microsoft OneDrive synchronization with automated workflows
- **Audit Trails** - Immutable audit logs with tamper detection for all system activities
- **Version Control** - Complete document version history, rollback, and approval workflows
- **Model Context Protocol (MCP)** - Claude Code and agent integration for programmatic access
- **Session Risk Scoring** - Real-time session security assessment and adaptive authentication

### Compliance Management

- **34+ Compliance Frameworks** - Comprehensive coverage across security, privacy, financial, healthcare, and cloud compliance
  - **Security Standards**: ISO 27001:2022 (93 controls), ISO 27002:2022, ISO 27701 (PIMS), ISO 42001 (AI governance)
  - **Federal & Government**: FedRAMP (Low/Moderate/High), NIST 800-53 Rev 5 (20 control families), NIST CSF 2.0 (6 functions)
  - **Audit Frameworks**: SOC 2 Type I/II (Trust Services Criteria)
  - **Healthcare**: HIPAA (Security, Privacy, Breach Notification Rules)
  - **Privacy**: GDPR (EU), CCPA/CPRA (California)
  - **Financial Services**: NYDFS 23 NYCRR 500, PCI DSS 4.0 (12 requirements), PSD2/PSD3, NIS2 (EU)
  - **Quality & Business Continuity**: ISO 9001, ISO 22301
  - **Cloud & Zero Trust**: AWS Well-Architected (6 pillars), CISA Zero Trust Maturity Model (5 pillars)
- **788+ Document Templates** - Pre-built templates covering all framework requirements
- **Internal Operations** - SOPs, board governance, training materials, and operational playbooks
- **Document Workspace** - Collaborative document editing with real-time comments
- **Quality Scoring** - Automated document quality assessment
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

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- PostgreSQL 16+ (optional - app uses in-memory storage by default for development)

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
- [Compliance Frameworks](docs/FRAMEWORKS.md) - **NEW**: Complete guide to 34+ supported frameworks
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

CyberDocGen is designed with enterprise security as a top priority and provides the industry's most comprehensive compliance framework coverage:

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

### Compliance Framework Coverage (34+ Standards)

#### **Security & Information Governance**
- ✅ **ISO 27001:2022** - 93 Annex A controls across 4 categories (Organizational, People, Physical, Technological)
- ✅ **ISO 27002:2022** - Information security controls implementation guide
- ✅ **ISO 27701:2019/2024** - Privacy Information Management System (PIMS)
- ✅ **ISO 42001:2023** - AI Management System (AIMS) - World's first AI governance standard
- ✅ **ISO 9001** - Quality Management System
- ✅ **ISO 22301** - Business Continuity Management System

#### **Federal & Government Compliance**
- ✅ **FedRAMP Low** - 156 NIST 800-53 controls for low-impact federal systems
- ✅ **FedRAMP Moderate** - 323 controls for moderate-impact systems
- ✅ **FedRAMP High** - 413 controls for high-impact federal systems
- ✅ **NIST 800-53 Rev 5** - All 20 control families (1000+ controls)
- ✅ **NIST Cybersecurity Framework 2.0** - 6 functions including new GOVERN pillar (22 categories, 107 subcategories)

#### **Audit & Assurance**
- ✅ **SOC 2 Type I** - Design effectiveness of Trust Services Criteria
- ✅ **SOC 2 Type II** - Operating effectiveness over time (3-12 months)

#### **Healthcare Compliance**
- ✅ **HIPAA Security Rule** - Administrative, Physical, and Technical Safeguards
- ✅ **HIPAA Privacy Rule** - Protected Health Information (PHI) protections
- ✅ **HIPAA Breach Notification Rule** - 60-day notification requirements

#### **Privacy Regulations**
- ✅ **GDPR** - EU General Data Protection Regulation (Articles 1-99)
- ✅ **CCPA/CPRA** - California Consumer Privacy Act with 2024 CPRA amendments

#### **Financial Services & Payment Security**
- ✅ **NYDFS 23 NYCRR 500** - New York Department of Financial Services cybersecurity requirements
- ✅ **PCI DSS 4.0** - Payment Card Industry Data Security Standard (12 requirements, 64 new controls)
- ✅ **PSD2** - Payment Services Directive 2 with Strong Customer Authentication (SCA)
- ✅ **PSD3** - Proposed Payment Services Directive 3 (enforcement expected 2027)
- ✅ **NIS2** - EU Network and Information Security Directive 2 (18 critical sectors)

#### **Cloud & Zero Trust Architecture**
- ✅ **AWS Well-Architected Framework** - 6 pillars (Operational Excellence, Security, Reliability, Performance, Cost, Sustainability)
- ✅ **CISA Zero Trust Maturity Model v2.0** - 5 pillars (Identity, Devices, Networks, Applications/Workloads, Data)

#### **Internal Operations & Governance**
- ✅ **Board Governance** - Cybersecurity board reports, compliance memorandums, risk briefings
- ✅ **Standard Operating Procedures** - Security, Privacy, Compliance, and IT Operations SOPs
- ✅ **Internal Policies** - AUP, remote work, BYOD, data classification, AI usage policies
- ✅ **Training & Awareness** - Security awareness, phishing simulations, privacy training programs
- ✅ **Operational Documents** - Incident playbooks, risk registers, vendor questionnaires, management reports

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

🔄 **ACTIVE DEVELOPMENT**

This application has:
- ✅ Core application features complete
- ✅ Security hardening implemented
- ✅ Multi-model AI orchestration with automatic fallback
- ✅ Real-time threat detection and anomaly monitoring
- ✅ Immutable audit trails for compliance
- ✅ Multi-tenant architecture with organization isolation
- ✅ Comprehensive documentation suite
- 🔄 TypeScript type safety improvements in progress
- 🔄 Test coverage expansion ongoing
- 📋 Wireframe documentation pending

### Current Development Status

**Phase 1 - Foundation** (Complete)
- ✅ Application runs successfully
- ✅ Dependencies installed
- ✅ Environment configured
- ✅ Database schema deployed

**Phase 2 - UI/UX Design & Type Safety** (In Progress)
- 🔄 TypeScript type errors being resolved
- 📋 28 wireframes documentation pending
- 📋 Design system documentation pending
- 📋 Service TODOs completion pending

See [Modernization Roadmap](docs/modernization-roadmap.md) and [Phased Plan](docs/modernization-phased-plan.md) for 2025 enhancements.

### Recent Updates (December 2025)

- ✅ **Latest AI Models** - Updated to GPT-5.1 (OpenAI), Claude Opus 4.5 (Anthropic), and Gemini 3.0 Pro (Google)
- ✅ **Multi-Model AI Orchestration** - Intelligent model selection with automatic fallback between providers
- ✅ **Industry-Leading Framework Coverage** - 34+ compliance frameworks with 788+ document templates
- ✅ **Comprehensive Template Library** - Added 698 new templates across all major compliance standards:
  - Advanced ISO standards (27701 Privacy, 42001 AI Governance, 9001 Quality, 22301 Business Continuity)
  - Financial services (NYDFS, PCI DSS 4.0, PSD2/PSD3, NIS2)
  - Privacy regulations (GDPR, CCPA/CPRA)
  - Cloud & Zero Trust (AWS Well-Architected, CISA Zero Trust Maturity Model)
  - Internal operations (165 templates for SOPs, board governance, training, policies)
- ✅ **Enhanced Documentation** - Complete documentation suite with setup guides, testing guides, and troubleshooting
- ✅ **Dependency Updates** - All npm packages updated to latest compatible versions
- ✅ **Enhanced Audit Service** - Improved audit logging with tamper detection and immutability
- ✅ **Cloud Integration Improvements** - Better error handling and retry logic for external services
- ✅ **MFA Enhancements** - Strengthened multi-factor authentication flows and recovery
- ✅ **Performance Monitoring** - Enhanced metrics collection and observability

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
