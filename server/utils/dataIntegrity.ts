import crypto from 'crypto';
import { logger } from './logger';

let generatedIntegritySecret: string | null = null;

function resolveIntegritySecret(): string {
  const configuredSecret = process.env.DATA_INTEGRITY_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATA_INTEGRITY_SECRET must be configured with at least 32 characters in production');
  }

  if (!generatedIntegritySecret) {
    generatedIntegritySecret = crypto.randomBytes(48).toString('hex');
    logger.warn('DATA_INTEGRITY_SECRET is not configured; using ephemeral in-memory secret for integrity signatures');
  }

  return generatedIntegritySecret;
}

function stableStringifyInternal(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Buffer.isBuffer(value)) {
    return JSON.stringify(value.toString('base64'));
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringifyInternal(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    const serialized = entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringifyInternal(entryValue)}`);
    return `{${serialized.join(',')}}`;
  }

  return JSON.stringify(String(value));
}

export function stableStringify(value: unknown): string {
  return stableStringifyInternal(value);
}

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function computeHmacSha256(content: string | Buffer): string {
  const secret = resolveIntegritySecret();
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

export interface IntegrityEnvelope {
  algorithm: 'sha256';
  hash: string;
  hmac: string;
  generatedAt: string;
}

export function createIntegrityEnvelope(content: string | Buffer): IntegrityEnvelope {
  return {
    algorithm: 'sha256',
    hash: computeSha256(content),
    hmac: computeHmacSha256(content),
    generatedAt: new Date().toISOString(),
  };
}

export function verifyIntegrityEnvelope(content: string | Buffer, envelope: IntegrityEnvelope): {
  valid: boolean;
  hashValid: boolean;
  hmacValid: boolean;
} {
  const expectedHash = computeSha256(content);
  const expectedHmac = computeHmacSha256(content);

  const hashValid = safeCompareHex(expectedHash, envelope.hash);
  const hmacValid = safeCompareHex(expectedHmac, envelope.hmac);

  return {
    valid: hashValid && hmacValid,
    hashValid,
    hmacValid,
  };
}

function safeCompareHex(expected: string, provided: string): boolean {
  if (!expected || !provided || expected.length !== provided.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch (error) {
    logger.warn('Failed to compare integrity digests', { error });
    return false;
  }
}
