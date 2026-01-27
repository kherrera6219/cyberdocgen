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
    log(`Command successful: ${command}`, { output: output.slice(0, 500) + (output.length > 500 ? '...' : '') });
    return true;
  } catch (error) {
    log(`ERROR: Command failed: ${command}`, {
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString(),
      message: error.message
    });
    return false;
  }
}

async function verifyBuild() {
  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  log('=== STARTING COMPREHENSIVE BUILD VERIFICATION ===');

  // 1. Verify Environment
  log('Verifying environment...');
  log('NODE_ENV:', process.env.NODE_ENV);
  log('Project Root:', root);

  // 2. Verify Dependencies
  log('Checking critical dependencies...');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const criticalDeps = ['vite', 'esbuild', 'electron', 'electron-builder', 'axios', 'better-sqlite3'];
  
  for (const dep of criticalDeps) {
    const depPath = path.join(root, 'node_modules', dep);
    if (!fs.existsSync(depPath)) {
      log(`CRITICAL MISSING DEPENDENCY: ${dep} not found in node_modules`);
    } else {
      log(`Dependency OK: ${dep}`);
    }
  }

  // 3. Perform Build
  log('Starting Build Process...');
  if (!run('npm run build')) return;
  if (!run('npm run electron:build')) return;

  // 4. Verify Build Output
  log('Verifying build output...');
  const filesToVerify = [
    'dist/index.js',
    'dist/electron/main.js',
    'dist/public/index.html'
  ];

  for (const file of filesToVerify) {
    if (!fs.existsSync(path.join(root, file))) {
      log(`CRITICAL MISSING BUILD OUTPUT: ${file}`);
      return;
    } else {
      log(`Build output OK: ${file}`);
    }
  }

  // 5. Test Backend Startup in Isolation
  log('Testing backend server startup in isolation...');
  const serverProcess = spawn('node', ['dist/index.js'], {
    env: { ...process.env, NODE_ENV: 'production', DEPLOYMENT_MODE: 'local', PORT: '5231' },
    cwd: root
  });

  let serverStarted = false;
  const timeout = setTimeout(() => {
    if (!serverStarted) {
      log('ERROR: Backend server failed to start within 10 seconds in isolation.');
      serverProcess.kill();
    }
  }, 10000);

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('listening on port 5231')) {
      log('Backend server successfully started and listening on port 5231!');
      serverStarted = true;
      clearTimeout(timeout);
      
      // 6. Verify API Connectivity
      log('Verifying API connectivity...');
      run('curl -s http://localhost:5231/api/health || echo "Health check failed"');
      
      serverProcess.kill();
    }
  });

  serverProcess.stderr.on('data', (data) => {
    log('SERVER ERROR:', data.toString());
  });

  log('=== BUILD VERIFICATION COMPLETED ===');
  log(`Detailed report available at: ${logFile}`);
}

verifyBuild().catch(err => log('UNEXPECTED FAILURE', err));
