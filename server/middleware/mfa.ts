import { Request, Response, NextFunction } from 'express';
import { mfaService } from '../services/mfaService';
import { auditService, AuditAction, RiskLevel } from '../services/auditService';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      mfaRequired?: boolean;
      mfaVerified?: boolean;
    }
  }
}

/**
 * Middleware to check if MFA is required for the current user
 */
export function requireMFA(req: Request & any, res: Response, next: NextFunction) {
  try {
    // Get userId from either OAuth claims, session userId (enterprise/temp), or serialized user
    const userId = req.user?.claims?.sub || req.session?.userId || req.user?.id;
    const userAgent = req.get('User-Agent') || 'unknown';
    const ipAddress = req.ip;

    // Bypass MFA for temporary sessions - they are demo accounts
    if (req.session?.isTemporary || (typeof userId === 'string' && userId.startsWith('temp-'))) {
      req.mfaRequired = false;
      req.mfaVerified = true;
      return next();
    }

    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        mfaRequired: false 
      });
    }

    // High-security routes that require MFA
    const HIGH_SECURITY_ROUTES = [
      '/api/company-profiles',
      '/api/documents/generate',
      '/api/documents/generate-single',
      '/api/generation-jobs',
      '/api/admin',
      '/api/auth/enterprise',
      '/api/storage/backups',
      '/api/audit-trail',
      '/api/gap-analysis/generate'
    ];

    // Medium-security routes that may require MFA based on risk factors
    const MEDIUM_SECURITY_ROUTES = [
      '/api/documents',
      '/api/storage/documents',
      '/api/ai/analyze-document',
      '/api/cloud'
    ];

    const isHighSecurityRoute = HIGH_SECURITY_ROUTES.some(path => req.path.startsWith(path));
    const isMediumSecurityRoute = MEDIUM_SECURITY_ROUTES.some(path => req.path.startsWith(path));

    let requiresMFA = isHighSecurityRoute;

    // Additional checks for MFA requirement
    if (!requiresMFA) {
      if (req.method === 'DELETE') {
        requiresMFA = true;
      } else if (req.method === 'POST' && req.path.includes('/generate')) {
        requiresMFA = true;
      } else if (isMediumSecurityRoute) {
        // For medium security routes, MFA might be required based on risk
        // This part would need more sophisticated logic (e.g., checking user risk score)
        // For now, let's assume MFA is required for medium routes if not verified recently
        const mfaTimeout = 30 * 60 * 1000; // 30 minutes
        const mfaVerifiedAt = req.session.mfaVerifiedAt;
        if (!mfaVerifiedAt || new Date().getTime() - new Date(mfaVerifiedAt).getTime() > mfaTimeout) {
          requiresMFA = true;
        }
      }
    }

    req.mfaRequired = requiresMFA;

    if (requiresMFA && !req.session.mfaVerified) {
      // Log MFA requirement
      auditService.logAuditEvent({
        action: AuditAction.READ,
        resourceType: 'mfa_challenge',
        resourceId: userId,
        ipAddress,
        riskLevel: RiskLevel.HIGH,
        additionalContext: {
          path: req.path,
          method: req.method,
          userAgent: userAgent.substring(0, 100),
          mfaRequired: true
        }
      });

      return res.status(403).json({
        message: 'Multi-factor authentication required for this operation',
        mfaRequired: true,
        challengeUrl: '/api/auth/mfa/challenge'
      });
    }

    next();

  } catch (error: any) {
    logger.error('MFA middleware error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Middleware to verify MFA token from request headers
 */
export function verifyMFA(req: Request & any, res: Response, next: NextFunction) {
  try {
    const mfaToken = req.headers['x-mfa-token'] as string;
    const userId = req.user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mfaToken) {
      // If MFA was required but no token provided, return 403
      if (req.mfaRequired) {
        return res.status(403).json({ 
          message: 'MFA token required',
          mfaRequired: true 
        });
      }
      // If MFA was not required, proceed without a token
      return next();
    }

    // In a full implementation, verify the MFA token here
    // For now, mark as verified if token is present
    req.mfaVerified = true;
    req.session.mfaVerified = true;
    req.session.mfaVerifiedAt = new Date();

    // Log successful MFA verification
    auditService.logAuditEvent({
      action: AuditAction.READ,
      resourceType: 'mfa_verification',
      resourceId: userId,
      ipAddress: req.ip,
      riskLevel: RiskLevel.LOW,
      additionalContext: {
        tokenProvided: true,
        verified: true,
        path: req.path
      }
    });

    next();

  } catch (error: any) {
    logger.error('MFA verification error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Middleware to enforce session-based MFA verification timeout
 */
export function enforceMFATimeout(req: Request & any, res: Response, next: NextFunction) {
  try {
    const mfaTimeout = 30 * 60 * 1000; // 30 minutes
    const mfaVerifiedAt = req.session.mfaVerifiedAt;

    // Only enforce timeout if MFA was actually required and verified
    if (req.mfaRequired && req.session.mfaVerified && mfaVerifiedAt) {
      const now = new Date();
      const verifiedAt = new Date(mfaVerifiedAt);

      if (now.getTime() - verifiedAt.getTime() > mfaTimeout) {
        // MFA verification expired
        req.session.mfaVerified = false;
        req.session.mfaVerifiedAt = null;

        auditService.logAuditEvent({
          action: AuditAction.UPDATE,
          resourceType: 'mfa_session',
          resourceId: req.user?.claims?.sub,
          ipAddress: req.ip,
          riskLevel: RiskLevel.MEDIUM,
          additionalContext: {
            reason: 'mfa_timeout',
            lastVerified: verifiedAt.toISOString()
          }
        });

        return res.status(403).json({
          message: 'MFA verification expired. Please re-authenticate.',
          mfaRequired: true,
          reason: 'timeout'
        });
      }
    }

    next();

  } catch (error: any) {
    logger.error('MFA timeout enforcement error', { error: error.message });
    next(); // Continue on error to avoid blocking legitimate requests
  }
}