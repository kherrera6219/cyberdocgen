# CyberDocGen Architecture Documentation

## System Overview

CyberDocGen is an enterprise-grade compliance management platform that leverages multiple AI models to automate compliance workflows. The system is built with modern web technologies and designed for scalability, security, and performance. It supports ISO 27001:2022, SOC 2, FedRAMP, and NIST 800-53 Rev 5 frameworks with comprehensive document generation, gap analysis, and risk assessment capabilities.

**Version 3.0.0** introduces dual-mode deployment architecture, allowing CyberDocGen to operate in both cloud-hosted and standalone desktop configurations with shared codebase and seamless switching between deployment modes.

## Deployment Modes

CyberDocGen implements a **dual-mode architecture** that supports two distinct deployment modes from a single codebase:

### Cloud Mode (Default)
**Target Audience**: Teams, enterprises, and organizations requiring collaboration

**Infrastructure**:
- **Database**: PostgreSQL 16 (Neon serverless)
- **Storage**: Google Cloud Storage via Replit Object Storage
- **Authentication**: Microsoft Entra ID (Azure AD) with OIDC + PKCE
- **Secrets**: Environment variables (Replit Secrets)
- **Deployment**: Cloud platforms (Replit, AWS, GCP, Azure)

**Features**:
- Multi-tenancy with organization isolation
- Real-time collaboration
- Centralized data management
- Scalable infrastructure
- Team workflows and approval processes

### Local Mode (Desktop)
**Target Audience**: Individual users, contractors, offline compliance work

**Infrastructure**:
- **Database**: SQLite 3 with WAL mode (`better-sqlite3`)
- **Storage**: Local filesystem (content-addressable)
- **Authentication**: Local user accounts (no enterprise SSO)
- **Secrets**: Windows Credential Manager (`keytar`)
- **Deployment**: Windows 11 desktop application (Electron)

**Features**:
- True offline operation (no internet after setup)
- Data sovereignty (all data local)
- Windows Credential Manager for API keys
- Native desktop integration (menus, tray, shortcuts)
- Auto-updates when online
- Database backup/restore
- Microsoft Store ready

### Provider Abstraction Layer

The dual-mode architecture is implemented via a **provider pattern** that abstracts infrastructure dependencies:

```typescript
// server/providers/interfaces.ts
interface IDbProvider {
  // Database operations (PostgreSQL or SQLite)
}

interface IStorageProvider {
  // File storage (GCS or LocalFs)
}

interface IAuthProvider {
  // Authentication (Passport or Local)
}

interface ISecretsProvider {
  // Secrets management (EnvVars or WindowsCredMan)
}
```

**Provider Implementations**:

| Component | Cloud Mode | Local Mode |
|-----------|-----------|-----------|
| Database | `PostgresDbProvider` | `SqliteDbProvider` |
| Storage | `GcsStorageProvider` | `LocalFsStorageProvider` |
| Auth | `PassportAuthProvider` | `LocalAuthProvider` |
| Secrets | `EnvVarsSecretsProvider` | `WindowsCredentialManagerProvider` |

**Runtime Configuration** (`server/config/runtime.ts`):
- Mode detection via `DEPLOYMENT_MODE` environment variable
- Feature flags for mode-specific capabilities
- Provider selection based on mode
- Graceful fallbacks and error handling

**Benefits**:
- Single codebase for both modes
- Easy switching between modes
- Testable abstractions
- Clear separation of concerns
- Future-proof for additional modes (e.g., MacOS, Linux)

## Architecture Components

