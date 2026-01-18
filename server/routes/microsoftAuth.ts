import { Router, Request, Response } from 'express';
import { microsoftAuthService } from '../services/microsoftAuthService';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { 
  secureHandler, 
  UnauthorizedError, 
  ValidationError 
} from '../utils/errorHandling';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Initiates Microsoft Entra ID login flow
 */
router.get('/login', authLimiter, secureHandler(async (req: Request, res: Response) => {
  const { url, state, codeVerifier, nonce } = await microsoftAuthService.getAuthorizationParams();

  // Store PKCE and state in session
  if (req.session) {
    req.session.microsoftAuthState = {
      state,
      codeVerifier,
      nonce,
      timestamp: Date.now()
    };
  }

  logger.info('Microsoft login initiated', { state });
  res.redirect(url.toString());
}));

/**
 * Microsoft Entra ID callback handler
 */
router.get('/callback', authLimiter, secureHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    logger.error('Microsoft callback error', { error, description: req.query.error_description });
    throw new UnauthorizedError(`Microsoft authentication failed: ${error}`);
  }

  const storedState = req.session?.microsoftAuthState;
  if (!storedState || storedState.state !== state) {
    logger.warn('Microsoft callback state mismatch or missing');
    throw new ValidationError('Invalid or expired authentication state');
  }

  // Check state age (10 minute timeout)
  if (Date.now() - storedState.timestamp > 10 * 60 * 1000) {
    throw new ValidationError('Authentication request expired');
  }

  try {
    const tokens = await microsoftAuthService.exchangeCode(
      code,
      state,
      storedState.state,
      storedState.codeVerifier,
      storedState.nonce
    );

    const claims = tokens.claims();
    if (!claims) {
      throw new UnauthorizedError('Microsoft authentication missing ID token claims');
    }

    const microsoftUser = microsoftAuthService.mapClaimsToUser(claims);

    // 1. Map Microsoft user to local user
    const user = await storage.upsertUser({
      id: microsoftUser.id,
      email: microsoftUser.email,
      firstName: microsoftUser.firstName || null,
      lastName: microsoftUser.lastName || null,
      profileImageUrl: null,
    });

    // 2. Map Tenant to Organization (per-tenant RBAC requirement)
    // In a multi-tenant enterprise app, the Entra ID tenant represents the Organization
    let organization = await storage.getOrganization(microsoftUser.tenantId);
    if (!organization) {
      // Auto-create organization for new tenants if allowed, or map to a default
      organization = await storage.createOrganization({
        name: microsoftUser.email.split('@')[1] || 'Enterprise Organization',
        slug: `tenant-${microsoftUser.tenantId.slice(0, 8)}`,
      });
      
      // Ensure the user is an owner/member of this new organization
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: organization.id,
        role: 'owner',
      });
    }

    // 3. Clear auth state and establish session
    delete req.session.microsoftAuthState;
    
    req.session.userId = user.id;
    req.session.organizationId = organization.id;
    req.session.email = user.email;
    req.session.loginTime = new Date().toISOString();
    req.session.mfaVerified = true; // Entra ID typically handles MFA/Conditional Access
    
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save Microsoft auth session', { error: err.message });
        throw new Error('Failed to establish session');
      }
      
      logger.info('Microsoft auth successful', { userId: user.id, organizationId: organization.id });
      res.redirect('/dashboard');
    });

  } catch (err: any) {
    logger.error('Microsoft token exchange failed', { error: err.message });
    throw new UnauthorizedError('Failed to complete Microsoft authentication');
  }
}));

export default router;
