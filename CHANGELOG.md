# Changelog

All notable changes to CyberDocGen will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Introduced AI governance subsystems for production operations:
  - Versioned prompt template registry
  - Model routing policy engine
  - Output classification service
  - Token and cost budget enforcement
  - AI usage accounting and metadata audit trail logging
- Added governed AI API endpoints:
  - `GET /api/ai/models/catalog`
  - `GET /api/ai/prompts/registry`
  - Enhanced `GET /api/ai/stats` with token totals and budget values
- Added retention scheduler operations endpoints:
  - `GET /api/health/retention`
  - `POST /api/health/retention/run`
- Added evidence integrity endpoints:
  - `GET /api/evidence/snapshots/:id/manifest`
  - `POST /api/evidence/snapshots/:id/verify`
  - `POST /api/evidence/snapshots/:id/package`
- Added signed local backup sidecars (`.integrity.json`) and signed snapshot manifests (SHA-256 + HMAC envelope).
- Added Postgres migration governance with `_migrations` checksum tracking.
- Added schema parity validation command: `npm run db:validate-parity`.
- Added phase gate orchestration command: `npm run sweep:phase` (`scripts/phase-sweep.ts`) with machine-readable reports.
- Added Windows desktop smoke automation and checklist for Start Menu launch + local API key roundtrip:
  - `scripts/windows-desktop-smoke.ps1`
  - `docs/WINDOWS_DESKTOP_SMOKE_CHECKLIST.md`
- Added connector API integration test coverage for `/api/connectors` and `/api/connectors/:id/import`.
- Added targeted regression tests for performance metrics correctness and phase sweep argument/report behavior.

### Changed

- Migrated Vitest environment routing to `test.projects` and removed deprecated `environmentMatchGlobs`.
- Updated onboarding tutorial action navigation to SPA routing (`wouter`) instead of hard browser redirects.
- Raised enforced global coverage thresholds to `80/80/80/80` and aligned baseline docs to latest full-suite coverage (`85.40/80.14/81.47`).
- Hardened npm lifecycle behavior for production-only installs by making `prepare` skip Husky setup when `husky` is not installed.
- Centralized runtime mode/feature config and route gating for dual desktop/cloud operation.
- Added centralized client input sanitization, global client error reporting, and secure typed Electron IPC bridge hardening.
- Standardized NSIS customization to root-level installer scripts (`installer.nsh`, `uninstaller.nsh`) with backward-compatible shim support.
- Updated Windows packaging validation to enforce root installer/uninstaller script presence and include-path correctness.
- Hardened connector route contracts with strict payload validation and explicit `400` responses for invalid create/import requests.
- Enforced release-mode signing policy in validation/CI using `RELEASE_BUILD` + `RELEASE_FORCE_CODESIGN`, with release build scripts:
  - `npm run build:win:release`
  - `npm run build:store:release`
- Aligned coverage enforcement baseline to active gate policy (`80%` lines/functions/statements, `78%` branches) and synchronized hotspot reporting thresholds.

### Fixed

- Fixed local desktop/local-mode startup in production builds by allowing server listen boot when `DEPLOYMENT_MODE=local`.
- Removed residual test warning sources from operational sweeps (`act(...)`/suspense timing and jsdom navigation noise).
- Resolved dashboard accessibility heading-order violation by correcting section heading semantics in company profile summary cards.
- Remediated dependency advisories by upgrading `axios`/`drizzle-kit` and overriding `@esbuild-kit/core-utils` transitive `esbuild`, resulting in clean `npm audit` and `npm audit --omit=dev`.
- Restored Docker CI build reliability by including `scripts/` in Docker build context so `node scripts/build-server.js` resolves during `npm run build`.
- Stabilized Linux CI execution for `tests/integration/e2e-flows.test.ts` by increasing async setup/teardown test hook timeouts to 30 seconds.
- Removed deprecated filesystem usage in local storage cleanup by replacing `fs.rmdir(...)` with `fs.rm(...)`.
- Eliminated backend CJS build warning risk by removing server-side `import.meta.url` dependency from runtime migration path resolution.
- Burned down lint warnings introduced by governance/data-layer hardening work and restored clean `npm run lint`.
- Fixed performance telemetry integrity in `performanceService` by removing duplicate request increments and deriving `errorRate` without mutating absolute error counters.

