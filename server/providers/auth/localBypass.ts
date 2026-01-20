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

/**
 * Synthetic user for local mode
 */
const LOCAL_ADMIN_USER: User = {
  id: 'local-admin',
  email: 'admin@local',
  role: 'admin',
  firstName: 'Local',
  lastName: 'Admin',
  organizationId: 'local',
};

/**
 * Synthetic tenant for local mode
 */
const LOCAL_TENANT: Tenant = {
  id: 'local',
  name: 'Local Workspace',
};

export class LocalAuthBypassProvider implements IAuthProvider {
  
  async authenticate(req: Request): Promise<AuthContext> {
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
    console.log('[LocalAuthBypassProvider] Auth bypass enabled for local mode');
    console.log('[LocalAuthBypassProvider] Using synthetic user: local-admin');
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
