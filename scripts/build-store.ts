import { spawnSync } from 'child_process';

const requiredEnv = [
  'WINDOWS_STORE_IDENTITY_NAME',
  'WINDOWS_STORE_PUBLISHER',
  'WINDOWS_STORE_PUBLISHER_DISPLAY_NAME',
] as const;

const missingEnv = requiredEnv.filter(name => {
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[name];
  return !value || value.trim().length === 0;
});

if (missingEnv.length > 0) {
  console.error(
    `Missing required Store environment variable(s): ${missingEnv.join(', ')}`,
  );
  process.exit(1);
}

const identityName = process.env.WINDOWS_STORE_IDENTITY_NAME!.trim();
const publisher = process.env.WINDOWS_STORE_PUBLISHER!.trim();
const publisherDisplayName = process.env.WINDOWS_STORE_PUBLISHER_DISPLAY_NAME!.trim();

const args = [
  'build',
  '--win',
  'appx',
  `-c.appx.identityName=${identityName}`,
  `-c.appx.publisher=${publisher}`,
  `-c.appx.publisherDisplayName=${publisherDisplayName}`,
];

const result = spawnSync('electron-builder', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(result.error ? 1 : 0);
