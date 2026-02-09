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
  // Inject synthetic user into request
  (req as any).user = LOCAL_ADMIN_USER;
  (req as any).tenant = LOCAL_TENANT;
  
  // Also set on req.isAuthenticated for Passport compatibility
  (req as any).isAuthenticated = () => true;
  
  next();
}
