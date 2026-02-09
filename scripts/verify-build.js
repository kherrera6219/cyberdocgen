import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const logFile = path.join(root, 'build-verification.log');

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  console.log(entry);
  fs.appendFileSync(logFile, entry);
}

function run(command, cwd = root) {
  log(`Running command: ${command}`);
  try {
    const output = execSync(command, { cwd, stdio: 'pipe' }).toString();
    log(`Command successful: ${command}`, {
      output: output.slice(0, 500) + (output.length > 500 ? '...' : ''),
    });
    return true;
  } catch (error) {
    log(`ERROR: Command failed: ${command}`, {
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString(),
      message: error.message,
    });
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, serverProcess, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      log('ERROR: Server exited before health checks completed', {
        exitCode: serverProcess.exitCode,
      });
      return false;
    }

    try {
      const response = await globalThis.fetch(url);
      if (response.ok) {
        log(`Health probe passed: ${url}`);
        return true;
      }
      log(`Health probe returned non-200 for ${url}`, { status: response.status });
    } catch {
      // Server may still be starting up.
    }

    await sleep(500);
  }

  log(`ERROR: Timed out waiting for health probe: ${url}`);
  return false;
}

async function shutdownProcess(child) {
  if (child.exitCode !== null) return;

  child.kill();
  const deadline = Date.now() + 5000;
  while (child.exitCode === null && Date.now() < deadline) {
    await sleep(100);
  }

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

async function verifyBuild() {
  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  log('=== STARTING COMPREHENSIVE BUILD VERIFICATION ===');

  let hasFailure = false;

  // 1. Verify Environment
  log('Verifying environment...');
  log('NODE_ENV:', process.env.NODE_ENV);
  log('Project Root:', root);

  // 2. Verify Dependencies
  log('Checking critical dependencies...');
  const criticalDeps = ['vite', 'esbuild', 'electron', 'electron-builder', 'axios', 'better-sqlite3'];

  for (const dep of criticalDeps) {
    const depPath = path.join(root, 'node_modules', dep);
    if (!fs.existsSync(depPath)) {
      hasFailure = true;
      log(`CRITICAL MISSING DEPENDENCY: ${dep} not found in node_modules`);
    } else {
      log(`Dependency OK: ${dep}`);
    }
  }

  // 3. Perform Build
  log('Starting build process...');
  if (!run('npm run build')) hasFailure = true;
  if (!run('npm run electron:build')) hasFailure = true;

  // 4. Verify Build Output
  log('Verifying build output...');
  const filesToVerify = ['dist/index.cjs', 'dist/electron/main.js', 'dist/public/index.html'];

  for (const file of filesToVerify) {
    if (!fs.existsSync(path.join(root, file))) {
      hasFailure = true;
      log(`CRITICAL MISSING BUILD OUTPUT: ${file}`);
    } else {
      log(`Build output OK: ${file}`);
    }
  }

  // 5. Test Backend Startup in Isolation
  log('Testing backend server startup in isolation...');
  const serverProcess = spawn('node', ['dist/index.cjs'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DEPLOYMENT_MODE: 'local',
      LOCAL_PORT: '5231',
      PORT: '5231',
      SESSION_SECRET: process.env.SESSION_SECRET || 'local-build-verification-secret-32+',
      ENABLE_TEMP_AUTH: process.env.ENABLE_TEMP_AUTH || 'true',
    },
    cwd: root,
  });

  serverProcess.stdout.on('data', (data) => {
    log('SERVER STDOUT:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    log('SERVER STDERR:', data.toString());
  });

  const liveOk = await waitForHttp('http://127.0.0.1:5231/live', serverProcess, 20000);
  const readyOk = await waitForHttp('http://127.0.0.1:5231/ready', serverProcess, 20000);

  if (!liveOk || !readyOk) {
    hasFailure = true;
    log('ERROR: Backend server health checks failed in isolation.');
  } else {
    log('Backend server successfully started and passed /live and /ready checks.');
  }

  await shutdownProcess(serverProcess);

  if (hasFailure) {
    log('=== BUILD VERIFICATION FAILED ===');
    process.exitCode = 1;
  } else {
    log('=== BUILD VERIFICATION COMPLETED SUCCESSFULLY ===');
  }

  log(`Detailed report available at: ${logFile}`);
}

verifyBuild().catch((err) => {
  log('UNEXPECTED FAILURE', { message: err?.message, stack: err?.stack });
  process.exitCode = 1;
});
