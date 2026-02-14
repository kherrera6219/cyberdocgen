import crypto from 'crypto';
import { logger } from './logger';

let generatedAuditSecret: string | null = null;

function resolveAuditLogSecret(): string {
  const configuredSecret = process.env.AUDIT_LOG_SECRET;
  if (configuredSecret && configuredSecret.length >= 32) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUDIT_LOG_SECRET must be configured with at least 32 characters in production');
  }

  if (!generatedAuditSecret) {
    generatedAuditSecret = crypto.randomBytes(48).toString('hex');
    logger.warn('AUDIT_LOG_SECRET is not configured; using ephemeral in-memory secret for audit signatures');
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
