/**
 * Session Risk Scoring Service - Phase 4
 * Implements contextual risk assessment for sessions and adaptive authentication
 */

import { logger } from "../utils/logger";
import crypto from "crypto";

export interface SessionRiskFactors {
  // Device and Browser
  newDevice: boolean;
  newBrowser: boolean;
  newLocation: boolean;

  // Behavioral
  unusualTime: boolean;
  unusualVelocity: boolean; // Impossible travel
  unusualActivity: boolean;

  // Network
  suspiciousIP: boolean;
  vpnOrProxy: boolean;
  torNetwork: boolean;

  // Historical
  recentFailedLogins: number;
  accountAge: number; // days
  lastSuccessfulLogin?: Date;

  // Context
  highValueOperation: boolean;
  sensitiveDataAccess: boolean;
}

export interface RiskScore {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  requiresMFA: boolean;
  requiresStepUp: boolean; // Additional verification
  blockSession: boolean;
  factors: string[];
  confidence: number; // 0-1
  reasoning: string;
}

export interface SessionContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
  };
  deviceFingerprint?: string;
  timestamp: Date;
}

export interface UserHistoricalData {
  accountCreatedAt: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  lastLoginLocation?: string;
  typicalLoginTimes: number[]; // Hours of day (0-23)
  knownDevices: string[];
  knownLocations: string[];
  recentFailedAttempts: number;
}

class SessionRiskScoringService {
  private readonly RISK_WEIGHTS = {
    newDevice: 15,
    newBrowser: 10,
    newLocation: 20,
    unusualTime: 5,
    unusualVelocity: 30,
    unusualActivity: 15,
    suspiciousIP: 25,
    vpnOrProxy: 10,
    torNetwork: 35,
    recentFailedLogins: 20,
    newAccount: 10,
    highValueOperation: 15,
    sensitiveDataAccess: 10,
  };

  private readonly MFA_THRESHOLD = 40;
  private readonly STEP_UP_THRESHOLD = 60;
  private readonly BLOCK_THRESHOLD = 80;

  /**
   * Calculate session risk score
   */
  async calculateRiskScore(
    sessionContext: SessionContext,
    historicalData: UserHistoricalData,
    operationContext?: {
      operation: string;
      isHighValue?: boolean;
      isSensitiveData?: boolean;
    }
  ): Promise<RiskScore> {
    try {
      logger.info("Calculating session risk score", {
        userId: sessionContext.userId,
        ipAddress: sessionContext.ipAddress,
      });

      // Analyze risk factors
      const factors = await this.analyzeRiskFactors(
        sessionContext,
        historicalData,
        operationContext
      );

      // Calculate weighted score
      const score = this.calculateWeightedScore(factors);

      // Determine risk level and actions
      const level = this.determineRiskLevel(score);
      const requiresMFA = score >= this.MFA_THRESHOLD;
      const requiresStepUp = score >= this.STEP_UP_THRESHOLD;
      const blockSession = score >= this.BLOCK_THRESHOLD;

      // Build reasoning
      const reasoning = this.buildReasoning(factors, score);

      // Calculate confidence
      const confidence = this.calculateConfidence(factors, historicalData);

      const riskScore: RiskScore = {
        score,
        level,
        requiresMFA,
        requiresStepUp,
        blockSession,
        factors: this.getActiveFactors(factors),
        confidence,
        reasoning,
      };

      logger.info("Risk score calculated", {
        userId: sessionContext.userId,
        score,
        level,
        requiresMFA,
        blockSession,
      });

      return riskScore;
    } catch (error: any) {
      logger.error("Failed to calculate risk score", {
        error: error.message,
        userId: sessionContext.userId,
      });

      // Fail secure - return high risk on error
      return {
        score: 100,
        level: "critical",
        requiresMFA: true,
        requiresStepUp: true,
        blockSession: false, // Don't block on error, just require MFA
        factors: ["error_calculating_risk"],
        confidence: 0,
        reasoning: "Error calculating risk score - requiring MFA as precaution",
      };
    }
  }