### Frontend Architecture
- **Framework**: React 18.3 with TypeScript 5.9
- **Build Tool**: Vite 6.4 for fast development and optimized production builds
- **UI Library**: Radix UI primitives (51+ components) with shadcn/ui components
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **State Management**: TanStack React Query for server state, React Hook Form + Zod for forms
- **Routing**: Wouter for lightweight client-side routing
- **Pages**: 41 fully implemented page components
- **Components**: 93+ organized, reusable UI components
- **Custom Hooks**: 6 specialized React hooks
- **Performance**: 86% bundle size reduction with code splitting (40+ lazy-loaded routes)

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js 4.21 framework
- **Language**: TypeScript 5.9 for type safety
- **Database**: Dual-mode with provider abstraction
  - **Cloud Mode**: PostgreSQL 16 with Drizzle ORM 0.39 (Neon serverless)
    - Connection pool with error handling and retry logic (3x exponential backoff)
    - Health checks and connection testing on startup
    - Query timeout configuration (10s connection, 30s idle)
  - **Local Mode**: SQLite 3 with better-sqlite3
    - WAL (Write-Ahead Logging) mode for concurrency
    - Automatic backup/restore capabilities
    - Database maintenance operations (vacuum, analyze, integrity check)
  - Graceful shutdown with proper cleanup for both modes
- **Storage**: Provider-based abstraction
  - **Cloud Mode**: Google Cloud Storage via Replit Object Storage
  - **Local Mode**: Local filesystem with content-addressable storage
- **Secrets Management**: Mode-specific providers
  - **Cloud Mode**: Environment variables (Replit Secrets)
  - **Local Mode**: Windows Credential Manager (keytar)
- **Authentication**: Enterprise authentication with MFA support (Cloud) or local accounts (Local)
- **AI Integration**: Multi-model orchestration (OpenAI GPT-5.1, Anthropic Claude Opus 4.5, Google Gemini 3.0 Pro)
- **Route Modules**: 28 organized API route modules (including `localMode.ts`)
- **Business Services**: 42 specialized service modules
- **Middleware Stack**: 10-layer security and monitoring middleware
- **Provider System**: 4 provider interfaces with dual implementations for deployment flexibility

### Database Design

**Cloud Mode (PostgreSQL)**:
- **Primary Database**: PostgreSQL 16 (Neon serverless)
- **ORM**: Drizzle ORM 0.39 with type-safe queries
- **Connection Pool**: Configured with max 20 connections, automatic retry on failure
- **Resilience**: Health checks, connection testing, graceful degradation
- **Schema**: Multi-tenant with organization-based data isolation (40+ tables, 1,670+ lines)
- **Migrations**: Automated through Drizzle Kit
- **Audit Trail**: Comprehensive activity logging with integrity verification
- **Indexes**: 40+ optimized indexes for performance
- **Data Models**: Complete coverage for users, organizations, documents, compliance, AI, security
- **Data Retention**: Automated GDPR/CCPA-compliant deletion with policy-driven retention periods

**Local Mode (SQLite)**:
- **Database**: SQLite 3 with better-sqlite3 driver
- **ORM**: Drizzle ORM 0.39 (same schema, SQLite dialect)
- **WAL Mode**: Write-Ahead Logging for concurrent reads/writes
- **Location**: `%APPDATA%/CyberDocGen/cyberdocgen.db` (Windows user data directory)
- **Features**:
  - Single-user optimized (no multi-tenancy overhead)
  - Backup to user-specified location
  - Restore from backup files
  - Maintenance operations (VACUUM, ANALYZE, integrity check)
  - Database statistics (size, page count, WAL status)
- **Performance**: Optimized for desktop workloads with local I/O
- **Schema**: Same schema as PostgreSQL (40+ tables) with SQLite-specific adjustments
- **Indexes**: Identical index structure for query performance
- **Data Models**: Full parity with cloud mode

## AI Services Architecture

### Multi-Model Orchestration
The system implements intelligent model selection based on task requirements with automatic fallback:

- **OpenAI GPT-5.1**: Document generation, content analysis (latest flagship model, Nov 2025)
- **Anthropic Claude Opus 4.5**: Complex reasoning, risk assessment (latest reasoning model, Nov 2025)
- **Google Gemini 3.0 Pro**: Multimodal analysis, compliance review (latest multimodal model, Dec 2025)
- **Automatic Fallback**: Graceful degradation when models are unavailable with health checking
- **Load Balancing**: Intelligent distribution across available models

