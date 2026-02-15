# Environment Setup Guide

This guide provides detailed instructions for setting up your development environment for CyberDocGen.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [AI Services Configuration](#ai-services-configuration)
- [Cloud Services Setup](#cloud-services-setup)
- [Local Development](#local-development)
- [Production Setup](#production-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v20 or higher)
   ```bash
   node --version  # Should be 20.x or higher
   ```
   Download from [nodejs.org](https://nodejs.org/)

2. **PostgreSQL** (v16 or higher)
   ```bash
   psql --version  # Should be 16.x or higher
   ```
   Download from [postgresql.org](https://www.postgresql.org/download/)

3. **Git**
   ```bash
   git --version
   ```
   Download from [git-scm.com](https://git-scm.com/)

4. **npm** (comes with Node.js) or **yarn**
   ```bash
   npm --version
   ```

### Optional Tools

- **Docker** (for containerized development)
- **pgAdmin** or **DBeaver** (database management GUI)
- **Postman** or **Insomnia** (API testing)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kherrera6219/cyberdocgen.git
cd cyberdocgen
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies defined in `package.json` (100+ packages).

### 3. Create Environment File

```bash
cp .env.example .env
```

Now edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section).

## Environment Variables

### Required Variables

#### Database Configuration

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/cyberdocgen
```

**For local PostgreSQL:**
```bash
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cyberdocgen
```

**For Neon (serverless):**
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/cyberdocgen?sslmode=require
```

#### Session Secret

```bash
# Minimum 32 characters, use strong random string
SESSION_SECRET=your-secure-session-secret-minimum-32-characters-long
```

**Generate a secure secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

#### Encryption Key

```bash
# 32-byte hex encryption key for data encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here
# Integrity signing secret (minimum 32 chars)
DATA_INTEGRITY_SECRET=your-data-integrity-secret-min-32-characters
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANT:** Keep this key secure and never commit it to version control.

Desktop packaging note:
- Installed Windows desktop builds auto-provision and persist local `ENCRYPTION_KEY` + `DATA_INTEGRITY_SECRET` in `%APPDATA%\Roaming\rest-express\security\backend-secrets.json` when these values are not provided.
- Cloud deployments and non-desktop production server runs must still provide both values explicitly.

#### AI Service Keys

```bash
# OpenAI API key for GPT-5.1
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic API key for Claude Opus 4.5
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google AI API key for Gemini 3.0 Pro
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get API Keys:**
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Anthropic: [console.anthropic.com](https://console.anthropic.com/)
- Google AI: [ai.google.dev](https://ai.google.dev/)

### Optional Variables

#### Application Configuration

```bash
# Environment mode
NODE_ENV=development  # or 'production'

# Server port
PORT=5000

# Log level
LOG_LEVEL=info  # Options: error, warn, info, debug
```

#### Security Configuration

```bash
# Rate limiting
RATE_LIMIT_MAX=1000          # Max requests per window
RATE_LIMIT_WINDOW_MS=900000  # Time window (15 minutes)
```

#### Cloud Storage Configuration

```bash
# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account",...}

# Google OAuth (for Google Drive integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth (for OneDrive integration)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

#### Replit Configuration (for Replit deployment)

```bash
REPLIT_DB_URL=your-replit-db-url
```

### Environment File Template

Create a `.env` file with all required variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/cyberdocgen

# Security
SESSION_SECRET=your-generated-session-secret-here
ENCRYPTION_KEY=your-generated-encryption-key-here
DATA_INTEGRITY_SECRET=your-generated-data-integrity-secret-here

# AI Services
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=AIza-your-key-here

# Application
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000
```

## Database Setup

### Local PostgreSQL Setup

1. **Install PostgreSQL**
   - macOS: `brew install postgresql@16`
   - Ubuntu: `sudo apt install postgresql-16`
   - Windows: Download from postgresql.org

2. **Start PostgreSQL**
   ```bash
   # macOS
   brew services start postgresql@16

   # Ubuntu
   sudo systemctl start postgresql

   # Windows
   # Use Services application
   ```

3. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE cyberdocgen;

   # Create user (if needed)
   CREATE USER cyberdocgen_user WITH PASSWORD 'yourpassword';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE cyberdocgen TO cyberdocgen_user;

   # Exit
   \q
   ```

4. **Update DATABASE_URL in .env**
   ```bash
   DATABASE_URL=postgresql://cyberdocgen_user:yourpassword@localhost:5432/cyberdocgen
   ```

### Neon Serverless Setup

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for free account

2. **Create Project**
   - Create new project
   - Copy connection string

3. **Update DATABASE_URL**
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/cyberdocgen?sslmode=require
   ```

### Run Database Migrations

```bash
npm run db:push
```

This will create all tables and relationships defined in `shared/schema.ts`.

### Verify Database Setup

```bash
psql $DATABASE_URL

# List tables
\dt

# Should see tables like:
# - users
# - organizations
# - documents
# - companyProfiles
# - auditTrail
# etc.
```

## AI Services Configuration

### OpenAI Setup

1. **Create OpenAI Account**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in

2. **Generate API Key**
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Copy the key (shown only once)

3. **Add to .env**
   ```bash
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

4. **Set Up Billing**
   - Add payment method
   - Set usage limits if desired

### Anthropic Setup

1. **Create Anthropic Account**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in

2. **Generate API Key**
   - Navigate to API Keys
   - Create new key
   - Copy the key

3. **Add to .env**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

### Test AI Services

```bash
# Start server
npm run dev

# Test OpenAI (in another terminal)
curl http://localhost:5000/api/test/openai

# Test Anthropic
curl http://localhost:5000/api/ai/health
```

## Cloud Services Setup

### Google Cloud Storage (Optional)

1. **Create Google Cloud Project**
2. **Enable Cloud Storage API**
3. **Create Service Account**
4. **Download credentials JSON**
5. **Add to .env:**
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
   ```

### Google Drive Integration (Optional)

1. **Create OAuth 2.0 Credentials**
2. **Configure OAuth consent screen**
3. **Add to .env:**
   ```bash
   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-secret
   ```

### Microsoft OneDrive Integration (Optional)

1. **Register app in Azure Portal**
2. **Configure redirect URIs**
3. **Add to .env:**
   ```bash
   MICROSOFT_CLIENT_ID=your-client-id
   MICROSOFT_CLIENT_SECRET=your-secret
   ```

## Local Development

### Start Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server for frontend (with HMR)
- Start Express server for backend
- Watch for file changes
- Enable hot module replacement

### Access the Application

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **Metrics**: http://localhost:5000/metrics

### Development Workflow

1. **Make code changes**
2. **View changes instantly** (HMR)
3. **Check console** for errors
4. **Test API endpoints**
5. **Run tests**: `npm test`
6. **Type check**: `npm run check`

### Useful Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
npm run check        # TypeScript type checking
npm test             # Run tests
npm run db:push      # Apply database changes
```

## Production Setup

### Environment Configuration

1. **Create production .env**
   ```bash
   cp .env.example .env.production
   ```

2. **Set production values:**
   ```bash
   NODE_ENV=production
   DATABASE_URL=your-production-db-url
   SESSION_SECRET=strong-production-secret
   ENCRYPTION_KEY=production-encryption-key
   DATA_INTEGRITY_SECRET=production-data-integrity-secret
   OPENAI_API_KEY=production-openai-key
   ANTHROPIC_API_KEY=production-anthropic-key
   PORT=5000
   RATE_LIMIT_MAX=1000
   RATE_LIMIT_WINDOW_MS=900000
   LOG_LEVEL=warn
   ```

### Build for Production

```bash
npm run build
```

This creates:
- `/dist/public` - Frontend build (Vite)
- `/dist/index.js` - Backend build (esbuild)

### Run Production Server

```bash
npm start
```

Or:
```bash
NODE_ENV=production node dist/index.js
```

### Production Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Audit logging enabled

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Verification

### Verify Installation

```bash
# Check Node.js
node --version

# Check PostgreSQL
psql --version

# Check dependencies
npm list --depth=0

# Verify database connection
npm run db:push
```

### Health Checks

```bash
# System health
curl http://localhost:5000/health

# Database health
curl http://localhost:5000/health | jq .database

# AI services health
curl http://localhost:5000/api/ai/health
```

### Run Tests

```bash
npm test
```

Expected output:
```
 ✓ All tests passing
 ✓ No errors or warnings
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: Port 5000 already in use
# Solution: Change PORT in .env or kill process
lsof -ti:5000 | xargs kill -9
```

#### Database Connection Error

```bash
# Error: connect ECONNREFUSED
# Solution: Verify PostgreSQL is running
brew services start postgresql@16  # macOS
sudo systemctl start postgresql     # Linux
```

#### Missing Environment Variables

```bash
# Error: ENCRYPTION_KEY is not defined
# Applies to cloud/non-desktop server runs. Installed desktop mode auto-generates local secrets.
# Solution: Generate and add required values to .env
# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# DATA_INTEGRITY_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### OpenAI API Error

```bash
# Error: Invalid API key
# Solution: Verify key is correct and has credits
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

For more troubleshooting help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Next Steps

After completing the environment setup:

1. Review the [Development Guide](DEVELOPMENT_GUIDE.md)
2. Read the [API Documentation](API.md)
3. Check the [Architecture Overview](ARCHITECTURE.md)
4. Review [Security Guidelines](SECURITY.md)
5. Start developing!

## Getting Help

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [GitHub Issues](https://github.com/kherrera6219/cyberdocgen/issues)
- Read [Contributing Guide](../CONTRIBUTING.md)

---

**Need help?** Open an issue on GitHub or reach out to the maintainers.
