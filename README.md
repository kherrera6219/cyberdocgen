
# Compliance Management Prototype

An experimental compliance management application that demonstrates AI-assisted document workflows. This repository is **not production ready** and several features advertised in earlier collateral are still stubs.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Access the application at `http://localhost:5000`

## ✨ Current Capabilities

- **Document Workflows (Prototype)** – Sample endpoints return templated compliance documents and mock upload extraction data.
- **Risk & Gap Analysis Mock Services** – Endpoints surface generated sample data to illustrate dashboards and reports.
- **Authentication via Replit OIDC** – Basic login/logout using Replit OpenID Connect.
- **MFA Scaffolding** – Middleware enforces an MFA flag but does not validate tokens yet (experimental).
- **Cloud Integration Stubs** – REST routes exist for Google Drive and OneDrive but currently return HTTP 501 until OAuth is configured.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **AI Services**: OpenAI, Anthropic Claude, Google AI
- **Authentication**: OpenID Connect + MFA
- **Security**: Multi-layer protection, encryption, threat detection

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [API Documentation](docs/API.md) 
- [Security Overview](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Details](docs/ARCHITECTURE.md)

## 🔒 Security & Compliance Status

This codebase contains scaffolding for several enterprise controls, but the implementation is incomplete. Notable limitations include:

- **No completed security audit** – previous "A-" ratings were marketing copy only.
- **Partial MFA** – verification currently trusts any provided token and should not be used for production security.
- **Placeholder Cloud Integrations** – OAuth flows and file sync are not functional yet.
- **AI Integrations Require Keys** – Calls to third-party LLMs expect environment variables and are not enabled by default.

Refer to [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md) for the full list of gaps and remediation suggestions.
## 📈 Production Status

⚠️ **IN PROGRESS** – Additional engineering, security reviews, and integrations are required before any production deployment.

---

Built with ❤️ as a learning resource for compliance engineering teams.