  /**
   * Analyze individual risk factors
   */
  private async analyzeRiskFactors(
    sessionContext: SessionContext,
    historicalData: UserHistoricalData,
    operationContext?: {
      operation: string;
      isHighValue?: boolean;
      isSensitiveData?: boolean;
    }
  ): Promise<SessionRiskFactors> {
    const deviceFingerprint = sessionContext.deviceFingerprint ||
      this.generateDeviceFingerprint(sessionContext.userAgent, sessionContext.ipAddress);

    // Check device and browser
    const newDevice = !historicalData.knownDevices.includes(deviceFingerprint);
    const newBrowser = this.isNewBrowser(sessionContext.userAgent, historicalData);

    // Check location
    const locationKey = sessionContext.location
      ? `${sessionContext.location.country}-${sessionContext.location.city}`
      : sessionContext.ipAddress;
    const newLocation = !historicalData.knownLocations.includes(locationKey);

    // Check time-based patterns
    const currentHour = sessionContext.timestamp.getHours();
    const unusualTime = this.isUnusualTime(currentHour, historicalData.typicalLoginTimes);

    // Check velocity (impossible travel)
    const unusualVelocity = this.checkImpossibleTravel(
      sessionContext,
      historicalData.lastLoginAt,
      historicalData.lastLoginLocation
    );

    // Check IP reputation
    const suspiciousIP = this.isSuspiciousIP(sessionContext.ipAddress);
    const vpnOrProxy = this.isVPNOrProxy(sessionContext.ipAddress);
    const torNetwork = this.isTorNetwork(sessionContext.ipAddress);

    // Check account age
    const accountAgeMs = Date.now() - historicalData.accountCreatedAt.getTime();
    const accountAge = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

    // Operation context
    const highValueOperation = operationContext?.isHighValue || false;
    const sensitiveDataAccess = operationContext?.isSensitiveData || false;

    return {
      newDevice,
      newBrowser,
      newLocation,
      unusualTime,
      unusualVelocity,
      unusualActivity: false, // Would be determined by behavioral analysis
      suspiciousIP,
      vpnOrProxy,
      torNetwork,
      recentFailedLogins: historicalData.recentFailedAttempts,
      accountAge,
      lastSuccessfulLogin: historicalData.lastLoginAt,
      highValueOperation,
      sensitiveDataAccess,
    };
  }

