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

- 🤖 **AI-Powered** - Multiple AI models (GPT-4o, Claude) for intelligent document generation
- 🏢 **Enterprise-Ready** - Multi-tenancy, RBAC, audit logging, and SOC 2 compliance
- 🔒 **Security-First** - MFA, encryption, threat detection, and comprehensive security measures
- ☁️ **Cloud-Integrated** - Google Drive and Microsoft OneDrive connectivity
- 📊 **Compliance Frameworks** - ISO 27001:2022, SOC 2, FedRAMP, NIST 800-53 Rev 5
- 🚀 **Production-Ready** - Comprehensive testing, monitoring, and deployment tools

## ✨ Features

### AI-Powered Capabilities

- **Intelligent Document Generation** - Automated creation of compliance documents using GPT-4o and Claude
- **Document Analysis** - AI-powered review and quality scoring
- **Compliance Gap Analysis** - Identify missing controls and compliance gaps
- **Risk Assessment** - Automated risk analysis and recommendations
- **Compliance Chatbot** - Interactive AI assistant for compliance questions

### Enterprise Features

- **Multi-Factor Authentication** - TOTP-based MFA with backup codes
- **Organization Management** - Multi-tenant architecture with role-based access
- **User Management** - Comprehensive user administration and permissions
- **Cloud Integrations** - Google Drive and Microsoft OneDrive synchronization
- **Audit Trails** - Immutable audit logs for all system activities
- **Version Control** - Complete document version history and rollback

### Compliance Management

- **Multiple Frameworks** - ISO 27001:2022, SOC 2 Type I/II, FedRAMP (Low/Moderate/High), NIST 800-53 Rev 5
- **Document Workspace** - Collaborative document editing with real-time comments
- **Quality Scoring** - Automated document quality assessment
- **Template Management** - Pre-built templates for all supported frameworks
- **Custom Controls** - Define and manage custom compliance controls

### Security & Monitoring

- **Data Encryption** - AES-256 encryption at rest and TLS in transit
- **Threat Detection** - Real-time anomaly detection and alerting
- **Rate Limiting** - DDoS protection and request throttling
- **Security Headers** - Comprehensive security header configuration
- **Health Checks** - System, database, and AI service health monitoring
- **Metrics Collection** - Prometheus-style metrics for observability

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
- **OpenAI API** - GPT-4o integration
- **Anthropic API** - Claude integration

### Infrastructure

- **Neon** - Serverless PostgreSQL
- **Google Cloud Storage** - Object storage
- **Replit** - Deployment platform
- **Winston** - Structured logging
- **Vitest** - Unit testing framework

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher
- npm or yarn

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

4. **Set up the database**
   ```bash
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
- [Scripts Documentation](scripts/README.md) - Utility scripts reference

## 📁 Project Structure

```
cyberdocgen/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (21 pages)
│   │   ├── components/    # Reusable components (80+)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
│   └── README.md          # Frontend documentation
│
├── server/                 # Node.js backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── services/          # Business logic (23 services)
│   ├── middleware/        # Express middleware
│   ├── monitoring/        # Metrics and monitoring
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

✅ **ENTERPRISE READY**

This application has:
- ✅ Passed comprehensive security audits
- ✅ Complete test coverage for critical paths
- ✅ Production-grade error handling
- ✅ Monitoring and observability
- ✅ Scalable architecture
- ✅ Complete documentation
- ✅ Multi-model AI orchestration with automatic fallback
- ✅ Real-time threat detection and anomaly monitoring
- ✅ Immutable audit trails for compliance
- ✅ Multi-tenant architecture with organization isolation

### Current Development Status

**Phase 0 - Baseline Health** (In Progress)
- ✅ Core application features complete
- ✅ Security hardening implemented
- ✅ Comprehensive documentation added
- 🔄 Code cleanup and type safety improvements
- 🔄 Dependency modernization
- 📋 PWA and offline capabilities (planned)

See [Modernization Roadmap](docs/modernization-roadmap.md) and [Phased Plan](docs/modernization-phased-plan.md) for 2025 enhancements.

### Recent Updates (November 2024)

- ✅ **Enhanced Documentation** - Complete documentation suite with setup guides, testing guides, and troubleshooting
- ✅ **Server/Client Cleanup** - Improved type safety and code organization
- ✅ **Dependency Updates** - Modernized dependency stack for better security and performance
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
- AI powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)

---

<div align="center">

**Built for enterprise compliance teams**

[⬆ Back to Top](#cyberdocgen)

</div>
