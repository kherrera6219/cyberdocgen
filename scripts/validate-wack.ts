import fs from 'fs';
import path from 'path';
import { logger } from '../server/utils/logger';

function getYamlScalarValue(configLower: string, key: string): string | null {
  for (const rawLine of configLower.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) {
      continue;
    }

    const lineKey = line.slice(0, colonIndex).trim();
    if (lineKey !== key) {
      continue;
    }

    return line.slice(colonIndex + 1).trim();
  }

  return null;
}

function normalizeYamlScalar(value: string | null): string | null {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function hasYamlBoolean(configLower: string, key: string, expected: boolean): boolean {
  const value = normalizeYamlScalar(getYamlScalarValue(configLower, key));
  return value === String(expected);
}

function hasYamlValue(configLower: string, key: string, expectedValues: string[]): boolean {
  const value = normalizeYamlScalar(getYamlScalarValue(configLower, key));
  if (!value) {
    return false;
  }

  return expectedValues.includes(value);
}

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
      const forceCodeSigningEnabled = hasYamlBoolean(configLower, 'forcecodesigning', true);
      const hasCodeSigningMaterial = Boolean(
        process.env.CSC_LINK
        || process.env.WIN_CSC_LINK
        || process.env.CSC_NAME
      );

      const nsisChecks: Array<{ ok: boolean; pass: string; fail: string }> = [
        {
          ok: hasYamlBoolean(configLower, 'oneclick', false),
          pass: '✓ NSIS assisted installer enabled (oneClick: false)',
          fail: '✗ NSIS must set oneClick: false to provide a standard guided installer with progress pages',
        },
        {
          ok: hasYamlBoolean(configLower, 'allowtochangeinstallationdirectory', true),
          pass: '✓ Install directory chooser enabled (allowToChangeInstallationDirectory: true)',
          fail: '✗ NSIS must allow install directory selection (allowToChangeInstallationDirectory: true)',
        },
        {
          ok: hasYamlBoolean(configLower, 'createdesktopshortcut', true),
          pass: '✓ Desktop shortcut creation enabled',
          fail: '✗ NSIS should enable desktop shortcut creation (createDesktopShortcut: true)',
        },
        {
          ok: hasYamlBoolean(configLower, 'createstartmenushortcut', true),
          pass: '✓ Start menu shortcut creation enabled',
          fail: '✗ NSIS should enable Start menu shortcut creation (createStartMenuShortcut: true)',
        },
        {
          ok: hasYamlBoolean(configLower, 'allowelevation', true),
          pass: '✓ Elevation support enabled for installer compatibility',
          fail: '✗ NSIS should enable elevation support (allowElevation: true)',
        },
        {
          ok: hasYamlBoolean(configLower, 'runafterfinish', true),
          pass: '✓ Run-after-finish enabled',
          fail: '✗ NSIS should enable runAfterFinish: true for expected installer UX',
        },
        {
          ok: hasYamlValue(configLower, 'include', ['build/installer.nsh', 'build\\installer.nsh']),
          pass: '✓ Custom NSIS script include configured (build/installer.nsh)',
          fail: '✗ NSIS must include build/installer.nsh for custom install/uninstall messaging',
        },
        {
          ok: hasYamlValue(configLower, 'artifactname', ['${productname}-setup-${version}.${ext}']),
          pass: '✓ Versioned installer artifact naming configured',
          fail: '✗ NSIS artifactName should be versioned (e.g., ${productName}-Setup-${version}.${ext})',
        },
      ];

      for (const check of nsisChecks) {
        if (check.ok) {
          logger.info(check.pass);
        } else {
          logger.error(check.fail);
          errors++;
        }
      }

      const installerScriptPath = path.join(rootDir, 'build', 'installer.nsh');
      if (fs.existsSync(installerScriptPath)) {
        logger.info('✓ Custom NSIS script found (build/installer.nsh)');
        const installerScript = fs.readFileSync(installerScriptPath, 'utf8').toLowerCase();

        const installerChecks: Array<{ ok: boolean; pass: string; fail: string }> = [
          {
            ok: /!macro\s+custominstall\b/.test(installerScript),
            pass: '✓ customInstall macro defined',
            fail: '✗ Missing !macro customInstall in build/installer.nsh',
          },
          {
            ok: /!macro\s+customuninstall\b/.test(installerScript),
            pass: '✓ customUnInstall macro defined',
            fail: '✗ Missing !macro customUnInstall in build/installer.nsh',
          },
          {
            ok: installerScript.includes('installation is complete'),
            pass: '✓ Install completion notification message present',
            fail: '✗ Missing explicit install completion notification message',
          },
          {
            ok: installerScript.includes('has been uninstalled successfully'),
            pass: '✓ Uninstall completion notification message present',
            fail: '✗ Missing explicit uninstall completion notification message',
          },
          {
            ok:
              installerScript.includes('do you want to completely remove all cyberdocgen application data') &&
              installerScript.includes('rmdir /r "$appdata\\cyberdocgen"') &&
              installerScript.includes('rmdir /r "$localappdata\\cyberdocgen"'),
            pass: '✓ Uninstall data retention/removal prompt present',
            fail: '✗ Missing data retention/removal logic in uninstall flow',
          },
        ];

        for (const check of installerChecks) {
          if (check.ok) {
            logger.info(check.pass);
          } else {
            logger.error(check.fail);
            errors++;
          }
        }
      } else {
        logger.error('✗ Missing build/installer.nsh custom NSIS script');
        errors++;
      }

      if (process.env.RELEASE_BUILD === 'true') {
        if (forceCodeSigningEnabled || hasCodeSigningMaterial) {
          logger.info('✓ Release validation: code-signing enforcement/material is configured');
        } else {
          logger.error('✗ Release validation: forceCodeSigning must be true or signing credentials must be provided when RELEASE_BUILD=true');
          errors++;
        }
      } else if (!forceCodeSigningEnabled) {
        logger.warn('! forceCodeSigning is disabled (acceptable for local/dev builds, not for signed releases)');
      }
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