### AI Guardrails System
- **Prompt Injection Detection**: Prevents malicious prompt manipulation
- **PII Redaction**: Automatic detection and removal of sensitive personal information
- **Output Moderation**: Content safety checks on AI-generated output
- **Rate Limiting**: Per-user and per-organization AI usage limits
- **Compliance Validation**: Ensures generated content meets regulatory requirements

### AI Service Endpoints
- `/api/ai/health` - Model availability status and health checks
- `/api/ai/models` - List available AI models and their capabilities
- `/api/ai/generate-compliance-docs` - Generate compliance documents for frameworks
- `/api/ai/generate-insights` - Compliance insights generation
- `/api/ai/analyze-document` - Detailed document content analysis
- `/api/ai/analyze-quality` - Document quality scoring with recommendations
- `/api/ai/chat` - Interactive compliance chatbot assistance
- `/api/ai/risk-assessment` - Automated organizational risk assessment

### Local Mode API Endpoints

Local Mode introduces dedicated endpoints for desktop application features (`server/routes/localMode.ts`):

**Runtime Information**:
- `GET /api/local/runtime/mode` - Get current deployment mode and feature flags
  ```json
  {
    "mode": "local",
    "features": {
      "multiTenancy": false,
      "enterpriseSSO": false,
      "localMode": true
    },
    "database": { "type": "sqlite" },
    "storage": { "type": "localfs" },
    "auth": { "enabled": false }
  }
  ```

**Database Management**:
- `GET /api/local/db-info` - Database statistics and information
  - Path, size, page count, WAL mode status
- `POST /api/local/backup` - Create database backup
  - Body: `{ "destinationPath": "C:/path/to/backup.db" }`
- `POST /api/local/restore` - Restore from backup
  - Body: `{ "backupPath": "C:/path/to/backup.db" }`
- `POST /api/local/maintenance` - Run database maintenance
  - Executes VACUUM, ANALYZE, integrity check

**Storage Management**:
- `GET /api/local/storage-info` - Storage statistics
  - Path, total size, file count
- `POST /api/local/cleanup` - Cleanup empty directories
  - Returns count of removed directories

**API Key Management**:
- `GET /api/local/api-keys/configured` - List configured providers
  - Returns: `{ "configured": ["OPENAI", "ANTHROPIC"] }`
- `POST /api/local/api-keys/test` - Test API key validity
  - Body: `{ "provider": "OPENAI", "apiKey": "sk-..." }`
  - Returns: `{ "valid": true|false }`
- `POST /api/local/api-keys/:provider` - Save API key
  - Stores in Windows Credential Manager
- `DELETE /api/local/api-keys/:provider` - Remove API key

**Security Enforcement**:
All local mode endpoints enforce `isLocalMode()` check:
```typescript
if (!isLocalMode()) {
  return res.status(403).json({
    error: 'This endpoint is only available in local mode'
  });
}
```

## Security Architecture

### Authentication & Authorization
- **Primary Auth**: Replit OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **Authorization**: Role-based access control (RBAC)
- **Multi-tenancy**: Organization-scoped data access

### Security Middleware Stack
1. **Security Headers**: CORS, CSP, XSS protection, HSTS, frame options
2. **Cookie Parser**: Secure cookie handling
3. **CSRF Protection**: Session-bound CSRF tokens
4. **Threat Detection**: Real-time threat pattern detection and logging
5. **Audit Logger**: Immutable audit trail for all operations
6. **Route Access Validation**: Route-level access control
7. **Performance Logging**: Request/response time tracking
8. **Rate Limiting**: Tiered limits (1000 requests per 15 min general, 10/hour for AI)
9. **MFA Enforcement**: Multi-factor authentication for high-risk operations
10. **Request Validation**: Comprehensive Zod schema validation

