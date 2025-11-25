# CyberDocGen

CyberDocGen is an Express + React TypeScript application for AI-assisted compliance documentation. The repository includes a secured API layer with AI orchestration and a Vite-powered client served through the same Node.js process.

## Repository layout
- `server/` – Express server, security middleware, AI orchestration, and API routes
- `client/` – React application and UI composition
- `shared/` – Zod schemas and types shared by client and server
- `tests/` – Vitest-based unit and integration coverage
- `scripts/` – Operational utilities for production validation and encryption checks
- `docs/` – Project documentation

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL database URL for Drizzle ORM
- API keys for the AI providers you want to exercise (OpenAI and Anthropic are required by default)

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (see `docs/CONFIGURATION.md` for details) and create a `.env` file in the repository root.
3. Start the development server (serves API + client on the same port):
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:5000`.

## Useful scripts
- `npm run dev` – Start the Express server with Vite middleware for local development
- `npm run build` – Build the client and bundle the server for production
- `npm start` – Run the bundled server from `dist/`
- `npm run check` – Type-check the project
- `npm run db:push` – Apply Drizzle schema changes to the configured PostgreSQL database

## Development notes
- Health endpoints are available at `/health`, `/ready`, and `/live`.
- AI service diagnostics live under `/api/ai/health` and `/api/test/*` routes.
- Security middleware enforces request validation, rate limiting, sanitization, and MFA gates for high-risk flows.

## Documentation
Additional documentation lives in the `docs/` directory:
- `docs/CONFIGURATION.md` – Environment variables and operational configuration
- `docs/API.md` – HTTP API reference
- `docs/ARCHITECTURE.md` – System architecture overview
- `docs/SECURITY.md` – Security posture and controls
- `docs/DEPLOYMENT.md` – Deployment considerations
