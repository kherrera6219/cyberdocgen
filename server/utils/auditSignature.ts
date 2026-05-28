import crypto from 'crypto';
import { logger } from './logger';
import { isLocalMode } from '../config/runtime';

let generatedAuditSecret: string | null = null;

function resolveAuditLogSecret(): string {
  const configuredSecret = process.env.AUDIT_LOG_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  // In local/desktop mode the binary runs with NODE_ENV=production but has no
  // externally configured secret. Generate a stable per-process ephemeral secret
  // so audit events are still HMAC-chained, just not cross-restart verifiable.
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocal = isLocalMode();

  if (!isDevelopment && !isLocal) {
    throw new Error('AUDIT_LOG_SECRET must be configured with at least 32 characters in production');
  }

  if (!generatedAuditSecret) {
    generatedAuditSecret = crypto.randomBytes(48).toString('hex');
    logger.warn('AUDIT_LOG_SECRET is not configured; using ephemeral per-process secret for audit signatures (acceptable in local mode)');
  }

  return generatedAuditSecret;
}

export function computeAuditSignature(signableData: string, previousSignature: string | null): string {
  const secret = resolveAuditLogSecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signableData);
  if (previousSignature) {
    hmac.update(previousSignature);
  }
  return hmac.digest('hex');
}
