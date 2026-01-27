import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const logFile = path.join(root, 'diagnostic-report.log');

// Clear previous log
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}${data ? '\n' + (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : ''}\n`;
  console.log(entry);
  fs.appendFileSync(logFile, entry);
}

function run(command, cwd = root, ignoreError = false) {
  log(`EXECUTING: ${command}`);
  try {
    const output = execSync(command, { cwd, stdio: 'pipe' }).toString();
    log(`SUCCESS: ${command}`, output.slice(0, 1000));
    return true;
  } catch (error) {
    const errLog = {
      message: error.message,
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString()
    };
    log(`FAILURE: ${command}`, errLog);
    if (!ignoreError) throw new Error(`Command failed: ${command}`);
    return false;
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function diagnostic() {
  log('=== CYBERDOCGEN DIAGNOSTIC BUILD SYSTEM ===');
  
  try {
    // 1. Dependency Audit
    log('--- STEP 1: DEPENDENCY AUDIT ---');
    if (!fs.existsSync(path.join(root, 'node_modules'))) {
      log('CRITICAL: node_modules missing. Attempting restoration...');
      run('npm install');
    }
    
    const criticalPackages = ['vite', 'electron', 'esbuild', 'better-sqlite3', 'axios', 'electron-builder'];
    criticalPackages.forEach(pkg => {
      const pkgPath = path.join(root, 'node_modules', pkg);
      if (!fs.existsSync(pkgPath)) {
        log(`MISSING CRITICAL PACKAGE: ${pkg}`);
      } else {
        log(`Package Verified: ${pkg}`);
      }
    });

    // 2. Build Pipeline
    log('--- STEP 2: BUILD PIPELINE ---');
    run('npm run build'); // Vite + Server
    run('npm run electron:build'); // Electron Main/Preload

    // 3. Artifact Verification
    log('--- STEP 3: ARTIFACT VERIFICATION ---');
    const artifacts = [
      'dist/index.js',
      'dist/electron/main.js',
      'dist/public/index.html',
      'dist/public/favicon.ico'
    ];
    artifacts.forEach(art => {
      if (!fs.existsSync(path.join(root, art))) {
        log(`MISSING ARTIFACT: ${art}`);
      } else {
        log(`Artifact Verified: ${art}`);
      }
    });

    // 4. Runtime Simulation (Isolated Backend)
    log('--- STEP 4: RUNTIME SIMULATION ---');
    log('Starting backend server in diagnostic mode...');
    
    // Use the compiled server
    const server = spawn('node', ['dist/index.js'], {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DEPLOYMENT_MODE: 'local',
        PORT: '5231',
        SKIP_TELEMETRY: 'true' // Don't block on telemetry if it fails in this env
      },
      stdio: 'pipe'
    });

    let serverHealth = false;
    
    const timeout = setTimeout(() => {
      if (!serverHealth) {
        log('CRITICAL: Server failed to reach healthy state within 15 seconds.');
        server.kill();
      }
    }, 15000);

    server.stdout.on('data', (data) => {
      const msg = data.toString();
      log(`[SERVER-OUT] ${msg}`);
      if (msg.includes('listening on port 5231')) {
        log('Server reported listening state.');
      }
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString();
      log(`[SERVER-ERR] ${msg}`);
      // Special check for native module mismatch
      if (msg.includes('ERR_DLOPEN_FAILED')) {
        log('EXPECTED WARNING: Native module ABI mismatch detected in Node environment. This is normal for Electron-built modules run in system Node.');
      }
    });

    // Wait and check health endpoint
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if (await checkPort(5231)) {
            log('HEALTH CHECK PASSED: API is responsive on port 5231.');
            serverHealth = true;
            break;
        }
    }

    server.kill();
    clearTimeout(timeout);

    // 5. Existing Tests Integration
    log('--- STEP 5: REGRESSION TESTING ---');
    log('Running core API integration tests...');
    run('npx vitest tests/integration/api.test.ts --run', root, true);

    log('--- DIAGNOSTIC COMPLETE ---');
    log(`Full report saved to: ${logFile}`);

  } catch (error) {
    log('DIAGNOSTIC CRASHED', error.message);
  }
}

diagnostic();