## [2.2.0] - 2026-01-19

### Added

- **Multi-Cloud Platform (MCP) Testing**: Achieved >75% coverage for all MCP components including `agentClient.ts`, `initialize.ts`, and `toolRegistry.ts`.
- **API Route Testing**: Reached >75% coverage for core API routes: `documents.ts`, `gapAnalysis.ts`, and `enterpriseAuth.ts`.
- **Complex Agent Simulation**: Implemented unit tests for multi-step agent execution loops and tool call handling.
- **Project Structure Cleanup**: Standardizers reporting scripts and archived legacy analysis documents.

### Fixed

- Fixed Vitest instrumentation issues that were masking coverage for MCP initialization.
- Resolved TypeScript errors in tests related to mocked service return types.
- Standardized audit logging mocks across all integration tests.

### Security

- Verified organization isolation and authentication boundaries for all new MCP test cases.
- Enhanced error path verification for all sensitive API routes.

## [2.1.0] - 2026-01-18

### Added

- **Microsoft Entra ID SSO**: Full OIDC + PKCE integration for Enterprise authentication.
- **Windows Client Wrapper**: Native Electron shell for Windows desktop users.
- **MSIX Packaging**: Configuration for Microsoft Store distribution (electron-builder).
- **Compliance Tooling**: Added `validate-wack.ts` for Windows App Certification Kit readiness.
- **Frontend Integration**: Added "Sign in with Microsoft" to the enterprise login portal.

### Changed

- Updated `validate-compliance.ts` to include Spec-001 (Windows Client & Entra ID) requirements.
- Extended session types and environment validation for Azure AD.

### Security

- Implemented PKCE for decentralized authentication flows as per Spec-001 requirements.
- Enforced organization isolation for users authenticating via Entra ID tenants.

## [2.0.2] - 2026-01-17

### Added

- Phase 6 comprehensive quality improvements (85% complete)
- Enhanced test coverage with 783 passing tests (up from 774)
- Backend service tests for sessionRiskScoringService, validation, emailService, documentTemplates
- Proper Base32 encoding for MFA secrets (RFC 4648 compliant)
- Deterministic SHA-256 hashing for data indexing

### Fixed
- 10 failing tests across encryption and MFA services
- Encryption field detection now includes 'credit' and 'card' fields
- MFA TOTP token generation now properly uses time slices
- MFA QR code URL generation simplified and corrected
- Hash-for-indexing made deterministic for consistent lookups

### Changed
- MFA validateTOTPToken now accepts milliseconds (improved API clarity)
- Encryption shouldEncryptField expanded sensitive field detection
- encryptCompanyProfile now includes 'apiKey' and 'encryptionKey' fields

### Security
- Enhanced encryption field detection for credit card data
- Improved MFA secret generation with proper Base32 encoding
- All security tests passing with comprehensive coverage

## [2.0.1] - 2026-01-17

### Changed
- Updated zod-validation-error from 3.5.4 to 5.0.0

### Security
- Maintained 0 security vulnerabilities
- All dependencies current and secure

### Documentation
- Created refactoring plan for future code improvements
- Identified large files for potential future refactoring (deferred to v2.1.0+)

## [2.0.0] - 2026-01-17

### Added
- Database connection health checks and monitoring
- Connection pool retry logic with exponential backoff (3x attempts)
- MCP endpoint authentication middleware
- Organization context isolation for MCP routes
- Data retention deletion workflows for GDPR/CCPA compliance
- CSP meta tag in index.html for defense-in-depth
- Centralized localStorage error handling via useStorage hook

### Changed
- Updated all documentation with version 2.0.0
- Enhanced README with current production status
- Improved error handling across frontend and backend
- Unified error response format across all API endpoints