  /**
   * Calculate weighted risk score
   */
  private calculateWeightedScore(factors: SessionRiskFactors): number {
    let score = 0;

    if (factors.newDevice) score += this.RISK_WEIGHTS.newDevice;
    if (factors.newBrowser) score += this.RISK_WEIGHTS.newBrowser;
    if (factors.newLocation) score += this.RISK_WEIGHTS.newLocation;
    if (factors.unusualTime) score += this.RISK_WEIGHTS.unusualTime;
    if (factors.unusualVelocity) score += this.RISK_WEIGHTS.unusualVelocity;
    if (factors.unusualActivity) score += this.RISK_WEIGHTS.unusualActivity;
    if (factors.suspiciousIP) score += this.RISK_WEIGHTS.suspiciousIP;
    if (factors.vpnOrProxy) score += this.RISK_WEIGHTS.vpnOrProxy;
    if (factors.torNetwork) score += this.RISK_WEIGHTS.torNetwork;
    if (factors.highValueOperation) score += this.RISK_WEIGHTS.highValueOperation;
    if (factors.sensitiveDataAccess) score += this.RISK_WEIGHTS.sensitiveDataAccess;

    // Failed login attempts
    if (factors.recentFailedLogins > 0) {
      score += Math.min(factors.recentFailedLogins * 5, this.RISK_WEIGHTS.recentFailedLogins);
    }

    // New account penalty
    if (factors.accountAge < 7) {
      score += this.RISK_WEIGHTS.newAccount;
    }

    return Math.min(score, 100);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  /**
   * Build human-readable reasoning
   */
  private buildReasoning(factors: SessionRiskFactors, score: number): string {
    const reasons: string[] = [];

    if (factors.torNetwork) reasons.push("Login from Tor network");
    if (factors.unusualVelocity) reasons.push("Impossible travel detected");
    if (factors.suspiciousIP) reasons.push("Suspicious IP address");
    if (factors.newLocation) reasons.push("New geographic location");
    if (factors.newDevice) reasons.push("New device detected");
    if (factors.recentFailedLogins > 0) {
      reasons.push(`${factors.recentFailedLogins} recent failed login(s)`);
    }
    if (factors.vpnOrProxy) reasons.push("VPN or proxy detected");
    if (factors.highValueOperation) reasons.push("High-value operation");
    if (factors.accountAge < 7) reasons.push("Recently created account");

    if (reasons.length === 0) {
      return "Normal session activity";
    }

    return reasons.join("; ");
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    factors: SessionRiskFactors,
    historicalData: UserHistoricalData
  ): number {
    let confidence = 0.5; // Base confidence

    // More historical data = higher confidence
    if (historicalData.knownDevices.length > 5) confidence += 0.1;
    if (historicalData.knownLocations.length > 3) confidence += 0.1;
    if (factors.accountAge > 30) confidence += 0.2;
    if (historicalData.lastLoginAt) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Get list of active risk factors
   */
  private getActiveFactors(factors: SessionRiskFactors): string[] {
    const active: string[] = [];

    if (factors.newDevice) active.push("new_device");
    if (factors.newBrowser) active.push("new_browser");
    if (factors.newLocation) active.push("new_location");
    if (factors.unusualTime) active.push("unusual_time");
    if (factors.unusualVelocity) active.push("impossible_travel");
    if (factors.suspiciousIP) active.push("suspicious_ip");
    if (factors.vpnOrProxy) active.push("vpn_proxy");
    if (factors.torNetwork) active.push("tor_network");
    if (factors.recentFailedLogins > 0) active.push("failed_logins");
    if (factors.accountAge < 7) active.push("new_account");
    if (factors.highValueOperation) active.push("high_value_op");
    if (factors.sensitiveDataAccess) active.push("sensitive_data");

    return active;
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}:${ipAddress}`;
    return crypto.createHash("sha256").update(data).digest("hex").substring(0, 32);
  }

  /**
   * Check if browser is new
   */
  private isNewBrowser(userAgent: string, historicalData: UserHistoricalData): boolean {
    // Simple browser detection - in production use a proper UA parser
    const browser = userAgent.toLowerCase();
    const knownBrowsers = historicalData.knownDevices
      .map(d => d.toLowerCase())
      .join(" ");

    if (browser.includes("chrome") && knownBrowsers.includes("chrome")) return false;
    if (browser.includes("firefox") && knownBrowsers.includes("firefox")) return false;
    if (browser.includes("safari") && knownBrowsers.includes("safari")) return false;

    return true;
  }

  /**
   * Check if login time is unusual
   */
  private isUnusualTime(currentHour: number, typicalHours: number[]): boolean {
    if (typicalHours.length === 0) return false;

    // Check if current hour is within 2 hours of any typical hour
    return !typicalHours.some(hour => Math.abs(hour - currentHour) <= 2);
  }

  /**
   * Check for impossible travel
   */
  private checkImpossibleTravel(
    sessionContext: SessionContext,
    lastLoginAt?: Date,
    lastLoginLocation?: string
  ): boolean {
    if (!lastLoginAt || !lastLoginLocation || !sessionContext.location) {
      return false;
    }

    // Check if login happened within 1 hour
    const timeDiffMs = sessionContext.timestamp.getTime() - lastLoginAt.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    if (timeDiffHours > 1) {
      return false; // Enough time has passed
    }

    // Check if location is different
    const currentLocation = `${sessionContext.location.country}-${sessionContext.location.city}`;
    if (currentLocation === lastLoginLocation) {
      return false; // Same location
    }

    // Simple heuristic: different country within 1 hour = suspicious
    const currentCountry = sessionContext.location.country;
    const lastCountry = lastLoginLocation.split("-")[0];

    return currentCountry !== lastCountry;
  }

  /**
   * Check if IP is suspicious (mock implementation)
   */
  private isSuspiciousIP(ipAddress: string): boolean {
    // In production, integrate with IP reputation services
    // For now, simple heuristics
    const suspiciousRanges = ["10.0.0.", "192.168.", "172.16."];
    return suspiciousRanges.some(range => ipAddress.startsWith(range));
  }

  /**
   * Check if IP is VPN or proxy (mock implementation)
   */
  private isVPNOrProxy(ipAddress: string): boolean {
    // In production, integrate with VPN detection services
    // Mock implementation
    return false;
  }

  /**
   * Check if IP is Tor exit node (mock implementation)
   */
  private isTorNetwork(ipAddress: string): boolean {
    // In production, check against Tor exit node list
    // Mock implementation
    return false;
  }

  /**
   * Determine if MFA should be required based on risk
   */
  shouldRequireMFA(riskScore: RiskScore): boolean {
    return riskScore.requiresMFA || riskScore.score >= this.MFA_THRESHOLD;
  }

  /**
   * Determine if session should be blocked
   */
  shouldBlockSession(riskScore: RiskScore): boolean {
    return riskScore.blockSession || riskScore.score >= this.BLOCK_THRESHOLD;
  }
}

export const sessionRiskScoringService = new SessionRiskScoringService();
