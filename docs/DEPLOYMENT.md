# Deployment Guide

## Overview

CyberDocGen supports two deployment modes:

1. **Cloud Mode** - Hosted on cloud platforms (Replit, AWS, GCP, Azure) with PostgreSQL database and multi-tenancy
2. **Local Mode** - Windows 11 desktop application with SQLite database and local storage

This guide covers deployment configuration, environment setup, and operational procedures for both deployment modes.

---

## Table of Contents

- [Cloud Mode Deployment](#cloud-mode-deployment)
  - [Prerequisites](#cloud-mode-prerequisites)
  - [Deployment Process](#cloud-deployment-process)
  - [Configuration](#cloud-configuration)
- [Local Mode Deployment](#local-mode-deployment)
  - [Prerequisites](#local-mode-prerequisites)
  - [Building Desktop Application](#building-desktop-application)
  - [Microsoft Store Distribution](#microsoft-store-distribution)
- [Common Operations](#common-operations)

---

# Cloud Mode Deployment

## Cloud Mode Prerequisites

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

## Cloud Deployment Process

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

---

# Local Mode Deployment

## Local Mode Prerequisites

### Development Environment
- **Operating System**: Windows 11 (64-bit)
- **Node.js**: 20 or higher
- **npm**: 10 or higher
- **Python**: 3.11+ (for native module compilation)
- **Visual Studio Build Tools**: Required for keytar native module

### Build Tools Installation

**Install Visual Studio Build Tools**:
```powershell
# Install via Chocolatey (recommended)
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"

# Or download from Microsoft
# https://visualstudio.microsoft.com/downloads/
```

**Install Node.js and npm**:
```powershell
# Install via Chocolatey
choco install nodejs-lts

# Or download from nodejs.org
```

### Required Dependencies

**Install Project Dependencies**:
```bash
npm install

# Electron and build tools
npm install --save-dev electron@35 electron-builder@24

# Local mode dependencies
npm install better-sqlite3@11 keytar@7.9 electron-updater@6.1
```

## Building Desktop Application

### Development Build

**Run in Development Mode**:
```bash
# Set environment for local mode
npm run electron:dev

# This starts:
# 1. Backend server with DEPLOYMENT_MODE=local
# 2. Frontend with Vite dev server
# 3. Electron wrapper connecting to localhost:5000
```

**Development Features**:
- Hot reload for frontend changes
- DevTools enabled
- Localhost binding (127.0.0.1:5231 for backend)
- Console logging for debugging

### Production Build

**Build Desktop Application**:
```bash
# Full production build
npm run electron:build

# This creates:
# 1. Optimized frontend bundle (client/dist/)
# 2. Compiled backend (server/dist/)
# 3. Electron distributable in dist/ folder
```

**Build Artifacts** (in `dist/` folder):
- `CyberDocGen-Setup-3.0.0.exe` - NSIS installer (recommended)
- `CyberDocGen-3.0.0.msix` - Microsoft Store package
- `CyberDocGen-3.0.0-win.zip` - Portable version (no installer)
- `latest.yml` - Auto-updater metadata

### Build Configuration

**electron-builder.yml**:
```yaml
appId: com.cyberdocgen.app
productName: CyberDocGen
copyright: Copyright © 2026 CyberDocGen
directories:
  output: dist
  buildResources: resources

win:
  target:
    - target: nsis
      arch: [x64]
    - target: portable
      arch: [x64]
    - target: appx  # MSIX for Microsoft Store
      arch: [x64]

  # Code signing (required for Microsoft Store)
  certificateFile: cert.pfx  # Your certificate
  certificatePassword: ${CERT_PASSWORD}

  # MSIX configuration
  appx:
    publisher: CN=CyberDocGen
    publisherDisplayName: CyberDocGen
    identityName: CyberDocGen.CyberDocGen
    applicationId: CyberDocGen
    displayName: CyberDocGen
    backgroundColor: "#1a1a1a"

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: CyberDocGen

publish:
  provider: generic
  url: https://releases.cyberdocgen.com
```

### Code Signing

**Required for Microsoft Store and trusted installation**:

1. **Obtain Code Signing Certificate**:
   - Extended Validation (EV) certificate recommended
   - Standard code signing certificate acceptable
   - Available from DigiCert, Sectigo, GlobalSign

2. **Configure Certificate**:
```bash
# Set certificate password in environment
export CERT_PASSWORD="your-certificate-password"

# Place certificate in project root
cp your-cert.pfx cert.pfx
```

3. **Build with Signing**:
```bash
# Automatically signs during build
npm run electron:build
```

## Microsoft Store Distribution

### Store Submission Requirements

**App Requirements**:
- ✅ Code signed with valid certificate
- ✅ MSIX package format
- ✅ Passes Windows App Certification Kit (WACK)
- ✅ Privacy policy URL
- ✅ Age rating declaration
- ✅ Screenshots and store listing assets

### Creating MSIX Package

**Build MSIX**:
```bash
# Build specifically for Microsoft Store
npm run electron:build -- --win appx

# Output: dist/CyberDocGen-3.0.0.msix
```

**Validate MSIX Package**:
```bash
# Run Windows App Certification Kit
# Included with Windows SDK
"C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe" test -appxpackagepath dist\CyberDocGen-3.0.0.msix -reportoutputpath wack-report.xml
```

**Automated Validation** (via npm script):
```bash
npm run validate:wack
```

### Partner Center Submission

1. **Create App Listing**:
   - Go to [Partner Center](https://partner.microsoft.com/dashboard)
   - Create new app submission
   - Fill in app details (name, description, category)

2. **Upload Package**:
   - Upload `CyberDocGen-3.0.0.msix`
   - System automatically validates package

3. **Configure Store Listing**:
   - **Description**: Compliance management platform with AI assistance
   - **Category**: Productivity → Business
   - **Age Rating**: Everyone
   - **Screenshots**: 4-10 screenshots showing key features
   - **Privacy Policy**: https://cyberdocgen.com/privacy

4. **Pricing & Availability**:
   - Free or paid (configure pricing tiers)
   - Geographic availability
   - Release date

5. **Submit for Certification**:
   - Review all sections
   - Click "Submit to Store"
   - Certification typically takes 24-48 hours

### Auto-Update Configuration

**Update Server Setup**:

Option 1: **Static Hosting** (GitHub Releases, S3, Azure Blob):
```yaml
# In electron-builder.yml
publish:
  provider: github
  owner: cyberdocgen
  repo: cyberdocgen
```

Option 2: **Custom Update Server**:
```yaml
publish:
  provider: generic
  url: https://releases.cyberdocgen.com
```

**Update Server Structure**:
```
https://releases.cyberdocgen.com/
├── latest.yml              # Update metadata
├── CyberDocGen-Setup-3.0.0.exe
└── CyberDocGen-3.0.0.msix
```

**latest.yml Format**:
```yaml
version: 3.0.0
releaseDate: '2026-01-21T00:00:00.000Z'
files:
  - url: CyberDocGen-Setup-3.0.0.exe
    sha512: <hash>
    size: 123456789
path: CyberDocGen-Setup-3.0.0.exe
sha512: <hash>
releaseNotes: |-
  - New feature: API key management UI
  - Improved: Database performance
  - Fixed: Window state persistence
```

**Update Checking** (configured in `electron/main.ts`):
- Checks on startup (after 5 seconds)
- Checks every 4 hours while running
- Downloads updates automatically in background
- Prompts user to restart when update ready

## Local Mode Configuration

### Environment Variables

**Set Before Starting** (electron/main.ts handles this automatically):
```typescript
process.env.DEPLOYMENT_MODE = 'local';
process.env.LOCAL_DATA_PATH = app.getPath('userData');
process.env.LOCAL_PORT = '5231';
```

**User Data Location**:
- **Windows**: `%APPDATA%\CyberDocGen\`
- **Database**: `%APPDATA%\CyberDocGen\cyberdocgen.db`
- **Storage**: `%APPDATA%\CyberDocGen\storage\`
- **Window State**: `%APPDATA%\CyberDocGen\window-state.json`

### API Key Configuration

**Windows Credential Manager**:
- API keys stored via keytar library
- Service name: `CyberDocGen`
- Encrypted with user's Windows login credentials
- Managed via Settings → API Keys in app

**Manual Configuration** (for development):
```bash
# Alternative: Set via environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_AI_API_KEY="AIza..."
```

## Installation & Distribution

### Direct Distribution

**Download and Install**:
1. User downloads `CyberDocGen-Setup-3.0.0.exe`
2. Runs installer (Windows may show SmartScreen warning if not signed)
3. Follows installation wizard
4. Launches from Start Menu or desktop shortcut

**Silent Installation**:
```powershell
# For enterprise deployment
CyberDocGen-Setup-3.0.0.exe /S /allusers

# Or per-user
CyberDocGen-Setup-3.0.0.exe /S /currentuser
```

### Microsoft Store Distribution

**User Installation**:
1. Open Microsoft Store
2. Search for "CyberDocGen"
3. Click "Get" or "Install"
4. Automatic installation and updates

**Advantages**:
- Automatic updates via Microsoft Store
- Trusted installation source
- No code signing warnings
- Sandbox security model
- Easy discovery

### Portable Version

**For users who prefer no installation**:
```bash
# Extract portable version
unzip CyberDocGen-3.0.0-win.zip

# Run directly
.\CyberDocGen\CyberDocGen.exe
```

**Portable Mode**:
- Data stored in app directory instead of AppData
- No registry modifications
- Can run from USB drive
- Manual updates only

## Troubleshooting Local Mode

### Build Issues

**Native Module Compilation Errors** (keytar):
```bash
# Ensure Visual Studio Build Tools installed
npm install --global windows-build-tools

# Rebuild native modules
npm rebuild keytar --update-binary

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

**Electron Build Errors**:
```bash
# Clear Electron cache
rm -rf node_modules/.cache/electron*

# Reinstall Electron
npm install electron@35 --save-dev

# Clean build
npm run clean
npm run electron:build
```

### Runtime Issues

**Database Locked**:
- SQLite database locked by another process
- Solution: Ensure only one instance running
- Check Task Manager for CyberDocGen processes

**Windows Credential Manager Errors**:
- Keytar initialization failed
- Solution: Falls back to environment variables
- Check Windows Credential Manager access

**Auto-Update Failures**:
- Cannot connect to update server
- Solution: Check network connectivity
- Verify update server URL configuration

**Port Already in Use** (5231):
```bash
# Find process using port
netstat -ano | findstr :5231

# Kill process
taskkill /PID <process-id> /F
```

### Debug Mode

**Enable Debug Logging**:
```bash
# Set before starting
$env:DEBUG="*"
npm run electron:dev

# Or in production
$env:ELECTRON_ENABLE_LOGGING=1
CyberDocGen.exe
```

**Log Locations**:
- **App Logs**: `%APPDATA%\CyberDocGen\logs\`
- **Electron Logs**: Console output in DevTools
- **Database Logs**: `%APPDATA%\CyberDocGen\db.log`

---

# Common Operations