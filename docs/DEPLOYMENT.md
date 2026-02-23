# Deployment Guide

## Overview

CyberDocGen supports **two deployment modes**:

1. **Cloud Mode (SaaS)**: Multi-tenant web application on Replit with PostgreSQL and cloud storage
2. **Desktop Mode (Windows 11)**: Standalone offline application with SQLite and local file storage

This guide covers both deployment configurations.

---

## Windows Desktop Deployment

### Deployment Strategy

**Target Platform:** Windows 11 (x64)  
**Packaging:** NSIS Installer (`.exe`) for local distribution  
**Microsoft Store Option:** APPX package for Partner Center submission

### Build Process

#### Prerequisites
- Node.js 20+
- Windows 11 development machine
- Application icon in `build/icon.ico` (multi-resolution: 16x16 to 256x256)

#### Build Commands

```bash
# Full desktop build (includes all steps)
npm run build:win

# Or step-by-step:
npm run windows:validate   # Validate Windows packaging config/assets
npm run build              # Build frontend (Vite)
npm run electron:build     # Build Electron main process
npm run electron:prepare-better-sqlite3 # Stage Electron ABI prebuilt better-sqlite3 binary
npx electron-builder build --win nsis # Package installer
npm run build:store        # Build APPX package for Microsoft Store
node scripts/verify-build.js # Verify build artifacts + local startup probes
```

#### Output

```
dist/packaging/
├── CyberDocGen-Setup-<version>.exe  # NSIS installer
├── CyberDocGen-Store-<version>.appx # Microsoft Store package
└── win-unpacked/                # Portable/testing version
```

### Installation Behavior

- **Scope:** Per-user (no admin rights required)
- **Installer Flow:** Assisted NSIS wizard (`oneClick: false`)
- **Install Location:** User-selectable (default `%LOCALAPPDATA%\Programs\CyberDocGen`)
- **Data Location:** `%APPDATA%\Roaming\rest-express`
- **Shortcuts:** Desktop + Start Menu
- **Progress UX:** Standard progress pages for install and uninstall
- **Completion UX:** Explicit completion notifications for install and uninstall
- **Uninstall:** Registered in Apps & Features
- **Uninstall Data Choice:** User can keep or delete runtime data (including `%APPDATA%\rest-express`, `%LOCALAPPDATA%\rest-express`, and legacy `%APPDATA%\CyberDocGen` / `%LOCALAPPDATA%\CyberDocGen` paths).

### First Run Requirements (Desktop Mode)

No cloud database setup is required for local desktop usage. End users only need to add AI provider API keys in the app after installation:

- OpenAI
- Anthropic
- Google AI

### Local Mode Configuration

Desktop app automatically runs in local mode with:

- **Database:** SQLite at `%APPDATA%\Roaming\rest-express\cyberdocgen.db`
- **Storage:** Local files at `%APPDATA%\Roaming\rest-express\files`
- **Authentication:** Bypassed (auto-login as "Local Admin")
- **Server:** Localhost-only binding (`127.0.0.1:5231`)
- **Secrets:** Windows Credential Manager (via keytar)
- **Local Backend Secrets:** auto-provisioned/persisted in `%APPDATA%\Roaming\rest-express\security\backend-secrets.json` when not explicitly provided

### Distribution Options

#### Option 1: Direct Download (Current)
- Host `.exe` on website or GitHub Releases
- Users download and run installer
- Requires code signing certificate to avoid SmartScreen warnings

#### Option 2: Microsoft Store
- Build APPX packaging (`npm run build:store`)
- Submit via Microsoft Partner Center
- Automatic updates via Windows Store (replaces direct NSIS release channel)
- See [`MICROSOFT_STORE_SUBMISSION_GUIDE.md`](../MICROSOFT_STORE_SUBMISSION_GUIDE.md)

### Code Signing (Required for Production)

```powershell
# Sign the installer (requires Authenticode certificate)
SignTool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a "dist/packaging/CyberDocGen-Setup-<version>.exe"
```

