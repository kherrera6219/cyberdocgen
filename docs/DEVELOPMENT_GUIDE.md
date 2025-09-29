
# Enterprise Compliance System - Development Guide

## Overview
Prototype compliance management application that demonstrates AI-assisted document workflows.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM  
- **AI Services**: OpenAI, Anthropic, Google AI
- **Security**: Multi-layer protection, MFA, encryption
- **Monitoring**: Health checks, metrics, audit trails

## Quick Start
```bash
npm run dev  # Development server
npm run build  # Production build
npm start  # Production server
```

## Key Features
- 🧪 Document analysis and generation prototypes (templated content)
- 🧪 Compliance gap analysis dashboards backed by mock data
- 🧪 Risk assessment automation using sample AI prompts
- ⚠️ Multi-factor authentication scaffolding without real token validation
- ⚠️ Cloud integrations pending OAuth configuration
- ⚠️ Audit logging limited to development storage
- ⚠️ No formal SOC 2 readiness work has been completed

## Production Ready
This system has **not** undergone a formal security review and should be treated as a prototype until the gaps documented in `docs/GAP_ANALYSIS.md` are addressed.

For detailed documentation, see the `development-archive/` directory.
