# CyberDocGen Architecture Documentation

## System Overview

CyberDocGen is an enterprise-grade compliance management platform that leverages multiple AI models to automate compliance workflows. The system is built with modern web technologies and designed for scalability, security, and performance. It supports ISO 27001:2022, SOC 2, FedRAMP, and NIST 800-53 Rev 5 frameworks with comprehensive document generation, gap analysis, and risk assessment capabilities.

## Architecture Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state, React Hook Form for forms
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect integration
- **AI Integration**: Multi-model orchestration (OpenAI GPT-5.1, Anthropic Claude Opus 4.5, Google Gemini 3.0 Pro)
- **Storage**: Cloud object storage for document assets

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle with type-safe queries
- **Schema**: Multi-tenant with organization-based data isolation
- **Migrations**: Automated through Drizzle Kit
- **Audit Trail**: Comprehensive activity logging with integrity verification

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

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Replit Deployments with automatic scaling
- **Database**: Neon serverless PostgreSQL
- **Storage**: Google Cloud Storage via Replit Object Storage

### CI/CD Pipeline
- **Build**: TypeScript compilation and bundling
- **Testing**: Unit tests, integration tests, type checking
- **Deployment**: Automated deployment via Replit
- **Monitoring**: Real-time health checks and metrics

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
- **MCP Server** (`server/mcp/server.ts`): Protocol server implementation
- **Agent Client** (`server/mcp/agentClient.ts`): Client for agent communication
- **Tool Registry** (`server/mcp/toolRegistry.ts`): Registry of available tools and capabilities
- **Tool Implementations**:
  - Internal tools (`server/mcp/tools/internal.ts`): Core system operations
  - External tools (`server/mcp/tools/external.ts`): External API integrations
  - Advanced tools (`server/mcp/tools/advanced.ts`): Complex analysis operations

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