**Certificate Options:**
- **EV Certificate:** Immediate trust, $400-500/year (DigiCert, Sectigo)
- **Standard Certificate:** Reputation build-up, $100-200/year

### Auto-Updates

Configured via `electron-updater`:

```yaml
# electron-builder.yml
publish:
  provider: github
  owner: kherrera6219
  repo: cyberdocgen
  releaseType: release
```

Updates are opt-in for direct desktop builds (`ENABLE_AUTO_UPDATES=true`) and disabled for Microsoft Store packages (Store handles updates).

### Troubleshooting Desktop Builds

**Issue:** Icon not appearing  
**Solution:** Verify `build/icon.ico` exists and is referenced in `electron-builder.yml`

**Issue:** SmartScreen warning  
**Solution:** Sign installer with Authenticode certificate

**Issue:** Server fails to start  
**Solution:** Check logs at `%APPDATA%\Roaming\rest-express\logs`

---

## Cloud Deployment (Replit/SaaS)



## Prerequisites

### Required Services
- **Replit Account**: Pro or higher for production deployments
- **Database**: Neon PostgreSQL (configured automatically)
- **Object Storage**: Replit Object Storage or Google Cloud Storage
- **AI Services**: OpenAI, Anthropic, and Google AI API keys

### Environment Variables
Set these secrets in your Repl or environment:

```bash
# Required - AI Services
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Required - Database
DATABASE_URL=postgresql://... (auto-configured on Replit)

# Required - Security
SESSION_SECRET=... (minimum 32 characters, auto-generated recommended)
ENCRYPTION_KEY=... (32-byte hex key for AES-256)

# Object Storage (auto-configured on Replit)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...
PUBLIC_OBJECT_SEARCH_PATHS=...
PRIVATE_OBJECT_DIR=...

# Optional - Application Configuration
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Optional - Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000

# Optional - Cloud Integrations
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

## Deployment Process

### Automatic Deployment
1. **Code Push**: Push changes to main branch
2. **Build Process**: Automatic TypeScript compilation and bundling
3. **Health Checks**: Pre-deployment validation
4. **Rolling Deployment**: Zero-downtime updates
5. **Post-Deploy**: Health verification and monitoring

### Manual Deployment
```bash
# Build the application
npm run build

# Run database migrations
npm run db:push

# Start the production server
npm start
```

## Build Configuration

### TypeScript Compilation
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Production Optimizations
- **Bundle Optimization**: Vite production build with tree shaking
- **Code Splitting**: Dynamic imports for large components
- **Compression**: Gzip compression for static assets
- **Minification**: JavaScript and CSS minification

## Database Setup

### Initial Setup
```bash
# Push schema to database
npm run db:push

# Verify connection
npm run db:check
```

### Migration Strategy
- **Schema Changes**: Use Drizzle Kit for safe migrations
- **Data Migration**: Custom scripts for data transformations
- **Rollback**: Maintain migration rollback procedures
- **Backup**: Automated database backups before deployments

## Health Monitoring

### Health Check Endpoints
```bash
# System health
GET /health

# AI services health
GET /api/ai/health