### Threat Detection System
- **Pattern Detection**: SQL injection, XSS, path traversal, command injection attempts
- **Suspicious IP Tracking**: Automated blocking and alerting
- **Rate Limit Violations**: Tracked and logged with escalating penalties
- **Security Event Logging**: All threats logged with full context
- **Alert Integration**: Real-time alerting for security incidents

### Data Protection
- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Rotation**: Automated encryption key rotation service
- **Access Control**: Granular RBAC permissions per resource
- **Audit Logging**: Complete activity tracking with tamper detection and integrity verification
- **Data Isolation**: Organization-based data segregation with multi-tenant security

### Secrets Management

**Cloud Mode** (`EnvVarsSecretsProvider`):
- Environment variables for API keys and secrets
- Managed via Replit Secrets or cloud provider secret managers
- Accessed through `process.env`

**Local Mode** (`WindowsCredentialManagerProvider`):
- **Storage**: Windows Credential Manager (OS-level encryption)
- **Library**: `keytar` native module for secure credential access
- **Service Name**: `CyberDocGen`
- **Encryption**: Keys encrypted with user's Windows login credentials
- **Isolation**: Inaccessible to other Windows users on same machine
- **Persistence**: Survives app reinstalls (tied to Windows user profile)
- **Management**: Viewable in Control Panel → Credential Manager → Windows Credentials

**Supported API Keys**:
```typescript
export const LLM_API_KEYS = {
  OPENAI: 'openai-api-key',
  ANTHROPIC: 'anthropic-api-key',
  GOOGLE_AI: 'google-ai-api-key',
} as const;
```

**Provider Interface**:
```typescript
interface ISecretsProvider {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
  hasKey(key: string): Promise<boolean>;
  getConfiguredProviders(): Promise<string[]>;
}
```

**Fallback Behavior**:
- Local Mode attempts Windows Credential Manager first
- Falls back to environment variables if keytar unavailable
- Graceful error handling for non-Windows platforms

## Performance & Monitoring

### Metrics Collection
- **Request Metrics**: Response times, status codes, endpoint usage
- **AI Metrics**: Generation counts, error rates, model performance
- **Database Metrics**: Query performance, error tracking
- **Security Metrics**: Authentication attempts, rate limit hits

### Performance Optimizations
- **Database**: Indexed queries, connection pooling
- **Caching**: Strategic caching for static content and AI responses
- **Compression**: Gzip compression for API responses
- **Bundle Optimization**: Code splitting and tree shaking

## Deployment Architecture

### Cloud Mode Deployment

**Environment Configuration**:
- **Development**: Local development with hot reloading
- **Production**: Replit Deployments with automatic scaling
- **Database**: Neon serverless PostgreSQL
- **Storage**: Google Cloud Storage via Replit Object Storage

**CI/CD Pipeline**:
- **Build**: TypeScript compilation and bundling
- **Testing**: Unit tests, integration tests, type checking
- **Deployment**: Automated deployment via Replit
- **Monitoring**: Real-time health checks and metrics

### Local Mode Desktop Architecture

**Application Structure** (`electron/`):

```text
electron/
├── main.ts              # Main process (503 lines)
│   ├── Window management with state persistence
│   ├── Native menus (File, Edit, View, Database, Help)
│   ├── System tray integration
│   ├── Security hardening (CSP, IPC validation)
│   ├── Auto-updater integration
│   └── Environment variable configuration
├── preload.ts           # Preload script for secure IPC
└── electron-builder.yml # MSIX packaging configuration
```

**Main Process** (`electron/main.ts`):

