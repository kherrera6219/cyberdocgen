import fs from 'fs';
import path from 'path';
import { logger } from '../server/utils/logger';

async function validateWACK() {
  logger.info('Starting WACK Compliance Validation...');

  const rootDir = process.cwd();
  const builderConfigPath = path.join(rootDir, 'electron-builder.yml');
  const packageJsonPath = path.join(rootDir, 'package.json');

  let errors = 0;

  // 1. Check Electron Builder Config
  if (fs.existsSync(builderConfigPath)) {
    logger.info('✓ electron-builder.yml found');
    const config = fs.readFileSync(builderConfigPath, 'utf8');
    
    if (config.includes('target: msix') || config.includes('- msix')) {
      logger.info('✓ MSIX target configured');
    } else {
      logger.error('✗ MSIX target missing in electron-builder.yml');
      errors++;
    }

    if (config.includes('identityName') && config.includes('publisher')) {
      logger.info('✓ MSIX Identity and Publisher configured');
    } else {
      logger.error('✗ MSIX Identity or Publisher missing');
      errors++;
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

  // 3. Check for static assets (icons)
  const iconPath = path.join(rootDir, 'public', 'favicon.ico');
  if (fs.existsSync(iconPath)) {
    logger.info('✓ App icons found');
  } else {
    logger.error('✗ App icons missing in public/favicon.ico');
    errors++;
  }

  if (errors > 0) {
    logger.error(`WACK validation failed with ${errors} errors.`);
    process.exit(1);
  }

  logger.info('✓ WACK Pre-certification Validation Passed!');
}

validateWACK().catch(err => {
  logger.error('WACK validation error:', err);
  process.exit(1);
});
