/**
 * Local Auth Bypass Provider
 * 
 * Local mode authentication that bypasses login.
 * Always returns a synthetic local admin user.
 * 
 * Security considerations:
 * - Server MUST bind to 127.0.0.1 only (enforced in runtime config)
 * - This provider should NEVER be used in cloud mode
 */

import type { Request } from 'express';
import type { IAuthProvider, AuthContext, User, Tenant } from '../interfaces';
import { logger } from '../../utils/logger';
import { isLocalMode } from '../../config/runtime';

/**
 * Synthetic user for local mode
 */
const LOCAL_ADMIN_USER: User = {
  id: '1',
  email: 'admin@local',
  role: 'admin',
  firstName: 'Local',
  lastName: 'Admin',
  organizationId: '1',
};

/**
 * Synthetic tenant for local mode
 */
const LOCAL_TENANT: Tenant = {
  id: '1',
  name: 'Local Workspace',
};

function normalizeRemoteIp(raw: string): string {
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}

function isLoopbackAddress(ip: string): boolean {
  return (
    ip === '127.0.0.1'
    || ip === '::1'
    || ip === 'localhost'
    || ip.startsWith('127.')
  );
}

function resolveRequestRemoteIp(req: Request): string {
  const socketIp = typeof req.socket?.remoteAddress === 'string' ? req.socket.remoteAddress : '';
  const fallbackIp = typeof (req as any).ip === 'string' ? (req as any).ip : '';
  return normalizeRemoteIp(String(socketIp || fallbackIp).trim());
}

export class LocalAuthBypassProvider implements IAuthProvider {
  
  async authenticate(_req: Request): Promise<AuthContext> {
    // Always return the synthetic local admin user
    // No actual authentication is performed
    return {
      user: LOCAL_ADMIN_USER,
      tenant: LOCAL_TENANT,
    };
  }
  
  isAuthRequired(): boolean {
    return false; // No authentication required in local mode
  }
  
  async initialize(): Promise<void> {
    logger.debug('[LocalAuthBypassProvider] Auth bypass enabled for local mode');
    logger.debug('[LocalAuthBypassProvider] Using synthetic user: 1');
  }
}

/**
 * Express middleware for local mode auth bypass
 * Injects user and tenant into every request
 */
export function localAuthBypassMiddleware(
  req: Request,
  res: any,
  next: () => void
): void {
  if (!isLocalMode()) {
    logger.warn('[LocalAuthBypassProvider] Blocked local bypass outside local mode');
    res.status(403).json({ message: 'Local auth bypass is only available in local mode' });
    return;
  }

  const normalizedIp = resolveRequestRemoteIp(req);
  const allowMissingIp = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (normalizedIp.length === 0 && !allowMissingIp) {
    logger.warn('[LocalAuthBypassProvider] Blocked request with missing remote address');
    res.status(403).json({ message: 'Local auth bypass requires a loopback remote address' });
    return;
  }

  if (normalizedIp.length > 0 && !isLoopbackAddress(normalizedIp)) {
    logger.warn('[LocalAuthBypassProvider] Blocked non-loopback local bypass request', { ip: normalizedIp });
    res.status(403).json({ message: 'Local auth bypass only accepts loopback requests' });
    return;
  }

  const session = (req as any).session as Record<string, any> | undefined;
  const sessionUserId =
    typeof session?.userId === 'string' && session.userId.trim().length > 0
      ? session.userId.trim()
      : LOCAL_ADMIN_USER.id;
  const sessionEmail =
    typeof session?.tempUserEmail === 'string' && session.tempUserEmail.trim().length > 0
      ? session.tempUserEmail.trim().toLowerCase()
      : LOCAL_ADMIN_USER.email;
  const sessionDisplayName =
    typeof session?.tempUserName === 'string' ? session.tempUserName.trim() : '';
  const [derivedFirstName, ...derivedLastNameParts] = sessionDisplayName
    ? sessionDisplayName.split(/\s+/)
    : [LOCAL_ADMIN_USER.firstName, LOCAL_ADMIN_USER.lastName];
  const sessionOrganizationId =
    typeof session?.organizationId === 'string' && session.organizationId.trim().length > 0
      ? session.organizationId.trim()
      : LOCAL_ADMIN_USER.organizationId;

  const syntheticUser = {
    ...LOCAL_ADMIN_USER,
    id: sessionUserId,
    email: sessionEmail,
    firstName: derivedFirstName || LOCAL_ADMIN_USER.firstName,
    lastName: derivedLastNameParts.join(' ') || LOCAL_ADMIN_USER.lastName,
    organizationId: sessionOrganizationId,
    claims: {
      sub: sessionUserId,
      email: sessionEmail,
    },
  };

  // Inject synthetic user into request
  (req as any).user = syntheticUser;
  (req as any).tenant = LOCAL_TENANT;

  // Populate session for middleware/utilities that rely on session-based identity.
  if (session) {
    if (!session.userId) {
      session.userId = sessionUserId;
    }
    if (!session.organizationId) {
      session.organizationId = sessionOrganizationId;
    }
  }
  
  // Also set on req.isAuthenticated for Passport compatibility
  (req as any).isAuthenticated = () => true;
  
  next();
}
