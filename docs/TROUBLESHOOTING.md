# Troubleshooting Guide

Common issues and solutions for CyberDocGen development and deployment.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Server Issues](#server-issues)
- [Frontend Issues](#frontend-issues)
- [AI Service Issues](#ai-service-issues)
- [Authentication Issues](#authentication-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Getting Help](#getting-help)

## Installation Issues

### npm install fails

**Symptom:**
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

1. **Clear cache and retry:**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Use legacy peer deps:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Update Node.js:**
   ```bash
   node --version  # Should be 20.x or higher
   nvm install 20
   nvm use 20
   ```

4. **Check for conflicting packages:**
   ```bash
   npm ls  # Look for duplicate or conflicting versions
   ```

### Native module compilation errors

**Symptom:**
```bash
gyp ERR! build error
gyp ERR! stack Error: `make` failed with exit code: 2
```

**Solutions:**

1. **Install build tools:**
   ```bash
   # macOS
   xcode-select --install

   # Ubuntu/Debian
   sudo apt-get install build-essential python3

   # Windows
   npm install --global windows-build-tools
   ```

2. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

### Permission errors

**Symptom:**
```bash
EACCES: permission denied
```

**Solutions:**

1. **Don't use sudo with npm:**
   ```bash
   # Bad
   sudo npm install

   # Good - fix npm permissions
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   ```

2. **Fix node_modules permissions:**
   ```bash
   sudo chown -R $(whoami) node_modules
   ```

## Database Issues

### Cannot connect to PostgreSQL

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # macOS
   brew services list
   brew services start postgresql@16

   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql

   # Check process
   ps aux | grep postgres
   ```

2. **Verify DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:5432/dbname
   ```

3. **Test connection:**
   ```bash
   psql $DATABASE_URL
   ```

4. **Check PostgreSQL logs:**
   ```bash
   # macOS
   tail -f /usr/local/var/log/postgresql@16.log

   # Linux
   sudo tail -f /var/log/postgresql/postgresql-16-main.log
   ```

### Database migrations fail

**Symptom:**
```
Error: relation "users" does not exist
```

**Solutions:**

1. **Run migrations:**
   ```bash
   npm run db:push
   ```

2. **Reset database (development only):**
   ```bash
   psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   npm run db:push
   ```

3. **Check Drizzle configuration:**
   ```bash
   cat drizzle.config.ts
   ```

### SSL connection errors (Neon)

**Symptom:**
```
Error: no pg_hba.conf entry for host
```

**Solution:**

Add `?sslmode=require` to DATABASE_URL:
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Too many connections

**Symptom:**
```
Error: sorry, too many clients already
```

**Solutions:**

1. **Close unused connections:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'cyberdocgen'
     AND pid <> pg_backend_pid();
   ```

2. **Increase max connections in PostgreSQL:**
   ```bash
   # Edit postgresql.conf
   max_connections = 200
   ```

3. **Use connection pooling:**
   ```typescript
   // Already configured in server/db.ts
   // Check pool size settings
   ```

## Server Issues

### Environment validation fails on startup

**Symptom:**
```
Environment validation failed
DATABASE_URL: Required
SESSION_SECRET must be at least 32 characters
```

**Why it happens:**

- Cloud mode is default when `DEPLOYMENT_MODE` is not set.
- Cloud mode requires `DATABASE_URL`.
- All modes require a strong `SESSION_SECRET` (32+ characters).

**Solutions:**

1. **Run local mode explicitly for offline/dev:**
   ```bash
   DEPLOYMENT_MODE=local
   SESSION_SECRET=replace-with-at-least-32-characters
   ENABLE_TEMP_AUTH=true
   npm run dev
   ```

2. **Run cloud mode with database configured:**
   ```bash
   DEPLOYMENT_MODE=cloud
   DATABASE_URL=postgresql://...
   SESSION_SECRET=replace-with-at-least-32-characters
   npm run dev
   ```

### Port already in use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

1. **Kill process using port:**
   ```bash
   # Find process
   lsof -ti:5000

   # Kill process
   lsof -ti:5000 | xargs kill -9

   # Or change port in .env
   PORT=3000
   ```

2. **Check for other instances:**
   ```bash
   ps aux | grep node
   pkill -f "node.*index"
   ```

### Server crashes on startup

**Symptom:**
```
TypeError: Cannot read property 'x' of undefined
```

**Solutions:**

1. **Check environment variables:**
   ```bash
   # List all required vars
   grep -v '^#' .env.example

   # Verify your .env
   cat .env
   ```

2. **Check for missing dependencies:**
   ```bash
   npm install
   ```

3. **Check logs:**
   ```bash
   NODE_ENV=development npm run dev
   # Look for detailed error messages
   ```

4. **Verify database connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Memory issues

**Symptom:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node.js memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Check for memory leaks:**
   ```bash
   node --inspect dist/index.js
   # Use Chrome DevTools to profile
   ```

### High CPU usage

**Solutions:**

1. **Profile the application:**
   ```bash
   node --prof dist/index.js
   ```

2. **Check for infinite loops:**
   - Review recent code changes
   - Check scheduled tasks

3. **Optimize database queries:**
   ```bash
   # Enable query logging
   LOG_LEVEL=debug npm start
   ```

## Frontend Issues

### Blank page / White screen

**Symptom:**
Browser shows blank page with no errors.

**Solutions:**

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors

2. **Clear browser cache:**
   ```bash
   # Or use Ctrl+Shift+R to hard refresh
   ```

3. **Check Vite build:**
   ```bash
   rm -rf dist
   npm run build
   ```

4. **Verify API connection:**
   ```javascript
   // In browser console
   fetch('/api/health').then(r => r.json()).then(console.log)
   ```

### Vite dev server errors

**Symptom:**
```
Error: Failed to resolve import
```

**Solutions:**

1. **Check import paths:**
   ```typescript
   // Use aliases defined in vite.config.ts
   import { ... } from '@/components/...'  // ✅
   import { ... } from '../../../components/...'  // ❌
   ```

2. **Restart dev server:**
   ```bash
   # Kill and restart
   pkill -f vite
   npm run dev
   ```

3. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Hot module replacement not working

**Solutions:**

1. **Check file watchers limit (Linux):**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart Vite:**
   ```bash
   pkill -f vite && npm run dev
   ```

### React component errors

**Symptom:**
```
Error: Cannot read property 'map' of undefined
```

**Solutions:**

1. **Add null checks:**
   ```typescript
   {data?.map(item => ...)}  // ✅
   {data.map(item => ...)}   // ❌ May fail if data is undefined
   ```

2. **Use loading states:**
   ```typescript
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorMessage />;
   ```

3. **Check React Query setup:**
   ```typescript
   // Verify QueryClientProvider wraps app
   ```

## AI Service Issues

### OpenAI API errors

**Symptom:**
```
Error: Invalid API key
```

**Solutions:**

1. **Verify API key:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **Check API key format:**
   - Should start with `sk-proj-` or `sk-`
   - No extra spaces or quotes

3. **Verify billing:**
   - Check [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
   - Ensure credits are available

### Rate limit errors

**Symptom:**
```
Error: Rate limit exceeded
```

**Solutions:**

1. **Implement retry logic:**
   ```typescript
   // Already implemented in server/services/aiOrchestrator.ts
   ```

2. **Increase rate limits:**
   - Upgrade OpenAI plan
   - Request limit increase

3. **Use exponential backoff:**
   ```typescript
   // Built into AI orchestrator
   ```

### Anthropic Claude errors

**Symptom:**
```
Error: Invalid request
```

**Solutions:**

1. **Check API version:**
   ```typescript
   // Verify using latest SDK version
   "@anthropic-ai/sdk": "^0.70.1"
   ```

2. **Validate request format:**
   - Check message structure
   - Verify model name

3. **Test API key:**
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01"
   ```

### AI responses timeout

**Solutions:**

1. **Increase timeout:**
   ```typescript
   // In AI service configuration
   timeout: 60000  // 60 seconds
   ```

2. **Use streaming:**
   ```typescript
   // Enable streaming for long responses
   stream: true
   ```

## Authentication Issues

### Sessions not persisting

**Symptom:**
User logged out after page refresh.

**Solutions:**

1. **Check SESSION_SECRET:**
   ```bash
   # Must be set and >= 32 characters
   echo $SESSION_SECRET | wc -c
   ```

2. **Verify session store:**
   ```typescript
   // Check PostgreSQL session store in server/index.ts
   ```

3. **Check cookie settings:**
   ```typescript
   cookie: {
     secure: process.env.NODE_ENV === 'production',
     httpOnly: true,
     maxAge: 24 * 60 * 60 * 1000  // 24 hours
   }
   ```

4. **Clear browser cookies:**
   - DevTools > Application > Cookies > Clear

### MFA setup fails

**Symptom:**
```
Error: Invalid TOTP token
```

**Solutions:**

1. **Synchronize system time:**
   ```bash
   # macOS
   sudo sntp -sS time.apple.com

   # Linux
   sudo ntpdate -s time.nist.gov
   ```

2. **Check token generation:**
   - Verify 6-digit code
   - Ensure using correct secret

3. **Verify QR code:**
   - Scan with authenticator app
   - Check secret matches

### Password hash errors

**Symptom:**
```
Error: Illegal arguments: string, undefined
```

**Solutions:**

1. **Check bcrypt installation:**
   ```bash
   npm install bcrypt
   ```

2. **Verify password field:**
   - Not null
   - Proper string type

## Build and Deployment Issues

### Build fails

**Symptom:**
```
Error: Build failed with X errors
```

**Solutions:**

1. **Type check:**
   ```bash
   npm run check
   # Fix all TypeScript errors
   ```

2. **Clear build cache:**
   ```bash
   rm -rf dist node_modules/.vite
   npm install
   npm run build
   ```

3. **Check for circular dependencies:**
   ```bash
   npx madge --circular --extensions ts,tsx ./
   ```

### Windows desktop startup error: backend exited with code 1

**Symptom:**
```text
Startup Error: The application backend failed to start.
Detail: Backend server process exited unexpectedly during startup (exit code 1).
```

**Common causes:**
- Native SQLite module ABI mismatch (`better-sqlite3` built for Node ABI instead of Electron ABI).
- Missing local runtime secrets in production desktop mode (older builds).

**Solutions:**

1. **Rebuild Electron native modules and repackage:**
   ```bash
   npm run electron:rebuild-native
   npm run electron:install-app-deps
   npm run build:win
   ```

2. **Ensure no running `CyberDocGen.exe` process is locking native binaries before rebuild.**

3. **Inspect startup logs for root cause:**
   ```text
   %APPDATA%\Roaming\rest-express\logs\startup.log
   ```

4. **For installed desktop builds, verify local bootstrap secrets exist:**
   ```text
   %APPDATA%\Roaming\rest-express\security\backend-secrets.json
   ```

### Docker build fails with missing `scripts/build-server.js`

**Symptom:**
```bash
Error: Cannot find module '/app/scripts/build-server.js'
```

**Why it happens:**

- `npm run build` calls `node scripts/build-server.js`.
- Docker context excluded `scripts/` via `.dockerignore`.

**Solutions:**

1. **Keep build scripts in Docker context:**
   ```bash
   # Ensure .dockerignore does not exclude scripts/
   cat .dockerignore
   ```

2. **Rebuild Docker image from clean context:**
   ```bash
   docker build --no-cache -t cyberdocgen .
   ```

### `npm ci --only=production` fails in Docker due Husky

**Symptom:**
```bash
sh: husky: not found
npm ERR! command failed
```

**Why it happens:**

- `prepare` runs during install.
- Production-only installs omit devDependencies, so `husky` binary is unavailable.

**Solutions:**

1. **Use a guard in `prepare` script** (already implemented in this project):
   ```bash
   npm pkg get scripts.prepare
   ```

2. **If you customize scripts, keep `prepare` no-op safe when Husky is absent.**

### Production server errors

**Symptom:**
App works in dev but fails in production.

**Solutions:**

1. **Check environment:**
   ```bash
   NODE_ENV=production
   ```

2. **Verify all env vars set:**
   ```bash
   # Compare with .env.example
   diff <(grep -v '^#' .env.example | cut -d= -f1 | sort) \
        <(grep -v '^#' .env | cut -d= -f1 | sort)
   ```

3. **Test production build locally:**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

4. **Check logs:**
   ```bash
   # Enable verbose logging
   LOG_LEVEL=debug npm start
   ```

### Static files not loading

**Symptom:**
404 errors for CSS/JS files.

**Solutions:**

1. **Verify build output:**
   ```bash
   ls -la dist/public/
   ```

2. **Check static file serving:**
   ```typescript
   // Verify in server/index.ts
   app.use(express.static('dist/public'));
   ```

3. **Check build configuration:**
   ```bash
   cat vite.config.ts
   # Verify outDir: 'dist/public'
   ```

## Performance Issues

### Slow API responses

**Solutions:**

1. **Enable query logging:**
   ```bash
   LOG_LEVEL=debug npm start
   # Look for slow queries
   ```

2. **Add database indexes:**
   ```sql
   CREATE INDEX idx_documents_user ON documents(user_id);
   CREATE INDEX idx_documents_created ON documents(created_at);
   ```

3. **Use connection pooling:**
   ```typescript
   // Verify pool configuration in server/db.ts
   ```

4. **Profile queries:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM documents WHERE user_id = 1;
   ```

### High memory usage

**Solutions:**

1. **Monitor memory:**
   ```bash
   node --expose-gc --trace-gc dist/index.js
   ```

2. **Check for memory leaks:**
   - Profile with Chrome DevTools
   - Review event listeners
   - Check for unclosed connections

3. **Optimize queries:**
   - Use pagination
   - Limit result sets
   - Add indexes

## Security Issues

### CORS errors

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Configure CORS:**
   ```typescript
   // In server/index.ts
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

2. **Check allowed origins:**
   ```bash
   # Verify FRONTEND_URL in .env
   ```

### CSP violations

**Symptom:**
```
Refused to load script because it violates CSP directive
```

**Solutions:**

1. **Update CSP headers:**
   ```typescript
   // In server/middleware/security.ts
   ```

2. **Check for inline scripts:**
   - Move to external files
   - Add nonce to allowed scripts

### Rate limit errors

**Symptom:**
```
Error: Too many requests
```

**Solutions:**

1. **Adjust rate limits:**
   ```bash
   RATE_LIMIT_MAX=2000
   RATE_LIMIT_WINDOW_MS=900000
   ```

2. **Whitelist IPs:**
   ```typescript
   // Add to rate limit configuration
   skip: (req) => whitelist.includes(req.ip)
   ```

## Getting Help

### Before asking for help

1. **Check existing documentation:**
   - [README.md](../README.md)
   - [API Documentation](API.md)
   - [Development Guide](DEVELOPMENT_GUIDE.md)

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/kherrera6219/cyberdocgen/issues)

3. **Reproduce the issue:**
   - Minimal reproduction
   - Step-by-step instructions
   - Expected vs actual behavior

### How to report an issue

Include:

1. **Environment:**
   ```
   - OS: macOS 13.2
   - Node: 20.11.0
   - npm: 10.2.4
   - PostgreSQL: 16.1
   ```

2. **Steps to reproduce:**
   ```
   1. Run npm install
   2. Start server with npm run dev
   3. Navigate to /documents
   4. Error appears
   ```

3. **Error messages:**
   ```
   Full error stack trace
   Console output
   ```

4. **What you've tried:**
   - Solutions attempted
   - Results of each attempt

### Useful debugging commands

```bash
# System info
node --version
npm --version
psql --version

# Check environment
env | grep -E 'DATABASE_URL|NODE_ENV|PORT'

# Test database
psql $DATABASE_URL -c "SELECT version()"

# Test API
curl http://localhost:5000/health | jq

# Check logs
tail -f logs/app.log

# Profile performance
node --prof dist/index.js

# Memory usage
node --expose-gc --trace-gc dist/index.js
```

### Emergency recovery

If everything is broken:

```bash
# Nuclear option - start fresh
git status  # Save any important changes first
git stash
rm -rf node_modules dist .env
cp .env.example .env
# Edit .env with your values
npm install
npm run db:push
npm run dev
```

---

**Still stuck?** Open an issue on [GitHub](https://github.com/kherrera6219/cyberdocgen/issues) with:
- Clear description of the problem
- Steps to reproduce
- Environment details
- What you've tried

The community is here to help!
