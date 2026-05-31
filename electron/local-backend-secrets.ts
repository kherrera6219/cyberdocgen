import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENCRYPTION_KEY_PATTERN = /^[a-fA-F0-9]{64}$/;
const INTEGRITY_SECRET_MIN_LENGTH = 32;
const SECRETS_DIRECTORY = 'security';
const SECRETS_FILENAME = 'backend-secrets.json';

export interface LocalBackendSecrets {
  encryptionKey: string;
  dataIntegritySecret: string;
  source: 'environment' | 'file' | 'generated';
  path: string;
}

interface PersistedLocalBackendSecrets {
  version: 1;
  encryptionKey: string;
  dataIntegritySecret: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalBackendSecretsLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
}

/**
 * Encrypt string payload using native Windows DPAPI (CurrentUser)
 */
function encryptDPAPI(plainText: string, logger?: LocalBackendSecretsLogger): string {
  if (process.platform !== 'win32' || process.env.NODE_ENV === 'test') {
    return plainText;
  }
  try {
    const base64Input = Buffer.from(plainText, 'utf8').toString('base64');
    const command = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Security; $plainBytes = [System.Convert]::FromBase64String('${base64Input}'); $encryptedBytes = [System.Security.Cryptography.ProtectedData]::Protect($plainBytes, $null, 'CurrentUser'); [System.Convert]::ToBase64String($encryptedBytes)"`;
    const base64 = execSync(command, { encoding: 'utf8', windowsHide: true }).trim();
    if (!base64 || base64.includes('Error')) {
      throw new Error('DPAPI protect cmdlet returned invalid result');
    }
    logger?.info('DPAPI encryption completed successfully for local secrets store.');
    return `DPAPI:${base64}`;
  } catch (error: any) {
    logger?.warn('Windows DPAPI encryption failed, falling back to standard file permissions protection', {
      error: error?.message || String(error),
    });
    return plainText;
  }
}

/**
 * Decrypt string payload using native Windows DPAPI (CurrentUser)
 */
function decryptDPAPI(cipherText: string, logger?: LocalBackendSecretsLogger): string {
  if (!cipherText.startsWith('DPAPI:')) {
    return cipherText;
  }
  if (process.platform !== 'win32' || process.env.NODE_ENV === 'test') {
    return cipherText.substring(6);
  }
  try {
    const base64 = cipherText.substring(6);
    const command = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Security; $encryptedBytes = [System.Convert]::FromBase64String('${base64}'); $plainBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedBytes, $null, 'CurrentUser'); [System.Convert]::ToBase64String($plainBytes)"`;
    const base64Output = execSync(command, { encoding: 'utf8', windowsHide: true }).trim();
    if (!base64Output) {
      throw new Error('DPAPI unprotect cmdlet returned empty result');
    }
    const decrypted = Buffer.from(base64Output, 'base64').toString('utf8');
    logger?.info('DPAPI decryption completed successfully for local secrets store.');
    return decrypted;
  } catch (error: any) {
    logger?.warn('Windows DPAPI decryption failed', {
      error: error?.message || String(error),
    });
    throw new Error(`Failed to decrypt GRC secrets using DPAPI: ${error?.message || String(error)}`);
  }
}

function normalizeEncryptionKey(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  return ENCRYPTION_KEY_PATTERN.test(trimmed) ? trimmed : null;
}

function normalizeIntegritySecret(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  return trimmed.length >= INTEGRITY_SECRET_MIN_LENGTH ? trimmed : null;
}

function isPersistedSecretsRecord(value: unknown): value is PersistedLocalBackendSecrets {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PersistedLocalBackendSecrets>;
  return (
    candidate.version === 1
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && typeof candidate.encryptionKey === 'string'
    && typeof candidate.dataIntegritySecret === 'string'
    && ENCRYPTION_KEY_PATTERN.test(candidate.encryptionKey)
    && candidate.dataIntegritySecret.length >= INTEGRITY_SECRET_MIN_LENGTH
  );
}

function readPersistedSecrets(
  secretsPath: string,
  logger?: LocalBackendSecretsLogger
): PersistedLocalBackendSecrets | null {
  if (!fs.existsSync(secretsPath)) {
    return null;
  }

  try {
    const rawContent = fs.readFileSync(secretsPath, 'utf8').trim();
    const decrypted = decryptDPAPI(rawContent, logger);
    const parsed = JSON.parse(decrypted) as unknown;
    if (!isPersistedSecretsRecord(parsed)) {
      logger?.warn('Local backend secrets file is malformed; regenerating', { secretsPath });
      return null;
    }
    return parsed;
  } catch (error) {
    logger?.warn('Failed to read local backend secrets file; regenerating', { secretsPath, error: String(error) });
    return null;
  }
}

function persistSecrets(
  secretsPath: string,
  payload: PersistedLocalBackendSecrets,
  logger?: LocalBackendSecretsLogger
): void {
  try {
    fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
    const rawJson = JSON.stringify(payload, null, 2);
    const encrypted = encryptDPAPI(rawJson, logger);
    fs.writeFileSync(secretsPath, encrypted, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    logger?.warn('Failed to persist local backend secrets file', { secretsPath, error: String(error) });
  }
}

export function resolveLocalBackendSecrets(
  userDataPath: string,
  logger?: LocalBackendSecretsLogger
): LocalBackendSecrets {
  const secretsPath = path.join(path.resolve(userDataPath), SECRETS_DIRECTORY, SECRETS_FILENAME);
  const existing = readPersistedSecrets(secretsPath, logger);

  const rawEnvEncryptionKey = process.env.ENCRYPTION_KEY;
  const rawEnvIntegritySecret = process.env.DATA_INTEGRITY_SECRET;
  const envEncryptionKey = normalizeEncryptionKey(rawEnvEncryptionKey);
  const envIntegritySecret = normalizeIntegritySecret(rawEnvIntegritySecret);

  if (rawEnvEncryptionKey && !envEncryptionKey) {
    logger?.warn('Ignoring invalid ENCRYPTION_KEY for local desktop runtime; using persisted/generated key');
  }
  if (rawEnvIntegritySecret && !envIntegritySecret) {
    logger?.warn('Ignoring invalid DATA_INTEGRITY_SECRET for local desktop runtime; using persisted/generated secret');
  }

  const generatedEncryptionKey = !envEncryptionKey && !existing?.encryptionKey;
  const generatedIntegritySecret = !envIntegritySecret && !existing?.dataIntegritySecret;

  const encryptionKey = envEncryptionKey ?? existing?.encryptionKey ?? crypto.randomBytes(32).toString('hex');
  const dataIntegritySecret =
    envIntegritySecret ?? existing?.dataIntegritySecret ?? crypto.randomBytes(48).toString('hex');

  const nowIso = new Date().toISOString();
  const record: PersistedLocalBackendSecrets = {
    version: 1,
    encryptionKey,
    dataIntegritySecret,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  const shouldPersist =
    !existing
    || existing.encryptionKey !== record.encryptionKey
    || existing.dataIntegritySecret !== record.dataIntegritySecret;

  if (shouldPersist) {
    persistSecrets(secretsPath, record, logger);
  }

  const source: LocalBackendSecrets['source'] =
    envEncryptionKey && envIntegritySecret
      ? 'environment'
      : (generatedEncryptionKey || generatedIntegritySecret ? 'generated' : 'file');

  logger?.info('Resolved local backend secrets for desktop runtime', {
    source,
    secretsPath,
  });

  return {
    encryptionKey,
    dataIntegritySecret,
    source,
    path: secretsPath,
  };
}

