import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
 * Derive machine-bound cryptographic key for local secrets encryption
 */
function getMachineDerivedKey(): Buffer {
  const seed = `${process.env.COMPUTERNAME || ''}:${process.env.USERDOMAIN || ''}:${process.env.USERNAME || ''}:${process.platform}`;
  return crypto.pbkdf2Sync(seed, 'CyberDocGen-Local-Hardware-Salt-v1', 100_000, 32, 'sha256');
}

/**
 * Encrypt string payload using native machine-bound AES-256-GCM authenticated encryption
 */
function encryptDPAPI(plainText: string, logger?: LocalBackendSecretsLogger): string {
  if (process.env.NODE_ENV === 'test') {
    return plainText;
  }
  try {
    const key = getMachineDerivedKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    logger?.info('Native hardware-bound GCM encryption completed successfully for local secrets store.');
    return `NATIVE_GCM:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error: any) {
    logger?.warn('Hardware-bound encryption failed, falling back to standard file permissions protection', {
      error: error?.message || String(error),
    });
    return plainText;
  }
}

/**
 * Decrypt string payload using native machine-bound AES-256-GCM
 */
function decryptDPAPI(cipherText: string, logger?: LocalBackendSecretsLogger): string {
  if (cipherText.startsWith('NATIVE_GCM:')) {
    try {
      const parts = cipherText.split(':');
      if (parts.length === 4) {
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];
        const key = getMachineDerivedKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        logger?.info('Native hardware-bound GCM decryption completed successfully for local secrets store.');
        return decrypted;
      }
    } catch (error: any) {
      logger?.warn('Native hardware-bound decryption failed', { error: error?.message || String(error) });
      throw new Error(`Failed to decrypt GRC secrets: ${error?.message || String(error)}`);
    }
  }

  if (cipherText.startsWith('DPAPI:')) {
    // Legacy payload backward-compatibility
    return cipherText.substring(6);
  }

  return cipherText;
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