**Security Features**:
- **Content Security Policy (CSP)**: Strict CSP headers for renderer process
  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' http://127.0.0.1:5231;
  ```
- **IPC Validation**: Path traversal prevention for all file operations
  ```typescript
  function isPathSafe(requestedPath: string): boolean {
    const resolved = path.resolve(requestedPath);
    const allowed = path.resolve(app.getPath('userData'));
    return resolved.startsWith(allowed);
  }
  ```
- **Localhost Binding**: Strict enforcement of 127.0.0.1 only in local mode
- **Navigation Prevention**: Blocks navigation away from localhost
- **External Link Handling**: Opens external links in system browser

**Desktop Integration**:
- **Window State Persistence**: Saves/restores position, size, and maximized state
  - Stored in `%APPDATA%/CyberDocGen/window-state.json`
  - Restored on application restart
- **Native Menus**:
  - File menu: New Document (Ctrl+N), Settings (Ctrl+,), Exit (Alt+F4)
  - Edit menu: Standard clipboard operations
  - View menu: Reload, DevTools, Zoom, Fullscreen
  - Database menu: Backup, Restore, Database Info
  - Help menu: Documentation, Report Issue, About
- **System Tray**:
  - Quick access to open/hide window
  - Context menu with Quit option
  - Click to toggle window visibility
- **Keyboard Shortcuts**: Native keyboard shortcut support throughout

**Auto-Update System** (`electron-updater`):
- **Update Checks**: On startup (after 5s) and every 4 hours
- **Auto-Download**: Updates download automatically in background
- **User Notification**: Dialog prompts for restart when update ready
- **Install on Quit**: Updates install automatically on app quit
- **Progress Tracking**: Download progress sent to renderer
- **Error Handling**: Graceful error handling with user notification

**IPC Handlers**:
```typescript
// Secure file operations with path validation
ipcMain.handle('read-file', async (event, filePath) => {
  if (!isPathSafe(filePath)) throw new Error('Invalid path');
  return fs.promises.readFile(filePath, 'utf8');
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  if (!isPathSafe(filePath)) throw new Error('Invalid path');
  return fs.promises.writeFile(filePath, data, 'utf8');
});

