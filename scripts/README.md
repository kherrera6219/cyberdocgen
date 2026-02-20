# Utility Scripts Documentation

This directory contains utility scripts for development, deployment, validation, and maintenance of CyberDocGen.

## Table of Contents

- [Overview](#overview)
- [Security Scripts](#security-scripts)
- [Validation Scripts](#validation-scripts)
- [Deployment Scripts](#deployment-scripts)
- [Phase Completion Scripts](#phase-completion-scripts)
- [Running Scripts](#running-scripts)
- [Best Practices](#best-practices)

## Overview

All scripts are written in TypeScript and can be executed using `tsx` or compiled and run with `node`. Scripts are organized by purpose and include comprehensive error handling and logging.

## Security Scripts

### `generate-encryption-key.ts`

Generates a secure encryption key for data encryption at rest.

**Purpose:**
- Creates a 32-byte random hex string
- Used for ENCRYPTION_KEY environment variable
- Required for SOC 2 compliance

**Usage:**
```bash
tsx scripts/generate-encryption-key.ts
```

**Output:**
```
Generated Encryption Key:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

Add this to your .env file:
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Important:**
- Keep key secure and never commit to version control
- Store in secure key management system for production
- Use different keys for development and production

**Also Available As:**
```bash
npm run security:generate-key
```

### `encrypt-existing-data.ts`

Encrypts existing sensitive data in the database.

**Purpose:**
- Migrates unencrypted data to encrypted format
- Used when enabling encryption on existing database
- Ensures data protection compliance

**Usage:**
```bash
tsx scripts/encrypt-existing-data.ts
```

**What It Does:**
1. Connects to database
2. Finds unencrypted sensitive fields
3. Encrypts data using ENCRYPTION_KEY
4. Updates database records
5. Verifies encryption success

**Prerequisites:**
- ENCRYPTION_KEY must be set in .env
- Database must be accessible
- Backup database before running

**Output:**
```
Encrypting existing data...
✓ Encrypted 50 user records
✓ Encrypted 120 document records
✓ Encrypted 30 profile records
Total: 200 records encrypted
```

**Safety:**
- Creates backup before encryption
- Validates each encryption
- Rolls back on failure
- Logs all operations

## Validation Scripts

### `validate-compliance.ts`

Validates system compliance with security and regulatory standards.

**Purpose:**
- Checks SOC 2 compliance requirements
- Validates security configurations
- Verifies data encryption
- Ensures audit logging is enabled

**Usage:**
```bash
tsx scripts/validate-compliance.ts
```

**What It Checks:**
- Environment variables required for compliance
- Database encryption status
- Audit trail configuration
- MFA availability
- Security headers
- Rate limiting
- Session security
- HTTPS enforcement (production)

**Output:**
```
🔍 Running Compliance Validation...

✅ Environment Variables: OK
✅ Database Encryption: ENABLED
✅ Audit Trail: ACTIVE
✅ MFA Support: ENABLED
✅ Security Headers: CONFIGURED
✅ Rate Limiting: ENABLED
✅ Session Security: OK
✅ HTTPS: ENFORCED

✅ All compliance checks passed!
```

**Exit Codes:**
- `0` - All checks passed
- `1` - One or more checks failed

**Also Available As:**
```bash
npm run compliance:validate
```

### `cloud-validation-sweep.ts`

Validates cloud runtime readiness with strict environment checks and endpoint probes.

**Purpose:**
- Ensures required cloud env vars exist (`DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `DATA_INTEGRITY_SECRET`)
- Boots the app in cloud mode and waits for readiness
- Validates key runtime endpoints (`/health`, `/api/ai/health`)
- Verifies local-only API gating behavior in cloud mode
- Writes a JSON report under `artifacts/cloud-validation/`

**Usage:**
```bash
npm run cloud:validate
```

Optional overrides:
```bash
tsx scripts/cloud-validation-sweep.ts --strict-env --timeout-ms=60000 --port=5620
```

### `validate-windows-release-evidence.ts`

Validates Windows release evidence bundles and generates a manifest with SHA-256 file hashes.

**Purpose:**
- Confirms clean-VM install/uninstall evidence files exist
- Confirms SmartScreen unsigned/signed screenshots exist
- Confirms signature verification report and desktop smoke report exist
- Produces `evidence-manifest.json` for audit traceability

**Usage:**
```bash
npm run windows:evidence:validate -- --evidence-root=./docs/project-analysis/evidence/windows-release
```

Optional strict mode:
```bash
tsx scripts/validate-windows-release-evidence.ts --strict
```

### `production-build-check.ts`

Validates production build before deployment.

**Purpose:**
- Ensures build completes successfully
- Verifies all assets are generated
- Checks TypeScript compilation
- Validates environment configuration

**Usage:**
```bash
tsx scripts/production-build-check.ts
```

**What It Checks:**
- TypeScript compilation (no errors)
- Client build (Vite)
- Server build (esbuild)
- Static assets
- Environment variables
- Dependencies
- Build artifacts

**Output:**
```
🔨 Production Build Check

Building client...
✅ Client build: SUCCESS (dist/public/)

Building server...
✅ Server build: SUCCESS (dist/index.js)

TypeScript check...
✅ Type check: PASSED

Validating artifacts...
✅ index.html exists
✅ JavaScript bundles exist
✅ CSS files exist
✅ Server bundle exists

✅ Production build is ready for deployment!
```

**Exit Codes:**
- `0` - Build successful
- `1` - Build failed

### `final-production-validation.ts`

Comprehensive pre-deployment validation.

**Purpose:**
- Final validation before production deployment
- Checks all systems and configurations
- Ensures production readiness
- Validates compliance and security

**Usage:**
```bash
tsx scripts/final-production-validation.ts
```

**What It Validates:**
- Environment configuration
- Database connectivity
- AI service availability
- Security configuration
- Build artifacts
- Compliance requirements
- Performance benchmarks

**Output:**
```
🚀 Final Production Validation

Environment Configuration...
✅ All required environment variables set
✅ Production environment detected

Database...
✅ Database connection: SUCCESS
✅ All tables present
✅ Indexes configured

AI Services...
✅ OpenAI API: AVAILABLE
✅ Anthropic API: AVAILABLE

Security...
✅ Encryption enabled
✅ MFA configured
✅ Audit logging active
✅ Rate limiting enabled

Build Artifacts...
✅ Client build present
✅ Server build present

Compliance...
✅ SOC 2 requirements: MET
✅ Security audit: PASSED

✅✅✅ SYSTEM IS PRODUCTION READY! ✅✅✅
```

**Exit Codes:**
- `0` - Production ready
- `1` - Not ready for production

## Deployment Scripts

### `production-deployment-check.ts`

Pre-deployment checklist and validation.

**Purpose:**
- Validates deployment prerequisites
- Checks production configuration
- Ensures zero-downtime deployment readiness

**Usage:**
```bash
tsx scripts/production-deployment-check.ts
```

**What It Checks:**
- Git repository status
- Branch (should be main/master)
- Uncommitted changes
- Environment variables
- Database migrations
- Build artifacts
- Health check endpoints
- SSL/TLS certificates (if applicable)

**Output:**
```
📋 Production Deployment Checklist

Git Status...
✅ On main branch
✅ No uncommitted changes
✅ Up to date with remote

Configuration...
✅ Production environment set
✅ All secrets configured
✅ Database URL set

Build...
✅ Production build completed
✅ All assets present

Database...
✅ Migrations applied
✅ Database accessible

Health Checks...
✅ Health endpoint responds
✅ AI services available

✅ Ready for deployment!
```

### `production-startup.ts`

Production server startup script with health checks.

**Purpose:**
- Starts production server
- Performs pre-flight checks
- Validates system health
- Logs startup process

**Usage:**
```bash
tsx scripts/production-startup.ts
```

**What It Does:**
1. Validates environment
2. Checks database connection
3. Verifies AI service availability
4. Starts Express server
5. Registers shutdown handlers
6. Reports system status

**Output:**
```
🚀 Starting Production Server...

Pre-flight Checks...
✅ Environment: production
✅ Database: Connected
✅ OpenAI: Available
✅ Anthropic: Available

Starting server on port 5000...
✅ Server started successfully

Health Check...
✅ GET /health returns 200

✅ Server is running and healthy!
```

## Phase Completion Scripts

### `phase1-completion.ts`

Phase 1 completion validation and reporting.

**Purpose:**
- Validates Phase 1 implementation
- Generates completion report
- Checks all Phase 1 requirements

**Usage:**
```bash
tsx scripts/phase1-completion.ts
```

**What It Validates:**
- Core features implemented
- Authentication working
- Database schema complete
- Basic API endpoints functional
- UI components present

**Output:**
```
📊 Phase 1 Completion Report

Core Features:
✅ User authentication
✅ Organization management
✅ Document management
✅ Basic UI components

API Endpoints:
✅ /api/auth/* (5 endpoints)
✅ /api/documents/* (6 endpoints)
✅ /api/organizations/* (7 endpoints)

Database:
✅ Schema created
✅ Tables present: 10/10

✅ Phase 1: COMPLETE!
```

### `phase2-completion.ts`

Phase 2 completion validation and reporting.

**Purpose:**
- Validates Phase 2 implementation
- Checks advanced features
- Generates completion report

**Usage:**
```bash
tsx scripts/phase2-completion.ts
```

**What It Validates:**
- AI integration working
- Document generation functional
- Gap analysis implemented
- Cloud integrations
- Advanced security features

**Output:**
```
📊 Phase 2 Completion Report

AI Services:
✅ OpenAI integration
✅ Anthropic integration
✅ Document generation
✅ Document analysis

Compliance:
✅ Gap analysis
✅ Risk assessment
✅ Quality scoring

Security:
✅ MFA implementation
✅ Encryption enabled
✅ Audit logging

Cloud:
✅ Google Drive integration
✅ OneDrive integration

✅ Phase 2: COMPLETE!
```

## Running Scripts

### Using tsx (Recommended for Development)

```bash
# Run directly with tsx
tsx scripts/generate-encryption-key.ts

# With environment variables
DATABASE_URL=... tsx scripts/validate-compliance.ts
```

### Using npm scripts

Some scripts have npm aliases:

```bash
npm run security:generate-key      # Generate encryption key
npm run compliance:validate        # Validate compliance
npm run build:check               # Production build check
npm run deploy:check              # Deployment check
```

### Compiling and Running

```bash
# Compile TypeScript
npx tsc scripts/script-name.ts --outDir dist/scripts

# Run compiled JavaScript
node dist/scripts/script-name.js
```

### With Arguments

```bash
# Pass arguments to scripts
tsx scripts/encrypt-existing-data.ts --dry-run

# Environment variables
DATABASE_URL=postgresql://... tsx scripts/validate-compliance.ts
```

## Best Practices

### Writing New Scripts

1. **Use TypeScript:**
   ```typescript
   import { db } from '../server/db';

   async function main() {
     try {
       // Script logic
       console.log('✅ Success');
       process.exit(0);
     } catch (error) {
       console.error('❌ Error:', error);
       process.exit(1);
     }
   }

   main();
   ```

2. **Include Error Handling:**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('Operation failed', { error });
     process.exit(1);
   }
   ```

3. **Provide Clear Output:**
   ```typescript
   console.log('🔍 Starting validation...');
   console.log('✅ Check 1: PASSED');
   console.log('❌ Check 2: FAILED');
   console.log('\n✅ All checks passed!');
   ```

4. **Use Exit Codes:**
   ```typescript
   if (allChecksPassed) {
     process.exit(0); // Success
   } else {
     process.exit(1); // Failure
   }
   ```

5. **Document Usage:**
   ```typescript
   /**
    * Script Name
    *
    * Purpose: Brief description
    *
    * Usage:
    *   tsx scripts/script-name.ts [options]
    *
    * Options:
    *   --dry-run    Don't make changes
    *   --verbose    Show detailed output
    */
   ```

### Safety Guidelines

1. **Backup Before Destructive Operations:**
   ```typescript
   console.log('⚠️  Creating backup...');
   await createBackup();
   await performOperation();
   ```

2. **Validate Input:**
   ```typescript
   if (!process.env.REQUIRED_VAR) {
     console.error('❌ REQUIRED_VAR not set');
     process.exit(1);
   }
   ```

3. **Dry Run Option:**
   ```typescript
   const isDryRun = process.argv.includes('--dry-run');
   if (isDryRun) {
     console.log('🔍 DRY RUN MODE - No changes will be made');
   }
   ```

4. **Confirmation Prompts:**
   ```typescript
   console.log('⚠️  This will modify production data!');
   console.log('Type "yes" to continue:');
   const answer = await promptUser();
   if (answer !== 'yes') {
     console.log('Cancelled');
     process.exit(0);
   }
   ```

### Testing Scripts

1. **Test in Development First:**
   ```bash
   NODE_ENV=development tsx scripts/script-name.ts
   ```

2. **Use Test Database:**
   ```bash
   DATABASE_URL=postgresql://localhost/test tsx scripts/script-name.ts
   ```

3. **Verify Output:**
   ```bash
   tsx scripts/script-name.ts | tee output.log
   ```

## Common Issues

### Script Fails to Connect to Database

**Solution:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Run script with correct URL
DATABASE_URL=postgresql://... tsx scripts/script-name.ts
```

### TypeScript Errors

**Solution:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Install types
npm install --save-dev @types/node

# Use tsx instead of ts-node
tsx scripts/script-name.ts
```

### Permission Errors

**Solution:**
```bash
# Make script executable
chmod +x scripts/script-name.ts

# Run with appropriate permissions
# Don't use sudo unless absolutely necessary
```

### Environment Variables Not Loaded

**Solution:**
```bash
# Load .env file
source .env
tsx scripts/script-name.ts

# Or use dotenv in script
import 'dotenv/config';
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [tsx Documentation](https://github.com/esbuild-kit/tsx)

---

For more information, see the main [README.md](../README.md) and [DEVELOPMENT_GUIDE.md](../docs/DEVELOPMENT_GUIDE.md).
