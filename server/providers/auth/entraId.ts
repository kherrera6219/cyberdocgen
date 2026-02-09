/**
 * Entra ID Authentication Provider
 * 
 * Cloud mode authentication using Microsoft Entra ID (Azure AD) OIDC/PKCE.
 * Supports contextual authentication signals from Entra ID tokens including
 * MFA status, device compliance, and conditional access policy evaluation.
 */

import type { Request } from 'express';
import type { IAuthProvider, AuthContext, User, Tenant } from '../interfaces';
import { logger } from '../../utils/logger';

/**
 * Entra ID token claims that indicate authentication context
 */
interface EntraIdClaims {
  /** Authentication methods satisfied */
  amr?: string[];
  /** Authentication context class reference */
  acr?: string;
  /** IP address */
  ipaddr?: string;
  /** Device ID */
  deviceid?: string;
  /** Trust Framework Policy (B2C) */
  tfp?: string;
  /** MFA timestamp */
  mfa_ts?: number;
}

/**
 * Contextual authentication signals extracted from Entra ID tokens
 */
export interface AuthContextSignals {
  /** Whether MFA was completed in this session */
  mfaCompleted: boolean;
  /** Authentication methods used (e.g., 'pwd', 'mfa', 'wia') */
  authMethods: string[];
  /** Device compliance status */
  deviceCompliant: boolean;
  /** Session risk level (low, medium, high) */
  riskLevel: 'low' | 'medium' | 'high';
  /** Client IP address */
  clientIp?: string;
  /** Device identifier */
  deviceId?: string;
  /** Timestamp of last MFA verification */
  lastMfaTimestamp?: Date;
}

export class EntraIdAuthProvider implements IAuthProvider {
  
  async authenticate(req: Request): Promise<AuthContext | null> {
    // Check if Passport has already authenticated the user
    if (!req.user) {
      return null;
    }
    
    // Extract user and tenant from existing auth middleware
    const user = req.user as unknown as User;
    const tenant = (req as any).tenant as Tenant | undefined;
    
    // Ensure tenant is set (multi-tenant mode)
    if (!tenant) {
      logger.warn('[EntraIdAuthProvider] User authenticated but no tenant context');
      return null;
    }

    // Extract contextual authentication signals from the token
    const signals = this.extractAuthSignals(req);
    
    // Store signals in session for downstream MFA decisions
    if (req.session) {
      (req.session as any).authContextSignals = signals;
      
      // Auto-verify MFA if Entra ID already enforced it
      if (signals.mfaCompleted) {
        req.session.mfaVerified = true;
        logger.info('[EntraIdAuthProvider] MFA auto-verified from Entra ID token', {
          userId: user.id,
          authMethods: signals.authMethods,
        });
      }
    }
    
    return { user, tenant };
  }
  
  isAuthRequired(): boolean {
    return true; // Cloud mode always requires authentication
  }
  
  async initialize(): Promise<void> {
    logger.info('[EntraIdAuthProvider] Initializing Entra ID OIDC...');
    
    // The actual Passport configuration is in routes/microsoftAuth.ts
    // This provider adds contextual signal extraction on top
    
    logger.info('[EntraIdAuthProvider] Contextual MFA signals enabled');
  }

  /**
   * Extract authentication context signals from Entra ID token claims
   */
  private extractAuthSignals(req: Request): AuthContextSignals {
    // Token claims are typically stored by Passport in req.user or session
    const tokenClaims = this.getTokenClaims(req);
    
    // Check for MFA in amr (Authentication Methods References)
    const amr = tokenClaims.amr || [];
    const mfaCompleted = this.checkMfaInAmr(amr);
    
    // Evaluate risk level based on available signals
    const riskLevel = this.evaluateRiskLevel(req, tokenClaims);
    
    // Check device compliance (if available from Conditional Access)
    const deviceCompliant = this.checkDeviceCompliance(tokenClaims);
    
    return {
      mfaCompleted,
      authMethods: amr,
      deviceCompliant,
      riskLevel,
      clientIp: tokenClaims.ipaddr || req.ip,
      deviceId: tokenClaims.deviceid,
      lastMfaTimestamp: tokenClaims.mfa_ts 
        ? new Date(tokenClaims.mfa_ts * 1000) 
        : undefined,
    };
  }

  /**
   * Get token claims from request (via Passport or session)
   */
  private getTokenClaims(req: Request): EntraIdClaims {
    // Claims may be stored in various places depending on Passport config
    const session = req.session as any;
    const user = req.user as any;
    
    return {
      amr: user?.amr || session?.tokenClaims?.amr || [],
      acr: user?.acr || session?.tokenClaims?.acr,
      ipaddr: user?.ipaddr || session?.tokenClaims?.ipaddr,
      deviceid: user?.deviceid || session?.tokenClaims?.deviceid,
      tfp: user?.tfp || session?.tokenClaims?.tfp,
      mfa_ts: user?.mfa_ts || session?.tokenClaims?.mfa_ts,
    };
  }

  /**
   * Check if MFA was completed based on amr claim
   * See: https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference
   */
  private checkMfaInAmr(amr: string[]): boolean {
    // MFA-related amr values
    const mfaMethods = [
      'mfa',           // Multi-factor auth completed
      'otp',           // One-time passcode
      'hwk',           // Hardware key (FIDO2)
      'swk',           // Software key 
      'sms',           // SMS verification
      'ngcmfa',        // NGC MFA (Windows Hello)
      'pop',           // Proof of possession
      'rsa',           // RSA SecurID
    ];
    
    return amr.some(method => mfaMethods.includes(method.toLowerCase()));
  }

  /**
   * Evaluate session risk level based on contextual signals
   */
  private evaluateRiskLevel(
    req: Request, 
    claims: EntraIdClaims
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Check for suspicious signals
    const user = req.user as any;
    
    // Unknown device
    if (!claims.deviceid) {
      riskScore += 1;
    }
    
    // Password-only auth without MFA
    const amr = claims.amr || [];
    if (amr.includes('pwd') && !this.checkMfaInAmr(amr)) {
      riskScore += 2;
    }
    
    // Check for unusual IP (would need geo-IP service in production)
    // This is a placeholder for actual IP reputation checking
    
    // Determine risk level
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Check device compliance status from claims
   */
  private checkDeviceCompliance(claims: EntraIdClaims): boolean {
    // Device compliance is typically enforced via Conditional Access
    // and reflected in the token. In a full implementation, this would
    // check for specific claims like 'isDeviceCompliant' or 'trustType'
    
    // For now, consider device compliant if we have a device ID
    // (meaning the device is registered with Entra ID)
    return !!claims.deviceid;
  }
}
