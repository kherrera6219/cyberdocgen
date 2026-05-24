<div align="center">

<img src="public/logo.svg" alt="CyberDocGen" width="80" />

# CyberDocGen

### AI-Powered GRC & Compliance Documentation Platform

**Local-First · On-Premises Ready · Multi-Framework · Enterprise-Grade**

[![CI Security Pipeline](https://github.com/kherrera6219/cyberdocgen/actions/workflows/ci.yml/badge.svg)](https://github.com/kherrera6219/cyberdocgen/actions/workflows/ci.yml)
[![Docker Build](https://github.com/kherrera6219/cyberdocgen/actions/workflows/docker-build.yml/badge.svg)](https://github.com/kherrera6219/cyberdocgen/actions/workflows/docker-build.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License: PolyForm NC](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue)](LICENSE)
[![Windows Desktop](https://img.shields.io/badge/Platform-Windows%2011%20Desktop-0078D4?logo=windows&logoColor=white)](docs/WINDOWS_DESKTOP_GUIDE.md)

---

*The only GRC platform that runs entirely on your hardware — no cloud dependency, no data egress, no vendor lock-in.*

</div>

---

## Table of Contents

1. [What is CyberDocGen?](#what-is-cyberdocgen)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Deployment Modes](#deployment-modes)
6. [Quick Start](#quick-start)
7. [AI & LLM Integration](#ai--llm-integration)
8. [Compliance Frameworks](#compliance-frameworks)
9. [Database & Storage](#database--storage)
10. [Security Architecture](#security-architecture)
11. [Repository Layout](#repository-layout)
12. [Development Workflow](#development-workflow)
13. [Validation & Quality Gates](#validation--quality-gates)
14. [Production Deployment](#production-deployment)
15. [Roadmap](#roadmap)
16. [Documentation Map](#documentation-map)
17. [Contributing](#contributing)
18. [License](#license)

---

## What is CyberDocGen?

CyberDocGen is an **enterprise-grade Governance, Risk & Compliance (GRC) platform** that combines multi-model AI orchestration with comprehensive compliance tooling. Designed for security teams, compliance officers, and auditors, it generates, scores, reviews, and manages the full lifecycle of compliance documentation — entirely on-premises.

Unlike SaaS-based GRC tools that send your sensitive policies and evidence to third-party cloud infrastructure, CyberDocGen operates as a **self-contained local application**. It ships as a native Windows desktop installer (`.exe`), can be deployed as a Docker container on a VM, and optionally connected to your existing PostgreSQL instance. Your data never leaves your perimeter.

### Who is it for?

| Persona | Primary Use |
|---|---|
| **CISO / Security Manager** | Program-level compliance oversight, risk register, policy lifecycle |
| **Compliance Officer** | Framework gap analysis, control mapping, evidence collection |
| **Auditor** | Immutable evidence review, control scoring, auditor workspace |
| **Developer / DevSecOps** | Repository compliance analysis, autonomous PR generation for remediation |
| **IT / Operations** | Vendor GRC, LDAP/AD integration, local admin settings |

---

## Key Features

### 📋 Compliance Documentation Generation
- Multi-model AI generation across **ISO 27001:2022**, **SOC 2 Type II**, **FedRAMP Moderate**, and **NIST 800-53 Rev. 5**
- Framework-aligned policy templates with version history and approval workflows
- Document watermarking, PDF encryption (AES-256), and digital signatures
- Live control scoring with gap analysis and remediation recommendations

### 👁️ Zero-Trust Multimodal Evidence Vision Auditor
- **Gemini Vision Evidence Checks**: Inspect uploaded evidence files (screenshots of security panels, firewall rules, server configurations) utilizing computer vision.
- **Automated Compliance Verification**: Verifies if visual controls are compliant, producing an audit verdict, confidence score, detailed auditor notes, and remediation insights stored in the database.

### 🛡️ Gated Customer Trust Center Portal
- **Attested Security Portal**: Showcase real-time compliance maturity, SOC 2/ISO certificates, and policy catalogs to prospective buyers via `client/src/pages/trust-center.tsx`.
- **Cryptographically Sealed NDAs**: Force signing of NDAs attested with legally-binding SHA-256 HMAC-like hashes logged directly in the secure database.
- **Watermarked & Locked Downloads**: Dynamic watermarking overlays (`RESTRICTED - FOR <BUYER> ONLY...`) and AES-256 password security locks applied automatically on the fly to downloaded documents. Logs buyer IP addresses for robust access catalogs.

### 🤖 AI Auditor "Digital Twin" Simulator
- **Multi-Agent GRC Debates**: Run background simulations in `services/digitalTwinService.ts` where a strict/nitpicky **AI Auditor Twin** challenges organizational controls, and an **AI Admin Twin** defends them using active policy documents.
- **Readiness Scoring & Reporting**: Render live transcripts, circular compliance dial scores, and download complete mock-audit markdown reports with remediation roadmaps inside `client/src/pages/digital-twin.tsx`.

### 🚨 Real-time GRC Compliance Telemetry Engine
- **Transactional Policy Alarms**: Intercepts active operations in real-time. Automatically flags security policy violations (e.g. deleting framework documents, removing risk register items, or deleting PDF encryption settings).
- **Incident Reports Auto-Drafting**: Auto-generates detailed Incident Reports inside the document store, raising alarms in `alertingService` and piping logs to the native **Windows Event Viewer (Application Log)** with graceful Winston rotators fallback.

### 🏢 Enterprise Identity & Active Directory Bindings
- **LDAP / Active Directory Integration**: Robust on-premises AD binding (LDAP URL, Bind DN, search scopes) allowing corporate network teams to authenticate natively with domain credentials.
- **Identity Sync Matrix**: Multi-provider sync (Okta, Microsoft Entra ID, Rippling, Gusto) via Directory APIs, executing access revocation reviews and automated user offboarding telemetry.

### 🤖 RAG-Powered AI Questionnaire Solver
- **Spreadsheet Question Answering**: Ingest custom security questionnaire spreadsheets (CSV, XLSX) sent by prospective clients.
- **Local pgvector RAG**: Automatically answers questions by querying policy documents, active controls, and codebases, providing confidence scores and exact policy citations.

### 📁 Repository Analysis & Autonomous Remediation
- **Secure Code Scan**: Inspect uploaded source code archives (ZIP) for visual control flows: authentication, key rotation, Winston log rotation caps, and field-level encryption.
- **Autonomous Secure PR Generation**: Chat with the compliance assistant to generate exact secure fixes for codebase gaps, pushing a secure Pull Request straight to the GitHub/GitLab repository with 1-click.

### 👥 Personnel Portal & Risk Register
- **Attestation Dashboard**: Employee policy acknowledgments cryptographically signed and sealed using secure SHA-256 HMAC signature receipts.
- **Interactive Risk Kanban**: Drag-and-drop risk lanes mapping inherent (likelihood * impact) vs. residual (mitigation-reduced) scores inside a high-end glassmorphic register.

### 🖥️ Native Windows Desktop & Air-Gap Resilience
- **Native Electron Shell**: Frameless custom desktop window with system tray and status bars.
- **WASM Local-First Engine**: In-process PGlite WASM database (zero server dependency) with local MiniLM-L6-v2 ONNX sentence-transformer embeddings for 100% off-grid security.

---

## Architecture

CyberDocGen follows a **local-first, service-oriented architecture** built on a TypeScript monorepo. The server and client share schema types, enabling end-to-end type safety from database to UI.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CyberDocGen Platform                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Electron Desktop Shell                        │  │
│  │              (Frameless Window · System Tray · IPC)              │  │
│  └─────────────────────────┬────────────────────────────────────────┘  │
│                             │                                           │
│  ┌──────────────────────────▼───────────────────────────────────────┐  │
│  │                   React 18 + Vite Client                         │  │
│  │                                                                  │  │
│  │  Pages: Dashboard · ISO 27001 · SOC 2 · FedRAMP · NIST          │  │
│  │         Gap Analysis · Risk Register · Vendor GRC                │  │
│  │         Repository Analysis · Evidence Ingestion                 │  │
│  │         AI Questionnaire Solver · Auditor Workspace              │  │
│  │         Personnel Portal · Local Settings (LDAP · DB · Net)      │  │
│  │                                                                  │  │
│  │  Design: Radix UI · Tailwind CSS · Framer Motion · Recharts      │  │
│  │  State:  TanStack Query v5 · Wouter · React Hook Form            │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │ HTTP / REST + WebSocket                   │
│  ┌──────────────────────────▼───────────────────────────────────────┐  │
│  │                Express 4 + TypeScript API Server                 │  │
│  │                                                                  │  │
│  │  Auth Layer:    Local bypass · Passport.js · LDAP bind           │  │
│  │  Middleware:    Rate limit · CORS · CSP · Session risk scoring    │  │
│  │  Routes:        /api/documents · /api/vendors · /api/risks       │  │
│  │                 /api/questionnaire-solver · /api/admin/ldap      │  │
│  │                 /api/repository · /api/evidence · /api/ai        │  │
│  │  MCP Server:    Agent tool registry (10+ compliance tools)       │  │
│  │                                                                  │  │
│  │  ┌─────────────────────┐   ┌──────────────────────────────────┐ │  │
│  │  │   Service Layer     │   │    Repository Layer              │ │  │
│  │  │                     │   │                                  │ │  │
│  │  │  AI Orchestrator    │   │  Documents · Companies · Users   │ │  │
│  │  │  Questionnaire RAG  │   │  Vendors · Questionnaires        │ │  │
│  │  │  Vendor GRC Scorer  │   │  Risks · Evidence · Snapshots    │ │  │
│  │  │  Encryption (AES)   │   │  AgentToolLogs · AgentState      │ │  │
│  │  │  Audit Ledger HMAC  │   │  PolicyAcknowledgments           │ │  │
│  │  │  Key Rotation       │   │                                  │ │  │
│  │  │  LDAP Auth          │   │  Storage Driver (IStorage)       │ │  │
│  │  │  Policy Sync        │   │  ├── PGlite (local/desktop)      │ │  │
│  │  └─────────────────────┘   │  └── PostgreSQL (VM/cloud)       │ │  │
│  │                            └──────────────────────────────────┘ │  │
│  └────────────┬────────────────────────┬─────────────────────────────┘  │
│               │                        │                                │
│  ┌────────────▼─────────┐  ┌──────────▼───────────────────────────┐   │
│  │  PGlite / PostgreSQL │  │     AI Provider Gateway               │   │
│  │  (Embedded or Remote)│  │                                       │   │
│  │                      │  │  ┌─────────────┐ ┌────────────────┐  │   │
│  │  Tables: 60+         │  │  │  OpenAI     │ │  Anthropic     │  │   │
│  │  Full SQL + Drizzle  │  │  │  GPT-5      │ │  Claude 4.6    │  │   │
│  │  ORM + Migrations    │  │  └─────────────┘ └────────────────┘  │   │
│  └──────────────────────┘  │  ┌─────────────┐                     │   │
│                             │  │  Google     │  Latency-aware      │   │
│  ┌──────────────────────┐   │  │  Gemini     │  fallback chain     │   │
│  │  Local Filesystem    │   │  └─────────────┘                     │   │
│  │  Evidence · Uploads  │   └──────────────────────────────────────┘   │
│  │  Repo Archives       │                                              │
│  └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Document Generation

```
User Request → AI Orchestrator → Model Selection (cost/latency/capability)
     → Guardrails Check → LLM Generation → Output Validation
     → PII Redaction → Policy Citation → Document Store
     → AI Usage Disclosure Log (HMAC signed) → Audit Trail
```

### Data Flow: Questionnaire Solving (RAG)

```
Upload CSV/XLSX → Parse Questions → Local Embedding (all-MiniLM-L6-v2)
     → Vector Search (pgvector) over Policy Documents
     → Semantic Match → LLM Answer Generation
     → Confidence Score → Citation Extraction → Export CSV
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Server runtime |
| **Language** | TypeScript 5.9 | End-to-end type safety |
| **Frontend** | React 18.3 + Vite 6.4 | SPA with HMR |
| **UI Components** | Radix UI + shadcn/ui | Accessible primitives |
| **Styling** | Tailwind CSS 3 + Framer Motion | Design system + animations |
| **API Server** | Express 4 | REST API + middleware |
| **ORM** | Drizzle ORM 0.45 | Type-safe SQL queries |
| **Database (Local)** | PGlite 0.4 (embedded PostgreSQL) | Zero-dependency local DB |
| **Database (Remote)** | PostgreSQL 15+ | VM/cloud deployments |
| **Auth** | Passport.js + express-session | Local auth bypass + LDAP |
| **Desktop Shell** | Electron 40 | Native Windows packaging |
| **Installer** | NSIS via electron-builder | Windows `.exe` installer |
| **AI: OpenAI** | openai SDK 5.x | GPT-5 generation |
| **AI: Anthropic** | @anthropic-ai/sdk 0.70 | Claude Sonnet 4.6 |
| **AI: Google** | @google/genai 1.x | Gemini Pro |
| **AI Protocol** | MCP (Model Context Protocol) | Agent tool invocation |
| **Encryption** | AES-256-GCM (Node crypto) | Field-level data encryption |
| **PDF** | pdf-lib + pdf-parse | Generation + extraction |
| **Office Files** | ExcelJS + Mammoth | XLSX/DOCX parsing |
| **Observability** | OpenTelemetry + Winston | Tracing + structured logs |
| **Testing** | Vitest 3.2 + Playwright | Unit + E2E tests |
| **CI/CD** | GitHub Actions | Automated quality gates |

---

## Deployment Modes

CyberDocGen supports three deployment topologies — all running the same codebase.

| Mode | Infrastructure | Auth | Database | Best For |
|---|---|---|---|---|
| **Desktop (Default)** | Windows 10/11 PC | Local bypass | PGlite (embedded) | Single-user, fully air-gapped |
| **On-Premises VM** | Linux/Windows Server | LDAP / Local | PostgreSQL | Team deployment, internal network |
| **Cloud (Future)** | Docker / Kubernetes | Enterprise SSO | PostgreSQL | Multi-tenant SaaS |

The active deployment mode is detected at startup via `DEPLOYMENT_MODE` environment variable and governs which features, routes, and auth providers are enabled. See [`server/config/runtime.ts`](server/config/runtime.ts).

---

## Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- Git

### Local Development (Desktop Mode)

```bash
# 1. Clone the repository
git clone https://github.com/kherrera6219/cyberdocgen.git
cd cyberdocgen

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

Edit `.env` — minimum required variables:

```dotenv
# Leave blank to use embedded PGlite (recommended for local dev)
DATABASE_URL=

# Security secrets — generate with: openssl rand -hex 32
SESSION_SECRET=replace-with-a-random-32-char-secret
ENCRYPTION_KEY=replace-with-a-64-char-hex-key-0000000000000000
DATA_INTEGRITY_SECRET=replace-with-a-random-secret

# Configure at least one AI provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_KEY=AIza...
```

```bash
# 4. Initialize database schema
npm run db:push

# 5. Start development server
npm run dev
```

The application is available at:

| Endpoint | URL |
|---|---|
| Application | `http://localhost:5000` |
| Health Check | `http://localhost:5000/api/health` |
| API Docs | `http://localhost:5000/api-docs` (set `ENABLE_SWAGGER=true`) |

### On-Premises VM / PostgreSQL

```bash
# Set these additional variables in .env:
DATABASE_URL=postgresql://user:password@localhost:5432/cyberdocgen
DEPLOYMENT_MODE=local

npm run db:push
npm run dev
```

### Docker

```bash
# Build image
docker build -t cyberdocgen .

# Run with environment file
docker run -p 5000:5000 --env-file .env cyberdocgen

# Or with docker-compose (includes PostgreSQL)
docker-compose up
```

### Windows Desktop Installer

```bash
# Build signed NSIS installer
npm run build:win

# Output: dist/packaging/CyberDocGen-Setup-x.x.x.exe
```

See [docs/WINDOWS_DESKTOP_GUIDE.md](docs/WINDOWS_DESKTOP_GUIDE.md) for the full installation guide.

---

## AI & LLM Integration

### Multi-Provider Orchestration

CyberDocGen routes AI workloads intelligently across three providers:

```
Request → AIOrchestrator
  ├─ Model Selection (configured preference + latency + capability)
  ├─ Input Guardrails (PII scan, prompt injection detection)
  ├─ [Provider API call]
  ├─ Output Validation (compliance-specific rules, hallucination scoring)
  ├─ PII Redaction (post-generation)
  └─ Audit Disclosure Log (HMAC signed, immutable)
```

### Supported Models

| Provider | Models | Used For |
|---|---|---|
| **OpenAI** | GPT-5, GPT-4o | Policy generation, gap analysis |
| **Anthropic** | Claude Sonnet 4.6 (Thinking) | Complex reasoning, control mapping |
| **Google** | Gemini Pro | Document analysis, summarization |

### MCP Tool Server

CyberDocGen exposes a Model Context Protocol (MCP) server at `/mcp`, enabling external AI agents to invoke:

- `generateDocument` — Generate a compliance document from a template
- `analyzeDocument` — Score a document against a framework
- `runGapAnalysis` — Assess compliance gaps
- `assessRisk` — Score a risk item
- `queryControlStatus` — Look up control implementation status
- `searchEvidence` — Query the evidence library
- `exportDocuments` — Package documents for audit delivery

### Local Embeddings

The RAG pipeline uses local sentence-transformer embeddings (no external API required for semantic search):

```
Policy Documents → Chunking (512 tokens, 64 overlap)
  → Local Embeddings (all-MiniLM-L6-v2 via ONNX runtime)
  → pgvector storage → Semantic search at query time
```

---

## Compliance Frameworks

| Framework | Version | Coverage |
|---|---|---|
| **ISO 27001:2022** | Annex A (93 controls) | Full — all 4 domains, 11 clauses |
| **SOC 2** | TSC 2017 + 2022 | CC1–CC9 + Availability, Confidentiality, Privacy |
| **FedRAMP** | Moderate baseline | NIST 800-53 Rev. 5 subset (325 controls) |
| **NIST 800-53** | Rev. 5 | All 20 control families |

### Document Types Generated

- Information Security Management System (ISMS) Manual
- Risk Assessment & Treatment Plans
- Statement of Applicability (SoA)
- System Security Plans (SSP)
- Policies (16 standard security policies)
- Procedures and Work Instructions
- Control Implementation Statements
- Evidence Collection Checklists

---

## Database & Storage

### Schema

The database schema (Drizzle ORM, shared between server and migrations) covers:

```
Core:           users, organizations, sessions, system_configurations
Documents:      documents, document_versions, document_approvals
Compliance:     company_profiles, gap_analyses, compliance_maturity
Risk:           risks
Evidence:       cloud_files, evidence_control_mappings
AI:             ai_sessions, ai_messages, ai_guardrails_logs,
                ai_usage_disclosures, model_cards
Agents:         agent_state_store, agent_message_inbox, agent_tool_logs
Identity:       stakeholders, role_assignments, roles
Repository:     repository_snapshots, repository_files,
                repository_findings, repository_tasks, repository_documents
Vendor GRC:     vendors, vendor_questionnaires, questionnaire_solvers
Personnel:      policy_acknowledgments
Integrations:   data_residency_policies, data_retention_policies
```

### Local Mode (PGlite)

In desktop mode, CyberDocGen uses **PGlite** — a full PostgreSQL engine compiled to WASM that runs in-process. This means:

- **Zero external dependencies** — no PostgreSQL server required
- **Full SQL compliance** — all Drizzle ORM queries work identically
- **Instant startup** — database ready in milliseconds
- **Portable** — database files stored in `local-data/`

### Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:push
```

Migrations live in [`server/migrations/pglite/`](server/migrations/pglite/) (PGlite) and [`drizzle/`](drizzle/) (PostgreSQL).

---

## Security Architecture

### Encryption

| Layer | Algorithm | Scope |
|---|---|---|
| Data at rest (sensitive fields) | AES-256-GCM | OAuth credentials, session data, LDAP bind passwords |
| Data at rest (standard fields) | AES-256-GCM | INTERNAL classification fields |
| Audit ledger integrity | HMAC-SHA256 | Every AI tool invocation log entry |
| Password hashing | bcrypt (rounds=12) | User password storage |
| PDF documents | AES-256 (pdf-lib) | Exported compliance documents |

### Audit Trail

Every security-relevant action produces an immutable audit log entry:

```typescript
{
  userId, action, resourceType, resourceId,
  ipAddress, riskLevel, timestamp,
  hmacSeal: HMAC-SHA256(payload, DATA_INTEGRITY_SECRET)
}
```

Agent tool executions (AI actions) are additionally logged to the `agent_tool_logs` table with their own HMAC seals.

### Access Control

- **RBAC** with three built-in roles: `admin`, `standard_user`, `auditor`
- Granular permissions per resource type (documents, compliance, users, ai, admin)
- Session risk scoring based on device fingerprint, IP, and behavioral signals
- Route-level middleware enforces role requirements

### Hardening Controls

- Rate limiting (configurable per endpoint group)
- CORS with allowlist
- Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- Input validation via Zod (all API routes)
- SQL injection prevention via Drizzle ORM parameterization
- Production egress control (prevents non-AI external HTTP calls)

---

## Repository Layout

```
cyberdocgen/
├── client/                    # React SPA
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── ui/            # shadcn/ui primitives
│       │   ├── ai/            # AI-specific widgets
│       │   ├── compliance/    # Framework components
│       │   └── layout/        # Shell and navigation
│       ├── contexts/          # React context providers
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Client utilities
│       └── pages/             # Route-level page components
│
├── server/                    # Express API server
│   ├── config/                # Runtime & deployment configuration
│   ├── middleware/            # Auth, security, rate limiting
│   ├── migrations/            # PGlite SQL migrations
│   ├── mcp/                   # Model Context Protocol server
│   ├── monitoring/            # OpenTelemetry, GCP logging
│   ├── providers/             # Auth providers (local, LDAP)
│   ├── repositories/          # Data access layer (factory DI pattern)
│   ├── routes/                # Express route handlers
│   ├── services/              # Business logic services
│   ├── utils/                 # Logger, encryption helpers
│   ├── db.ts                  # Database connection (PGlite / PostgreSQL)
│   ├── routes.ts              # Route registration
│   └── storage.ts             # IStorage interface + driver registration
│
├── shared/                    # Shared types (server + client)
│   ├── schema.ts              # Drizzle ORM table definitions
│   └── schema/                # Schema sub-modules
│
├── electron/                  # Desktop shell
│   ├── main.ts                # Electron main process
│   └── preload.ts             # Context bridge
│
├── tests/                     # Test suites
│   ├── unit/                  # Service-level unit tests
│   ├── integration/           # API integration tests
│   ├── components/            # React component tests
│   └── accessibility/         # axe-core a11y tests
│
├── scripts/                   # Build, validation, packaging
├── docs/                      # Extended documentation
├── .github/
│   └── workflows/             # CI/CD pipelines
│       ├── ci.yml             # Main CI pipeline (lint, test, build, security)
│       ├── docker-build.yml   # Docker image build & GHCR push
│       ├── npm-grunt.yml      # Node.js LTS smoke matrix
│       └── cloud-validation.yml  # Manual cloud sweep
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Local Docker Compose with PostgreSQL
├── electron-builder.yml       # Windows installer configuration
├── drizzle.config.ts          # Drizzle Kit configuration
├── vite.config.ts             # Vite build configuration
├── vitest.config.ts           # Vitest test configuration
├── playwright.config.ts       # Playwright E2E configuration
└── tsconfig.json              # TypeScript compiler configuration
```

---

## Development Workflow

### Setup

```bash
git clone https://github.com/kherrera6219/cyberdocgen.git
cd cyberdocgen
npm install
cp .env.example .env        # Configure AI keys + secrets
npm run db:push             # Initialize schema
npm run dev                 # Start dev server at :5000
```

### Code Quality

This repository enforces quality via Husky pre-commit hooks:

```bash
npm run lint     # ESLint with security plugin rules
npm run check    # TypeScript type check (strict mode)
```

### Testing

```bash
npm run test:run             # All unit + integration tests (single pass)
npm run test                 # Watch mode
npm run test:coverage        # Coverage report (≥80% threshold)
npm run test:a11y            # Accessibility tests (axe-core)
npm run test:e2e             # Playwright end-to-end tests
npm run test:e2e:headed      # Playwright with visible browser
```

### Storybook

```bash
npm run storybook            # Start Storybook at :6006
```

---

## Validation & Quality Gates

### CI Pipeline Jobs

| Job | Trigger | What it Validates |
|---|---|---|
| **Lint & Type Check** | push, PR | ESLint (security rules) + TypeScript strict |
| **Tests** | push, PR | Vitest unit + integration, coverage upload |
| **Security Scan** | push, PR | npm audit (critical) + CodeQL SAST |
| **Dependency Scan** | push, PR | SCA — high/critical CVE reporting |
| **License Scan** | push, PR | Copyleft license detection |
| **SBOM** | push, PR | CycloneDX software bill of materials |
| **Build** | push (after lint+test) | Vite + server bundle compiles cleanly |
| **Release Signing** | tag `v*` | Signed NSIS installer + Authenticode |
| **Docker Build** | push, PR | Multi-stage Docker image builds cleanly |
| **Node Smoke Matrix** | push, PR | Build passes on Node 20 and 22 |

### Local Validation Commands

```bash
# Core quality gates
npm run check                    # TypeScript type check
npm run lint                     # ESLint
npm run test:run                 # Vitest tests
npm run build                    # Production build

# Windows packaging validation
npm run windows:validate         # WACK / desktop policy check
npm run windows:validate:store   # Microsoft Store submission check
npm run windows:evidence:validate

# Cloud deployment validation
npm run cloud:validate           # Cloud deployment sweep
npm run cloud:validate:strict    # Strict mode with all env vars required
```

---

## Production Deployment

### Docker (Recommended for VM)

```bash
# docker-compose.yml includes PostgreSQL + the app
docker-compose -f docker-compose.prod.yml up -d
```

### Windows Desktop

```bash
# Build signed installer (requires code signing certificate)
npm run build:win:release

# Output: dist/packaging/CyberDocGen-Setup-x.x.x.exe
# Installer handles: shortcuts, registry, auto-update, data directory
```

### Kubernetes

Helm charts and manifests are in [`k8s/`](k8s/).

```bash
helm install cyberdocgen ./k8s/helm \
  --set image.tag=<version> \
  --set database.url=<postgresql-url> \
  --set secrets.sessionSecret=<secret>
```

### Environment Variables Reference

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for the complete reference. Key groups:

| Group | Variables |
|---|---|
| **Database** | `DATABASE_URL` |
| **Security** | `SESSION_SECRET`, `ENCRYPTION_KEY`, `DATA_INTEGRITY_SECRET` |
| **AI Providers** | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_KEY` |
| **Runtime** | `DEPLOYMENT_MODE`, `NODE_ENV`, `PORT` |
| **LDAP** | Configured via Admin UI → Local Settings → Active Directory |
| **Monitoring** | `SENTRY_DSN`, `GOOGLE_CLOUD_PROJECT` |

---

## Roadmap

CyberDocGen follows a 4-phase development plan. See [docs/GRC_PHASED_UPDATE_PLAN.md](docs/GRC_PHASED_UPDATE_PLAN.md) for full details.

| Phase | Status | Key Deliverables |
|---|---|---|
| **Phase 1: Personnel, Local Privacy, Identity Sync & Agent Foundations** | ✅ Complete | Personnel portal, policy acknowledgments, local DB, RBAC, agent state store, AI guardrails, MCP tools |
| **Phase 2: Risk Register, Live Controls, Local Network & AI Policy Sync** | ✅ Complete | Interactive risk register, compliance maturity tracking, local network settings (bind/TLS), AI policy sync, control approvals, auditor workspace |
| **Phase 3: AI Questionnaire Solver, Vendor GRC, LDAP & Autonomous PRs** | ✅ Complete | AI questionnaire solver (RAG), vendor inventory + risk scoring, LDAP/AD authentication, autonomous PR generation, agent tool audit ledger |
| **Phase 4: Vision Auditing, Gated Trust Centers & AI Auditor Twins** | ✅ Complete | Computer vision evidence extraction, gated public trust center, dynamic watermarking/encryption, AI auditor twin agents, compliance telemetry engine |

---

## Documentation Map

### Getting Started
- [docs/QUICK_START.md](docs/QUICK_START.md) — Fastest path to a working environment
- [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) — All environment variables and configuration
- [docs/WINDOWS_DESKTOP_GUIDE.md](docs/WINDOWS_DESKTOP_GUIDE.md) — Windows desktop install and local-mode guide

### Architecture & APIs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture and major subsystems
- [docs/DIAGRAMS.md](docs/DIAGRAMS.md) — Mermaid diagrams (system, AI flow, deployment, evidence)
- [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) — Full route inventory with auth requirements
- [docs/OPENAPI.md](docs/OPENAPI.md) — Swagger/OpenAPI generation

### Security & Operations
- [SECURITY.md](SECURITY.md) — Vulnerability reporting policy
- [docs/SECURITY.md](docs/SECURITY.md) — Application security architecture
- [docs/SECURITY_PRODUCTION_REVIEW.md](docs/SECURITY_PRODUCTION_REVIEW.md) — Production readiness review
- [docs/TESTING.md](docs/TESTING.md) — Test strategy and command map
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Cloud and desktop deployment paths

### Contribution & Governance
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution workflow and standards
- [CHANGELOG.md](CHANGELOG.md) — Release history
- [SUPPORT.md](SUPPORT.md) — Where to get help
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community standards
- [LICENSE](LICENSE) — PolyForm Noncommercial License 1.0.0

---

## Contributing

We welcome contributions from the security and compliance community. Before contributing, please read:

1. [CONTRIBUTING.md](CONTRIBUTING.md) — branching strategy, commit conventions, PR checklist
2. [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community standards
3. [SECURITY.md](SECURITY.md) — responsible disclosure for security issues

### Development Requirements

- Node.js 20 LTS
- At least one AI provider API key (OpenAI, Anthropic, or Google)
- Familiarity with TypeScript, React, Drizzle ORM, and Express

### Commit Convention

```
feat(scope): description     # New feature
fix(scope): description      # Bug fix
docs(scope): description     # Documentation
refactor(scope): description # Refactoring
test(scope): description     # Tests
ci(scope): description       # CI/CD changes
chore(scope): description    # Tooling / dependencies
```

---

## Security and Support

| Issue Type | Contact |
|---|---|
| **Security vulnerability** | See [SECURITY.md](SECURITY.md) — do not open public issues |
| **Bug report / feature request** | [GitHub Issues](https://github.com/kherrera6219/cyberdocgen/issues) |
| **General questions** | See [SUPPORT.md](SUPPORT.md) |

---

## License

CyberDocGen is licensed under the **[PolyForm Noncommercial License 1.0.0](LICENSE)**.

You may use, modify, and distribute this software for non-commercial purposes. Commercial use requires a separate license. Contact the author for commercial licensing inquiries.

---

<div align="center">

Built with ❤️ for the security and compliance community

**[Documentation](docs/)** · **[Changelog](CHANGELOG.md)** · **[Security Policy](SECURITY.md)** · **[License](LICENSE)**

</div>
