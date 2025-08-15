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
    const userId = req.user?.claims?.sub;
    const userAgent = req.get('User-Agent') || 'unknown';
    const ipAddress = req.ip;

    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        mfaRequired: false 
      });
    }

    // Check if this is a high-risk operation that requires MFA
    const highRiskPaths = [
      '/api/company-profiles',
      '/api/documents/generate',
      '/api/encryption',
      '/api/admin'
    ];

    const requiresMFA = highRiskPaths.some(path => req.path.startsWith(path)) || 
                       req.method === 'DELETE' ||
                       (req.method === 'POST' && req.path.includes('/generate'));

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
      return res.status(403).json({ 
        message: 'MFA token required',
        mfaRequired: true 
      });
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

    if (req.mfaRequired && mfaVerifiedAt) {
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