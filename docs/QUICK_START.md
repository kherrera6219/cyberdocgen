# CyberDocGen Quick-Start Guide

Get CyberDocGen running locally in under 5 minutes.

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| Docker | 24.x (optional, for local Postgres) |

---

## 1. Clone and Install

```bash
git clone https://github.com/kherrera6219/cyberdocgen.git
cd cyberdocgen
npm install
```

---

## 2. Configure Environment

Copy the example environment file and fill in required values:

```bash
cp .env.example .env
```

Minimum required variables for local development:

```dotenv
# Database (SQLite used automatically if DATABASE_URL is unset)
DATABASE_URL=           # Leave blank to use local SQLite

# Session
SESSION_SECRET=your-random-32-char-secret-here

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here
DATA_INTEGRITY_SECRET=your-random-secret-here

# AI Providers (at least one required for document generation)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_KEY=AIza...
# Optional fallback alias if you already use the legacy variable name
GEMINI_API_KEY=AIza...
```

Generate random secrets quickly:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Run Database Migrations

```bash
npm run db:push
```

---

## 4. Start Development Server

```bash
npm run dev
```

The application starts at **http://localhost:5000**.

- Frontend: http://localhost:5000
- API: http://localhost:5000/api
- API Docs (Swagger UI): http://localhost:5000/api-docs (only when `ENABLE_SWAGGER=true`)
- Health check: http://localhost:5000/health

---

## 5. Create Your First Account

1. Open http://localhost:5000/enterprise-signup
2. Enter your name, email, and a strong password
3. Create an organization when prompted
4. You're in — the dashboard loads at http://localhost:5000/dashboard

---

## 6. Generate Your First Document

1. **Company Profile** → Fill in your organization details at `/profile`
2. **Choose a Framework** → Navigate to a compliance framework (e.g., SOC 2, ISO 27001)
3. **Generate** → Click "Generate Document" and select a document type
4. **Download** → Export as PDF or DOCX from the Documents page

---

## Running with Docker (Alternative)

```bash
# Start Postgres + app together
docker compose up --build

# Or use the production compose for a hardened setup
# (requires DATABASE_URL, POSTGRES_USER, POSTGRES_PASSWORD env vars)
docker compose -f docker-compose.prod.yml up
```

---

## Running Tests

```bash
# Unit + integration tests (Vitest)
npm run test:run

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 already in use | `PORT=5001 npm run dev` |
| SQLite WAL lock errors | Delete `local.db-shm` and `local.db-wal` |
| AI calls return 401 | Verify API keys in `.env` |
| CSRF errors on login | Clear browser cookies and retry |
| Build fails with TS errors | Run `npm run check` to see specific errors |

For more detail, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) and [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).
