import fs from 'fs';
import path from 'path';
import { logger } from '../server/utils/logger';

async function validateWACK() {
  logger.info('Starting Windows packaging validation...');

  const rootDir = process.cwd();
  const builderConfigPath = path.join(rootDir, 'electron-builder.yml');
  const packageJsonPath = path.join(rootDir, 'package.json');

  let errors = 0;

  // 1. Check Electron Builder Config
  if (fs.existsSync(builderConfigPath)) {
    logger.info('✓ electron-builder.yml found');
    const config = fs.readFileSync(builderConfigPath, 'utf8');
    const configLower = config.toLowerCase();

    const hasMsixTarget =
      /target\s*:\s*msix/.test(configLower) || /-\s*msix\b/.test(configLower);
    const hasNsisTarget =
      /target\s*:\s*nsis/.test(configLower) || /-\s*nsis\b/.test(configLower);

    if (!hasMsixTarget && !hasNsisTarget) {
      logger.error('✗ No Windows installer target found (expected NSIS and/or MSIX)');
      errors++;
    }

    if (hasNsisTarget) {
      logger.info('✓ NSIS target configured (desktop installer path)');
    }

    if (hasMsixTarget) {
      logger.info('✓ MSIX target configured (store package path)');
      const hasIdentityName = /identityname\s*:/.test(configLower);
      const hasPublisher = /publisher\s*:/.test(configLower);
      if (hasIdentityName && hasPublisher) {
        logger.info('✓ MSIX identity metadata configured');
      } else {
        logger.error('✗ MSIX target present but identityName/publisher missing');
        errors++;
      }
    } else {
      logger.info('i MSIX target not configured (acceptable for NSIS-only distribution)');
    }
  } else {
    logger.error('✗ electron-builder.yml missing');
    errors++;
  }

  // 2. Check Package.json for Electron
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.devDependencies?.electron || packageJson.dependencies?.electron) {
    logger.info('✓ Electron dependency found');
  } else {
    logger.error('✗ Electron dependency missing in package.json');
    errors++;
  }

  if (packageJson.main === 'dist/electron/main.js') {
    logger.info('✓ Package.json "main" points to Electron entry');
  } else {
    logger.warn('! Package.json "main" does not point to dist/electron/main.js');
  }

  const hasWindowsBuildScript =
    typeof packageJson.scripts?.['build:win'] === 'string' &&
    packageJson.scripts['build:win'].includes('electron-builder');
  if (hasWindowsBuildScript) {
    logger.info('✓ Windows build script configured (build:win)');
  } else {
    logger.error('✗ Missing or invalid "build:win" script in package.json');
    errors++;
  }

  // 3. Check for static assets (icons)
  const windowsIconPath = path.join(rootDir, 'build', 'icon.ico');
  if (fs.existsSync(windowsIconPath)) {
    logger.info('✓ Windows installer icon found (build/icon.ico)');
  } else {
    logger.error('✗ Windows installer icon missing in build/icon.ico');
    errors++;
  }

  const faviconPath = path.join(rootDir, 'public', 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    logger.info('✓ Web favicon found (public/favicon.ico)');
  } else {
    logger.warn('! Web favicon missing in public/favicon.ico');
  }

  if (errors > 0) {
    logger.error(`Windows packaging validation failed with ${errors} errors.`);
    process.exit(1);
  }

  logger.info('✓ Windows packaging validation passed.');
}

validateWACK().catch(err => {
  logger.error('Windows packaging validation error:', err);
  process.exit(1);
});