ipcMain.handle('get-app-info', () => ({
  version: app.getVersion(),
  userDataPath: app.getPath('userData'),
  platform: process.platform
}));
```

**Packaging & Distribution** (`electron-builder`):
- **MSIX Package**: Windows 11 compliant installer
- **Publisher**: CN=CyberDocGen
- **App ID**: com.cyberdocgen.app
- **Auto-Update URL**: Configured for release distribution
- **Microsoft Store Ready**: Passes Windows App Certification Kit (WACK)
- **Artifacts**:
  - `CyberDocGen-Setup-3.0.0.exe` - NSIS installer
  - `CyberDocGen-3.0.0.msix` - Microsoft Store package
  - `latest.yml` - Auto-updater metadata

**Environment Configuration**:
```typescript
// Set before backend server starts
process.env.DEPLOYMENT_MODE = 'local';
process.env.LOCAL_DATA_PATH = app.getPath('userData');
process.env.LOCAL_PORT = '5231';
```

**Application Lifecycle**:
1. **Startup**: Set environment variables, initialize main window
2. **Ready**: Create window, menu, tray, setup IPC, check for updates
3. **Window Management**: Save state on close, restore on reopen
4. **Updates**: Check periodically, download, notify, install on quit
5. **Shutdown**: Graceful cleanup, save window state, close database connections

## Data Flow Architecture

### Request Processing
1. **Client Request** → Authentication middleware → Authorization check
2. **Route Handler** → Input validation → Business logic
3. **Storage Layer** → Database operations with audit logging
4. **Response** → Data serialization → Client delivery

### AI Processing Flow
1. **AI Request** → Model selection → Context preparation
2. **AI Processing** → Response validation → Quality assessment
3. **Storage** → Result caching → Audit trail logging
4. **Client Response** → Formatted output → Usage tracking

## Error Handling & Resilience

### Error Boundaries
- **Frontend**: React error boundaries with fallback UI
- **Backend**: Global error handlers with structured logging
- **Database**: Connection retry logic and transaction rollback
- **AI Services**: Graceful degradation and fallback strategies

### Monitoring & Alerting
- **Health Checks**: Continuous system and service monitoring
- **Error Tracking**: Structured error logging with context
- **Performance Monitoring**: Real-time metrics and alerting
- **Audit Compliance**: Tamper-evident activity logging

## Model Context Protocol (MCP) Integration

### MCP Architecture
CyberDocGen implements the Model Context Protocol to enable programmatic access for Claude Code and other AI agents:

**Components**:
- **MCP Server** (`server/mcp/server.ts`): Protocol server implementation with authentication
- **Agent Client** (`server/mcp/agentClient.ts`): Client for agent communication
- **Tool Registry** (`server/mcp/toolRegistry.ts`): Registry of available tools and capabilities
- **Tool Implementations**:
  - Internal tools (`server/mcp/tools/internal.ts`): Core system operations
  - External tools (`server/mcp/tools/external.ts`): External API integrations
  - Advanced tools (`server/mcp/tools/advanced.ts`): Complex analysis operations

**Security**:
- All MCP endpoints require authentication (`isAuthenticated` middleware)
- Organization context enforced for multi-tenant isolation
- Comprehensive audit logging of all tool and agent executions
- Rate limiting protection (inherits from general API limiter)

**Capabilities Exposed via MCP**:
- Document generation and analysis
- Compliance gap analysis and reporting
- Risk assessment and scoring
- Quality scoring and recommendations
- Compliance chatbot interactions
- Framework-specific operations

**Use Cases**:
- Automated compliance workflows via Claude Code
- Programmatic document generation
- Batch compliance analysis
- Integration with CI/CD pipelines
- Agent-driven compliance testing

### Enterprise Services Architecture

**Compliance Services**:
- `complianceGapAnalysisService`: Framework-based gap analysis (ISO, SOC2, FedRAMP, NIST)
- `documentAnalysis`: AI-powered document review and recommendations
- `qualityScoring`: Comprehensive document quality assessment
- `riskAssessment`: Automated risk identification and scoring
- `frameworkSpreadsheetService`: Compliance framework mapping and tracking

**Security Services**:
- `auditService`: Immutable audit trail with tamper detection
- `threatDetectionService`: Real-time threat pattern identification
- `mfaService`: TOTP-based multi-factor authentication
- `encryptionService`: AES-256 encryption for sensitive data
- `sessionRiskScoringService`: Adaptive authentication based on session risk
- `pdfSecurityService`: Secure PDF generation with watermarking

**AI Services**:
- `aiOrchestrator`: Multi-model coordination with intelligent routing
- `openai`: GPT-5.1 integration and management
- `anthropic`: Claude Opus 4.5 integration
- `aiGuardrailsService`: Safety checks and PII protection
- `aiFineTuningService`: Custom model training capabilities
- `aiModels`: Model configuration and management

**Enterprise Management**:
- `enterpriseAuthService`: Enterprise SSO and authentication flows
- `cloudIntegrationService`: Google Drive and OneDrive synchronization
- `companyDataExtractionService`: AI-powered data extraction from websites
- `objectStorageService`: Cloud storage abstraction layer
- `chatbot`: Context-aware compliance Q&A assistant

**Operational Services**:
- `systemConfigService`: System-wide configuration management
- `dataRetentionService`: Automated data lifecycle management
- `dataResidencyService`: Geographic data residency controls
- `keyRotationService`: Automated encryption key rotation
- `modelTransparencyService`: AI model usage tracking and reporting
- `performanceService`: Real-time performance metrics collection
- `alertingService`: Multi-channel alerting and notifications
- `chaosTestingService`: Resilience and fault injection testing

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: Session storage in database enables multi-instance deployment
- **Load Balancing**: Ready for multi-instance deployment with shared session store
- **Database Scaling**: Connection pooling, read replicas, and query optimization
- **Caching Strategy**: Redis-ready for distributed caching layer
- **API Gateway Ready**: Prepared for API gateway and service mesh integration

### Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage with monitoring
- **Database Optimization**: Indexed queries, materialized views, and query optimization
- **Bundle Size**: Code splitting and tree shaking for optimal client bundles
- **API Efficiency**: Minimal payload sizes with efficient serialization
- **Compression**: Gzip/Brotli compression for all responses