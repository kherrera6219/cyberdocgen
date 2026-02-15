import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveLocalBackendSecrets } from '../../../electron/local-backend-secrets';

const VALID_ENCRYPTION_KEY = 'ab'.repeat(32);
const VALID_INTEGRITY_SECRET = 'integrity-secret-value-for-local-runtime-123456';

describe('resolveLocalBackendSecrets', () => {
  let tempDir: string;
  const originalEncryptionKey = process.env.ENCRYPTION_KEY;
  const originalIntegritySecret = process.env.DATA_INTEGRITY_SECRET;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberdocgen-secrets-'));
    delete process.env.ENCRYPTION_KEY;
    delete process.env.DATA_INTEGRITY_SECRET;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEncryptionKey;
    process.env.DATA_INTEGRITY_SECRET = originalIntegritySecret;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function getSecretsPath(): string {
    return path.join(tempDir, 'security', 'backend-secrets.json');
  }

  it('generates and persists local backend secrets when none are provided', () => {
    const first = resolveLocalBackendSecrets(tempDir);

    expect(first.source).toBe('generated');
    expect(first.encryptionKey).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(first.dataIntegritySecret.length).toBeGreaterThanOrEqual(32);
    expect(fs.existsSync(getSecretsPath())).toBe(true);

    const second = resolveLocalBackendSecrets(tempDir);
    expect(second.source).toBe('file');
    expect(second.encryptionKey).toBe(first.encryptionKey);
    expect(second.dataIntegritySecret).toBe(first.dataIntegritySecret);
  });

  it('prefers valid environment secrets and persists them for future launches', () => {
    process.env.ENCRYPTION_KEY = VALID_ENCRYPTION_KEY;
    process.env.DATA_INTEGRITY_SECRET = VALID_INTEGRITY_SECRET;

    const resolved = resolveLocalBackendSecrets(tempDir);

    expect(resolved.source).toBe('environment');
    expect(resolved.encryptionKey).toBe(VALID_ENCRYPTION_KEY);
    expect(resolved.dataIntegritySecret).toBe(VALID_INTEGRITY_SECRET);

    const persisted = JSON.parse(fs.readFileSync(getSecretsPath(), 'utf8')) as {
      encryptionKey: string;
      dataIntegritySecret: string;
    };
    expect(persisted.encryptionKey).toBe(VALID_ENCRYPTION_KEY);
    expect(persisted.dataIntegritySecret).toBe(VALID_INTEGRITY_SECRET);
  });

  it('ignores invalid environment values and falls back to persisted secrets', () => {
    fs.mkdirSync(path.dirname(getSecretsPath()), { recursive: true });
    fs.writeFileSync(
      getSecretsPath(),
      JSON.stringify(
        {
          version: 1,
          encryptionKey: VALID_ENCRYPTION_KEY,
          dataIntegritySecret: VALID_INTEGRITY_SECRET,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    process.env.ENCRYPTION_KEY = 'invalid';
    process.env.DATA_INTEGRITY_SECRET = 'short';

    const resolved = resolveLocalBackendSecrets(tempDir);

    expect(resolved.source).toBe('file');
    expect(resolved.encryptionKey).toBe(VALID_ENCRYPTION_KEY);
    expect(resolved.dataIntegritySecret).toBe(VALID_INTEGRITY_SECRET);
  });
});

