/**
 * Entra ID Authentication Provider
 * 
 * Cloud mode authentication using Microsoft Entra ID (Azure AD) OIDC/PKCE.
 * Delegates to existing Passport.js middleware.
 */

import type { Request } from 'express';
import type { IAuthProvider, AuthContext, User, Tenant } from '../interfaces';

export class EntraIdAuthProvider implements IAuthProvider {
  
  async authenticate(req: Request): Promise<AuthContext | null> {
    // Check if Passport has already authenticated the user
    if (!req.user) {
      return null;
    }
    
    // Extract user and tenant from existing auth middleware
    const user = req.user as User;
    const tenant = (req as any).tenant as Tenant | undefined;
    
    // Ensure tenant is set (multi-tenant mode)
    if (!tenant) {
      console.warn('[EntraIdAuthProvider] User authenticated but no tenant context');
      return null;
    }
    
    return { user, tenant };
  }
  
  isAuthRequired(): boolean {
    return true; // Cloud mode always requires authentication
  }
  
  async initialize(): Promise<void> {
    console.log('[EntraIdAuthProvider] Initializing Entra ID OIDC...');
    
    // TODO: This would configure Passport with Entra ID strategy
    // The actual configuration is already in the existing auth middleware
    // This is just for compatibility with the provider pattern
    
    console.log('[EntraIdAuthProvider] Delegates to existing Passport middleware');
  }
}