# Database connectivity
GET /api/health/database
```

### Monitoring Metrics
- **Response Times**: API endpoint performance
- **Error Rates**: 4xx and 5xx response tracking
- **AI Usage**: Model usage and success rates
- **Database Performance**: Query times and connection health

## Security Configuration

### Production Security
- **HTTPS Only**: Force TLS 1.3 encryption
- **Security Headers**: CSP, HSTS, XSS protection, frame options
- **Rate Limiting**: Production-tuned (1000 req/15min general, 10/hour AI)
- **CORS**: Strict origin validation and credential handling
- **CSRF Protection**: Session-bound tokens for all state-changing operations
- **Threat Detection**: Real-time pattern detection and automated blocking
- **MFA Enforcement**: Required for high-risk operations

### Security Middleware Stack
The following middleware is applied in order:

1. **Security Headers** - CORS, CSP, XSS protection
2. **Cookie Parser** - Secure cookie handling
3. **CSRF Protection** - Token validation
4. **Threat Detection** - Pattern-based threat identification
5. **Audit Logger** - Immutable activity logging
6. **Route Access Validation** - Access control checks
7. **Performance Logging** - Request/response metrics
8. **Rate Limiting** - Request throttling
9. **MFA Enforcement** - Multi-factor authentication checks
10. **Request Validation** - Zod schema validation

### API Security Configuration
```typescript
// Production security configuration
securityHeaders: {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

rateLimits: {
  general: { max: 1000, windowMs: 900000 },
  ai: { max: 10, windowMs: 3600000 },
  auth: { max: 5, windowMs: 900000 }
}
```

## Performance Optimization

### Client-Side Performance
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Deferred loading of non-critical components
- **Caching**: Aggressive caching for static assets
- **Bundle Analysis**: Regular bundle size optimization

### Server-Side Performance
- **Connection Pooling**: Database connection optimization
- **Response Caching**: Strategic API response caching
- **Compression**: Gzip/Brotli compression
- **Request Optimization**: Efficient query patterns

## Scaling Configuration

### Horizontal Scaling
- **Stateless Design**: Session storage in database
- **Load Balancing**: Ready for multi-instance deployment
- **Database Scaling**: Connection pooling and read replicas
- **Cache Strategy**: Distributed caching preparation

### Resource Limits
```yaml
resources:
  memory: "1Gi"
  cpu: "500m"
scaling:
  minReplicas: 1
  maxReplicas: 10
  targetCPU: 70
```

## Backup & Recovery

### Automated Backups
- **Database**: Daily automated backups with 30-day retention
- **Object Storage**: Cross-region replication
- **Configuration**: Environment variable backup
- **Code**: Git-based version control

### Recovery Procedures
1. **Database Recovery**: Point-in-time recovery from backups
2. **Application Recovery**: Rollback to previous deployment
3. **Data Recovery**: Object storage restoration
4. **Full System Recovery**: Complete environment restoration

## Logging & Monitoring

### Application Logging
```typescript
// Structured logging
logger.info('User action', {
  userId: req.user.id,
  action: 'document_create',
  resourceId: document.id,
  timestamp: new Date().toISOString()
});
```

### Log Aggregation
- **Centralized Logging**: All application logs in structured format
- **Error Tracking**: Automatic error detection and alerting
- **Performance Monitoring**: Response time and throughput tracking
- **Security Logging**: Authentication and authorization events

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_ENABLED=false
```

### Staging
```bash
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.example.com
RATE_LIMIT_ENABLED=true
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://app.example.com
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS=strict
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and network connectivity
2. **AI Service Errors**: Verify API keys and rate limits
3. **Authentication Issues**: Check session configuration and CORS
4. **Performance Issues**: Monitor database queries and API response times

### Debug Procedures
```bash
# Check application health
curl https://your-app.repl.co/health

# Verify database connectivity
npm run db:check

# Test AI services
curl -X GET https://your-app.repl.co/api/ai/health

# Monitor application logs
npm run logs:tail
```

### Rollback Procedures
1. **Immediate Rollback**: Revert to previous deployment
2. **Database Rollback**: Restore from backup if needed
3. **Configuration Rollback**: Restore environment variables
4. **Verification**: Health check after rollback

## Maintenance

### Regular Maintenance
- **Dependency Updates**: Monthly security updates
- **Database Optimization**: Quarterly performance tuning
- **Log Cleanup**: Automated log rotation and cleanup
- **Security Audits**: Regular security assessments

### Update Procedures
1. **Test Updates**: Verify in staging environment
2. **Backup**: Create pre-update backup
3. **Deploy**: Rolling deployment with health checks
4. **Verify**: Post-deployment verification
5. **Monitor**: Continuous monitoring after updates
