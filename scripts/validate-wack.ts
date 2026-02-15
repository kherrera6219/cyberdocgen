import fs from 'fs';
import path from 'path';
import { logger } from '../server/utils/logger';

type ValidationCheck = {
  ok: boolean;
  pass: string;
  fail: string;
};

function getYamlScalarValue(configText: string, key: string): string | null {
  const normalizedKey = key.toLowerCase();
  for (const rawLine of configText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) {
      continue;
    }

    const lineKey = line.slice(0, colonIndex).trim().toLowerCase();
    if (lineKey !== normalizedKey) {
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

function hasYamlBoolean(configText: string, key: string, expected: boolean): boolean {
  const value = normalizeYamlScalar(getYamlScalarValue(configText, key));
  return value?.toLowerCase() === String(expected);
}

function fileContainsAll(filePath: string, patterns: string[]): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
  return patterns.every(pattern => content.includes(pattern.toLowerCase()));
}

function isEnabledFlag(name: string): boolean {
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[name];
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function isSemver(version: string): boolean {
  // eslint-disable-next-line security/detect-unsafe-regex
  return /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i.test(version);
}

function getEnvValueInsensitive(name: string): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  const direct = process.env[name];
  if (typeof direct === 'string') {
    return direct;
  }

  const upper = process.env[name.toUpperCase()];
  if (typeof upper === 'string') {
    return upper;
  }

  const lower = process.env[name.toLowerCase()];
  if (typeof lower === 'string') {
    return lower;
  }

  return undefined;
}

function extractEnvReferences(value: string | null): string[] {
  if (!value) {
    return [];
  }

  const refs = new Set<string>();
  const pattern = /\$\{env\.([a-z0-9_]+)\}/gi;
  let match: RegExpExecArray | null = pattern.exec(value);
  while (match) {
    refs.add(match[1]);
    match = pattern.exec(value);
  }

  return Array.from(refs);
}

function resolveEnvReferences(value: string): string {
  return value.replace(/\$\{env\.([a-z0-9_]+)\}/gi, (_full, envName: string) => {
    return getEnvValueInsensitive(envName) ?? '';
  });
}

async function validateWACK() {
  logger.info('Starting Windows packaging validation...');

  let errors = 0;

  const storeSubmissionMode = isEnabledFlag('WINDOWS_STORE_SUBMISSION');
  const requiredStoreEnvNames = [
    'WINDOWS_STORE_IDENTITY_NAME',
    'WINDOWS_STORE_PUBLISHER',
    'WINDOWS_STORE_PUBLISHER_DISPLAY_NAME',
  ];
  if (storeSubmissionMode) {
    logger.info('i Store submission mode enabled (WINDOWS_STORE_SUBMISSION=true)');
    for (const envName of requiredStoreEnvNames) {
      const envValue = getEnvValueInsensitive(envName);
      if (!envValue || envValue.trim().length === 0) {
        logger.error(`✗ Store submission mode requires environment variable ${envName}`);
        errors++;
      } else {
        logger.info(`✓ Store submission environment variable set: ${envName}`);
      }
    }
  }

  const rootDir = process.cwd();
  const builderConfigPath = path.join(rootDir, 'electron-builder.yml');
  const packageJsonPath = path.join(rootDir, 'package.json');

  // 1. Check Electron Builder Config
  if (fs.existsSync(builderConfigPath)) {
    logger.info('✓ electron-builder.yml found');
    const config = fs.readFileSync(builderConfigPath, 'utf8');
    const configLower = config.toLowerCase();

    const hasLegacyMsixTarget =
      /target\s*:\s*msix/.test(configLower) || /-\s*msix\b/.test(configLower);
    const hasAppxTarget =
      /target\s*:\s*appx/.test(configLower) || /-\s*appx\b/.test(configLower);
    const hasNsisTarget =
      /target\s*:\s*nsis/.test(configLower) || /-\s*nsis\b/.test(configLower);

    if (hasLegacyMsixTarget) {
      logger.error('✗ Legacy "msix" target found. electron-builder requires "appx" for Microsoft Store packaging.');
      errors++;
    }

    if (!hasAppxTarget && !hasNsisTarget) {
      logger.error('✗ No Windows installer target found (expected NSIS and/or APPX)');
      errors++;
    }

    if (storeSubmissionMode && !hasAppxTarget) {
      logger.error('✗ Store submission mode requires APPX target configuration');
      errors++;
    }

    if (hasNsisTarget) {
      logger.info('✓ NSIS target configured (desktop installer path)');
      const forceCodeSigningEnabled = hasYamlBoolean(config, 'forceCodeSigning', true);
      const hasCodeSigningMaterial = Boolean(
        process.env.CSC_LINK || process.env.WIN_CSC_LINK || process.env.CSC_NAME,
      );
      const releaseForceCodeSigningEnabled = isEnabledFlag('RELEASE_FORCE_CODESIGN');
      const configuredIncludeValue = normalizeYamlScalar(getYamlScalarValue(config, 'include'));
      const resolvedIncludeValue = configuredIncludeValue
        ? resolveEnvReferences(configuredIncludeValue).replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase()
        : '';
      const acceptedIncludePaths = ['installer.nsh', 'build/installer.nsh'];

      const nsisChecks: ValidationCheck[] = [
        {
          ok: hasYamlBoolean(config, 'oneClick', false),
          pass: '✓ NSIS assisted installer enabled (oneClick: false)',
          fail: '✗ NSIS must set oneClick: false to provide a standard guided installer with progress pages',
        },
        {
          ok: hasYamlBoolean(config, 'allowToChangeInstallationDirectory', true),
          pass: '✓ Install directory chooser enabled (allowToChangeInstallationDirectory: true)',
          fail: '✗ NSIS must allow install directory selection (allowToChangeInstallationDirectory: true)',
        },
        {
          ok: hasYamlBoolean(config, 'perMachine', false),
          pass: '✓ Per-user installer scope configured (perMachine: false)',
          fail: '✗ NSIS should set perMachine: false for per-user install compatibility',
        },
        {
          ok: hasYamlBoolean(config, 'createDesktopShortcut', true),
          pass: '✓ Desktop shortcut creation enabled',
          fail: '✗ NSIS should enable desktop shortcut creation (createDesktopShortcut: true)',
        },
        {
          ok: hasYamlBoolean(config, 'createStartMenuShortcut', true),
          pass: '✓ Start menu shortcut creation enabled',
          fail: '✗ NSIS should enable Start menu shortcut creation (createStartMenuShortcut: true)',
        },
        {
          ok: hasYamlBoolean(config, 'allowElevation', true),
          pass: '✓ Elevation support enabled for installer compatibility',
          fail: '✗ NSIS should enable elevation support (allowElevation: true)',
        },
        {
          ok: hasYamlBoolean(config, 'runAfterFinish', true),
          pass: '✓ Run-after-finish enabled',
          fail: '✗ NSIS should enable runAfterFinish: true for expected installer UX',
        },
        {
          ok: acceptedIncludePaths.includes(resolvedIncludeValue),
          pass: `✓ Custom NSIS script include configured (${configuredIncludeValue || 'installer.nsh'})`,
          fail: '✗ NSIS include must reference installer.nsh (root) or build/installer.nsh',
        },
        {
          ok:
            configLower.includes('artifactname: "${productname}-setup-${version}.${ext}"') ||
            configLower.includes("artifactname: '${productname}-setup-${version}.${ext}'"),
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

      const rootInstallerScriptPath = path.join(rootDir, 'installer.nsh');
      const rootUninstallerScriptPath = path.join(rootDir, 'uninstaller.nsh');
      const resolvedIncludePath = configuredIncludeValue
        ? path.resolve(rootDir, resolveEnvReferences(configuredIncludeValue))
        : rootInstallerScriptPath;
      const hasRootInstallerScript = fs.existsSync(rootInstallerScriptPath);
      const hasRootUninstallerScript = fs.existsSync(rootUninstallerScriptPath);

      if (hasRootInstallerScript) {
        logger.info('✓ Root installer script found (installer.nsh)');
      } else {
        logger.error('✗ Missing root installer script (installer.nsh)');
        errors++;
      }

      if (hasRootUninstallerScript) {
        logger.info('✓ Root uninstaller script found (uninstaller.nsh)');
      } else {
        logger.error('✗ Missing root uninstaller script (uninstaller.nsh)');
        errors++;
      }

      if (fs.existsSync(resolvedIncludePath)) {
        logger.info(`✓ Custom NSIS include script found (${path.relative(rootDir, resolvedIncludePath)})`);
        const scriptSources = Array.from(
          new Set<string>([resolvedIncludePath, rootInstallerScriptPath, rootUninstallerScriptPath]),
        );
        const installerScript = scriptSources
          .filter(filePath => fs.existsSync(filePath))
          .map(filePath => fs.readFileSync(filePath, 'utf8'))
          .join('\n')
          .toLowerCase();

        const installerChecks: ValidationCheck[] = [
          {
            ok: /!macro\s+custominstall\b/.test(installerScript),
            pass: '✓ customInstall macro defined',
            fail: '✗ Missing !macro customInstall in installer scripts',
          },
          {
            ok: /!macro\s+customuninstall\b/.test(installerScript),
            pass: '✓ customUnInstall macro defined',
            fail: '✗ Missing !macro customUnInstall in installer scripts',
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
            ok: installerScript.includes('ifsilent skip_install_message'),
            pass: '✓ Installer completion message is gated for silent installs',
            fail: '✗ Installer completion message should be suppressed in silent mode for Store-compatible automation',
          },
          {
            ok:
              installerScript.includes('ifsilent keep_data') &&
              installerScript.includes('ifsilent skip_uninstall_message'),
            pass: '✓ Uninstall prompts/messages are gated for silent uninstalls',
            fail: '✗ Uninstall prompts/messages should be suppressed in silent mode for Store-compatible automation',
          },
          {
            ok:
              installerScript.includes(
                'do you want to completely remove all cyberdocgen application data',
              ) &&
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
        logger.error(`✗ Missing NSIS include script (${path.relative(rootDir, resolvedIncludePath)})`);
        errors++;
      }

      const assistedInstallerTemplatePath = path.join(
        rootDir,
        'node_modules',
        'app-builder-lib',
        'templates',
        'nsis',
        'assistedInstaller.nsh',
      );
      if (fileContainsAll(assistedInstallerTemplatePath, ['!insertmacro mui_page_instfiles'])) {
        logger.info('✓ NSIS installer progress page macro present (MUI_PAGE_INSTFILES)');
      } else {
        logger.error('✗ NSIS installer progress page macro missing (expected MUI_PAGE_INSTFILES)');
        errors++;
      }
      if (fileContainsAll(assistedInstallerTemplatePath, ['!insertmacro mui_unpage_instfiles'])) {
        logger.info('✓ NSIS uninstaller progress page macro present (MUI_UNPAGE_INSTFILES)');
      } else {
        logger.error('✗ NSIS uninstaller progress page macro missing (expected MUI_UNPAGE_INSTFILES)');
        errors++;
      }

      const nsisInstallerTemplatePath = path.join(
        rootDir,
        'node_modules',
        'app-builder-lib',
        'templates',
        'nsis',
        'include',
        'installer.nsh',
      );
      const hasRootInstallUninstallerFile = fileContainsAll(nsisInstallerTemplatePath, [
        'file "/oname=${uninstall_filename}" "${uninstaller_out_file}"',
      ]);
      const hasRootInstallUninstallRegistryPath = fileContainsAll(nsisInstallerTemplatePath, [
        'strcpy $2 "$instdir\\${uninstall_filename}"',
        'writeregstr shell_context "${uninstall_registry_key}" uninstallstring',
      ]);

      if (hasRootInstallUninstallerFile && hasRootInstallUninstallRegistryPath) {
        logger.info('✓ Uninstaller is registered in install root ($INSTDIR\\Uninstall <Product>.exe)');
      } else {
        logger.error('✗ Could not verify uninstaller root registration semantics in NSIS template');
        errors++;
      }

      if (process.env.RELEASE_BUILD === 'true') {
        if (!hasCodeSigningMaterial) {
          logger.error(
            '✗ Release validation: signing credentials are required (set CSC_LINK/WIN_CSC_LINK and CSC_NAME)',
          );
          errors++;
        } else {
          logger.info('✓ Release validation: signing credentials are configured');
        }

        if (forceCodeSigningEnabled || releaseForceCodeSigningEnabled) {
          logger.info('✓ Release validation: forceCodeSigning enforcement is enabled');
        } else {
          logger.error(
            '✗ Release validation: enable forceCodeSigning in config or set RELEASE_FORCE_CODESIGN=true for release builds',
          );
          errors++;
        }
      } else if (!forceCodeSigningEnabled) {
        logger.warn('! forceCodeSigning is disabled (acceptable for local/dev builds, not for signed releases)');
      } else {
        logger.info('✓ forceCodeSigning is enabled in configuration');
      }

      if (process.env.RELEASE_BUILD !== 'true' && releaseForceCodeSigningEnabled) {
        if (hasCodeSigningMaterial) {
          logger.info('✓ Release signing override requested and signing credentials are present');
        } else {
          logger.error(
            '✗ RELEASE_FORCE_CODESIGN=true requires signing credentials (CSC_LINK/WIN_CSC_LINK and CSC_NAME)',
          );
          errors++;
        }
      }
    }

    if (hasAppxTarget) {
      logger.info('✓ APPX target configured (Microsoft Store package path)');

      const appxFields: Array<{ key: string; label: string; requiredForStore: boolean }> = [
        { key: 'identityName', label: 'identityName', requiredForStore: true },
        { key: 'publisher', label: 'publisher', requiredForStore: true },
        { key: 'publisherDisplayName', label: 'publisherDisplayName', requiredForStore: true },
        { key: 'applicationId', label: 'applicationId', requiredForStore: true },
        { key: 'displayName', label: 'displayName', requiredForStore: true },
        { key: 'artifactName', label: 'artifactName', requiredForStore: true },
        { key: 'minVersion', label: 'minVersion', requiredForStore: false },
        { key: 'maxVersionTested', label: 'maxVersionTested', requiredForStore: false },
      ];

      const resolvedAppxValues = new Map<string, string>();

      for (const field of appxFields) {
        const rawValue = normalizeYamlScalar(getYamlScalarValue(config, field.key));
        const value = rawValue ?? '';
        if (value.length > 0) {
          logger.info(`✓ APPX ${field.label} configured`);
        } else if (field.requiredForStore) {
          logger.error(`✗ APPX ${field.label} is required`);
          errors++;
          continue;
        } else {
          logger.warn(`! APPX ${field.label} not set (optional)`);
          continue;
        }

        const envRefs = extractEnvReferences(value);
        for (const envRef of envRefs) {
          const envValue = getEnvValueInsensitive(envRef);
          if (envValue && envValue.trim().length > 0) {
            logger.info(`✓ Environment variable ${envRef} is set for APPX ${field.label}`);
          } else if (storeSubmissionMode && field.requiredForStore) {
            logger.error(`✗ Missing environment variable ${envRef} required by APPX ${field.label}`);
            errors++;
          } else {
            logger.warn(
              `! Environment variable ${envRef} is not set; APPX ${field.label} may be invalid when building store packages`,
            );
          }
        }

        resolvedAppxValues.set(field.key, resolveEnvReferences(value).trim());
      }

      if (storeSubmissionMode) {
        const publisher =
          getEnvValueInsensitive('WINDOWS_STORE_PUBLISHER')?.trim() ||
          resolvedAppxValues.get('publisher');
        if (!publisher || !publisher.toUpperCase().startsWith('CN=')) {
          logger.error('✗ APPX publisher must start with "CN=" in store submission mode');
          errors++;
        } else {
          logger.info('✓ APPX publisher format looks valid for Partner Center identity');
        }

        const identityName =
          getEnvValueInsensitive('WINDOWS_STORE_IDENTITY_NAME')?.trim() ||
          resolvedAppxValues.get('identityName');
        // eslint-disable-next-line security/detect-unsafe-regex
        if (!identityName || !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i.test(identityName)) {
          logger.error(
            '✗ APPX identityName format is invalid; expected dotted alphanumeric segments (e.g., Contoso.CyberDocGen)',
          );
          errors++;
        } else {
          logger.info('✓ APPX identityName format validated');
        }

        const applicationId = resolvedAppxValues.get('applicationId');
        // eslint-disable-next-line security/detect-unsafe-regex
        if (!applicationId || !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/i.test(applicationId)) {
          logger.error(
            '✗ APPX applicationId format is invalid; expected alphanumeric segments separated by periods',
          );
          errors++;
        } else {
          logger.info('✓ APPX applicationId format validated');
        }
      }
    } else {
      logger.info('i APPX target not configured (acceptable for NSIS-only distribution)');
    }

    const outputDirValue = normalizeYamlScalar(getYamlScalarValue(config, 'output'));
    const outputDir = path.resolve(rootDir, outputDirValue || 'dist/packaging');
    if (fs.existsSync(outputDir)) {
      const setupArtifacts = fs
        .readdirSync(outputDir, { withFileTypes: true })
        .filter(entry => entry.isFile() && /^cyberdocgen-setup-.*\.exe$/i.test(entry.name));
      if (setupArtifacts.length > 0) {
        logger.info(`✓ Installer artifact found in output root (${outputDir})`);
      } else {
        logger.warn(
          `! No setup artifact currently present in output root (${outputDir}); run build:win to generate it`,
        );
      }

      const storeArtifacts = fs
        .readdirSync(outputDir, { withFileTypes: true })
        .filter(
          entry => entry.isFile() && /\.(appx|appxbundle|msix|msixbundle)$/i.test(entry.name),
        );
      if (storeArtifacts.length > 0) {
        logger.info(`✓ Store package artifact found in output root (${outputDir})`);
      } else if (storeSubmissionMode) {
        logger.warn(
          `! No store artifact currently present in output root (${outputDir}); run build:store to generate it`,
        );
      } else {
        logger.info(`i Store artifact not present yet in output root (${outputDir})`);
      }
    } else {
      logger.warn(
        `! Output directory does not exist yet (${outputDir}); run build:win/build:store to generate installer artifacts`,
      );
    }
  } else {
    logger.error('✗ electron-builder.yml missing');
    errors++;
  }

  // 2. Check package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    main?: string;
    version?: string;
    author?: string | { name?: string };
    productName?: string;
    scripts?: Record<string, string | undefined>;
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

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

  const storeBuildScript = packageJson.scripts?.['build:store'];
  const hasStoreBuildScript =
    typeof storeBuildScript === 'string' &&
    (storeBuildScript.includes('--win appx') || storeBuildScript.includes('build-store.ts'));
  if (hasStoreBuildScript) {
    logger.info('✓ Store build script configured (build:store)');
  } else if (storeSubmissionMode) {
    logger.error('✗ Missing or invalid "build:store" script for APPX packaging');
    errors++;
  } else {
    logger.info('i Store build script not configured');
  }

  const hasStoreValidationScript =
    typeof packageJson.scripts?.['windows:validate:store'] === 'string' &&
    packageJson.scripts['windows:validate:store'].includes('WINDOWS_STORE_SUBMISSION=true');
  if (hasStoreValidationScript) {
    logger.info('✓ Store validation script configured (windows:validate:store)');
  } else if (storeSubmissionMode) {
    logger.error('✗ Missing "windows:validate:store" script that enables store validation mode');
    errors++;
  } else {
    logger.info('i Store validation script not configured');
  }

  if (typeof packageJson.version === 'string' && isSemver(packageJson.version)) {
    logger.info('✓ Package version uses semver format');
  } else {
    logger.error('✗ package.json version must be valid semver (required by Store metadata)');
    errors++;
  }

  const hasAuthor =
    (typeof packageJson.author === 'string' && packageJson.author.trim().length > 0) ||
    (typeof packageJson.author === 'object' &&
      packageJson.author !== null &&
      typeof packageJson.author.name === 'string' &&
      packageJson.author.name.trim().length > 0);
  if (hasAuthor) {
    logger.info('✓ Package author metadata present');
  } else if (storeSubmissionMode) {
    logger.error('✗ package.json author metadata is required for Store distribution records');
    errors++;
  } else {
    logger.warn('! package.json author metadata missing');
  }

  // 3. Check Store-safe runtime behavior
  const electronMainPath = path.join(rootDir, 'electron', 'main.ts');
  if (fs.existsSync(electronMainPath)) {
    const electronMainContent = fs.readFileSync(electronMainPath, 'utf8').toLowerCase();
    const hasWindowsStoreGuard =
      electronMainContent.includes('iswindowsstorebuild') && electronMainContent.includes('windowsstore');
    if (hasWindowsStoreGuard) {
      logger.info('✓ Electron runtime includes windowsStore guard logic');
    } else if (storeSubmissionMode) {
      logger.error('✗ Store submission mode requires a windowsStore runtime guard (e.g., auto-updater disable)');
      errors++;
    } else {
      logger.warn('! windowsStore runtime guard not detected in Electron main process');
    }
  } else if (storeSubmissionMode) {
    logger.error('✗ Electron main process file missing (electron/main.ts)');
    errors++;
  }

  // 4. Check static assets (icons)
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