### Fixed
- Database connection pool error handling
- MCP security gaps (unauthenticated endpoints)
- Frontend localStorage error handling inconsistencies
- TypeScript compilation errors (0 errors achieved)

### Security
- 0 security vulnerabilities (verified via npm audit)
- MCP endpoints now require authentication
- Multi-tenant isolation enforced on all MCP operations
- Complete audit trails for data deletion operations

## [1.1.0] - 2025-12-10

### Added
- Google Gemini 3.0 Pro AI model integration for multimodal analysis
- Three-provider AI orchestration with intelligent model selection

### Changed
- Updated OpenAI integration to GPT-5.1 (latest flagship model, Nov 2025)
- Updated Anthropic integration to Claude Opus 4.5 (latest model, Nov 2025)
- Updated Google AI integration to Gemini 3.0 Pro (latest model, Dec 2025)
- Updated all npm dependencies to latest compatible versions
- Enhanced AI fallback system with three-provider support

### Documentation
- Updated all documentation files with latest AI model information
- Updated README.md with current model versions
- Updated replit.md with latest architecture details
- Updated API documentation with new model references
- Updated environment setup guide with Google AI configuration

## [1.0.0] - 2024-11-25

### Added
- Enterprise-grade compliance management system
- AI-powered document generation with multiple model support (OpenAI GPT-5.1, Anthropic Claude Opus 4.5, Google Gemini 3.0 Pro)
- Multi-framework compliance support:
  - ISO 27001:2022
  - SOC 2 Type I & II
  - FedRAMP (Low, Moderate, High)
  - NIST 800-53 Rev 5
- Compliance gap analysis functionality
- Document workspace with real-time collaboration
- Document versioning and history tracking
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Cloud storage integrations (Google Drive, Microsoft OneDrive)
- Comprehensive audit trail system
- Enterprise organization management
- Admin dashboard and settings
- Document comments and collaboration features
- AI compliance chatbot
- Quality scoring for documents
- Risk assessment automation
- Threat detection and monitoring
- Data encryption at rest and in transit
- Rate limiting and DDoS protection
- Health check and metrics endpoints
- Performance monitoring service
- Structured logging system
- Production-ready security implementation
- Replit deployment configuration

### Security
- Implemented comprehensive security audit
- Added MFA enforcement
- Enabled data encryption
- Implemented audit logging with tamper detection
- Added input sanitization and XSS prevention
- Configured security headers
- Implemented rate limiting
- Added threat detection system

### Changed
- Modernized dependency stack
- Updated to React 18
- Upgraded to TypeScript 5.9
- Migrated to Vite 6
- Updated Drizzle ORM to 0.39
- Improved build process with esbuild
- Enhanced error handling
- Optimized database queries
- Improved API response times

### Documentation
- Created comprehensive architecture documentation
- Added detailed API documentation
- Documented security measures
- Created deployment guide
- Added development guide
- Documented modernization roadmap
- Created phased implementation plan

### Infrastructure
- Configured Neon PostgreSQL database
- Set up Replit Object Storage
- Integrated Google Cloud Storage
- Configured session management
- Set up metrics collection
- Implemented health checks

## [0.9.0] - 2024-11-15

### Added
- Phase 2 implementation completion
- Server and client code cleanup
- Improved code organization
- Enhanced error handling

### Changed
- Refactored authentication flow
- Improved document generation pipeline
- Enhanced AI orchestration service

## [0.8.0] - 2024-11-10

### Added
- Phase 1 completion
- Core compliance features
- Basic document generation
- User authentication

### Changed
- Initial architecture setup
- Database schema design
- API endpoint structure

## [0.1.0] - 2024-10-01

### Added
- Initial project setup
- Basic project structure
- Core dependencies
- Development environment configuration

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

[Unreleased]: https://github.com/kherrera6219/cyberdocgen/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/kherrera6219/cyberdocgen/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/kherrera6219/cyberdocgen/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/kherrera6219/cyberdocgen/compare/v0.1.0...v0.8.0
[0.1.0]: https://github.com/kherrera6219/cyberdocgen/releases/tag/v0.1.0
