/**
 * AI Guardrails Service - Phase 3
 * Implements prompt shields, PII redaction, output classifiers, and content moderation
 */

import { db } from "../db";
import { aiGuardrailsLogs } from "../../shared/schema";
import { logger } from "../utils/logger";
import crypto from "crypto";

// Prompt Risk Keywords (potential injection attempts, harmful content)
const HIGH_RISK_KEYWORDS = [
  "ignore previous instructions",
  "disregard",
  "forget all previous",
  "new instructions",
  "system:",
  "admin mode",
  "developer mode",
  "jailbreak",
  "bypass",
];

const MODERATE_RISK_KEYWORDS = [
  "confidential",
  "secret",
  "password",
  "token",
  "api key",
  "private key",
];

export interface GuardrailCheckResult {
  allowed: boolean;
  action: "allowed" | "blocked" | "redacted" | "flagged" | "human_review_required";
  severity: "low" | "medium" | "high" | "critical";
  sanitizedPrompt?: string;
  sanitizedResponse?: string;
  piiDetected: boolean;
  piiTypes: string[];
  promptRiskScore: number;
  responseRiskScore?: number;
  requiresHumanReview: boolean;
  contentCategories: string[];
  moderationFlags?: {
    hate: number;
    harassment: number;
    violence: number;
    sexual: number;
    selfHarm: number;
    pii: number;
  };
  logId?: string;
}

class AIGuardrailsService {
  /**
   * Main guardrails check - Run all checks on input and output
   */
  async checkGuardrails(
    prompt: string,
    response: string | null,
    context: {
      userId?: string;
      organizationId?: string;
      requestId: string;
      modelProvider: string;
      modelName: string;
      ipAddress?: string;
    }
  ): Promise<GuardrailCheckResult> {
    const startTime = Date.now();

    // Validate required context fields
    if (!context.requestId) {
      throw new Error('requestId is required in context');
    }

    try {
      // 1. Prompt Shield - Check for injection attempts
      const promptShieldResult = this.promptShield(prompt);

      // 2. PII Detection and Redaction
      const piiResult = this.detectAndRedactPII(prompt);

      // 3. Risk Scoring
      const promptRiskScore = this.calculateRiskScore(prompt, promptShieldResult);

      // 4. Response Analysis (if response provided)
      let responseRiskScore = 0;
      let sanitizedResponse = response;
      let responseContentCategories: string[] = [];
      let responsePiiResult = { detected: false, types: [] as string[], sanitized: '' };

      if (response) {
        const responseAnalysis = this.analyzeResponse(response);
        responseRiskScore = responseAnalysis.riskScore;
        sanitizedResponse = responseAnalysis.sanitizedResponse;
        responseContentCategories = responseAnalysis.contentCategories;
        responsePiiResult = responseAnalysis.piiResult;
      }

      // Combine PII detection from prompt and response
      const combinedPiiDetected = piiResult.detected || responsePiiResult.detected;
      const combinedPiiTypes = [...new Set([...piiResult.types, ...responsePiiResult.types])];

      // 5. Determine action and severity
      const severity = this.determineSeverity(promptRiskScore, responseRiskScore);
      const requiresHumanReview = promptRiskScore > 8.5 && promptRiskScore < 10;

      let action: GuardrailCheckResult["action"] = "allowed";
      if (promptRiskScore >= 10 || responseRiskScore >= 10) {
        action = "blocked";
      } else if (severity === "critical" || promptRiskScore >= 8.0 || responseRiskScore >= 8.0) {
        action = "blocked";
      } else if (requiresHumanReview) {
        action = "human_review_required";
      } else if (promptRiskScore > 7.0 || responseRiskScore > 7.0) {
        action = "blocked";
      } else if (combinedPiiDetected) {
        action = "redacted";
      } else if (promptRiskScore > 5.0) {
        action = "flagged";
      }

      const allowed = action === "allowed" || action === "redacted" || action === "flagged";

      // 6. Content categorization
      const contentCategories = [
        ...combinedPiiTypes.map(t => `pii_${t}`),
        ...promptShieldResult.riskFactors,
        ...responseContentCategories,
      ];

      // 7. Mock moderation flags (in production, use OpenAI Moderation API)
      const moderationFlags = this.getModerationFlags(prompt, response);

      // 8. Log to database (ONLY store sanitized data to prevent PII leakage)
      const logId = await this.logGuardrailCheck({
        organizationId: context.organizationId,
        userId: context.userId,
        requestId: context.requestId,
        guardrailType: "comprehensive",
        action,
        severity,
        originalPrompt: piiResult.sanitized, // Store sanitized version only
        sanitizedPrompt: piiResult.sanitized,
        promptRiskScore,
        piiDetected: piiResult.detected,
        piiTypes: piiResult.types,
        piiRedacted: piiResult.detected,
        originalResponse: sanitizedResponse, // Store sanitized version only
        sanitizedResponse,
        responseRiskScore,
        contentCategories,
        moderationFlags,
        requiresHumanReview,
        modelProvider: context.modelProvider,
        modelName: context.modelName,
        processingTimeMs: Date.now() - startTime,
        ipAddress: context.ipAddress,
      });

      return {
        allowed,
        action,
        severity,
        sanitizedPrompt: piiResult.sanitized,
        sanitizedResponse: sanitizedResponse ?? undefined,
        piiDetected: combinedPiiDetected,
        piiTypes: combinedPiiTypes,
        promptRiskScore,
        responseRiskScore,
        requiresHumanReview,
        contentCategories,
        moderationFlags,
        logId,
      };
    } catch (error: any) {
      logger.error("Guardrails check failed", { error: error.message });
      // Fail secure - if guardrails fail, block the request
      return {
        allowed: false,
        action: "blocked",
        severity: "critical",
        piiDetected: false,
        piiTypes: [],
        promptRiskScore: 10,
        requiresHumanReview: true,
        contentCategories: ["error"],
      };
    }
  }

  /**
   * Prompt Shield - Detect prompt injection attempts
   */
  private promptShield(prompt: string): { blocked: boolean; riskFactors: string[] } {
    const riskFactors: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Check for high-risk keywords
    for (const keyword of HIGH_RISK_KEYWORDS) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        riskFactors.push(`injection_attempt_${keyword.replace(/\s+/g, "_")}`);
      }
    }

    // Special check for "ignore" with "instructions" or "prompts"
    if (lowerPrompt.includes("ignore") && (lowerPrompt.includes("instructions") || lowerPrompt.includes("prompts"))) {
      riskFactors.push("prompt_injection");
    }

    // Check for moderate-risk keywords
    for (const keyword of MODERATE_RISK_KEYWORDS) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        riskFactors.push(`sensitive_${keyword.replace(/\s+/g, "_")}`);
      }
    }

    // Check for unusual patterns
    if (prompt.includes("```") || prompt.includes("---")) {
      riskFactors.push("code_block_detected");
    }

    // Check for potential XSS
    if (/<script[^>]*>.*?<\/script>/i.test(prompt) ||
        (/<[^>]+>/.test(prompt) && /(?:alert|onerror|onclick|onload)\s*\(/i.test(prompt))) {
      riskFactors.push("potential_xss");
    } else if (/[<>]/g.test(prompt)) {
      riskFactors.push("html_tags_detected");
    }

    const blocked = riskFactors.some(rf => rf.startsWith("injection_attempt"));

    return { blocked, riskFactors };
  }

  /**
   * PII Detection and Redaction
   * Creates fresh RegExp instances to avoid lastIndex state bugs with global patterns
   */
  private detectAndRedactPII(text: string): {
    detected: boolean;
    types: string[];
    sanitized: string;
  } {
    const detectedTypes: string[] = [];
    let sanitized = text;

    // PII pattern source strings (without flags) for fresh instantiation
    const piiPatternSources: Record<string, string> = {
      email: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      ssn: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      credit_card: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
      phone: '\\b(\\+\\d{1,2}\\s?)?((\\(\\d{3}\\)|\\d{3})[\\s.-]?\\d{3}[\\s.-]?\\d{4}|\\d{3}-\\d{4})\\b',
      ip_address: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    };

    // Detect and redact each PII type with fresh regex instances
    for (const [type, patternSource] of Object.entries(piiPatternSources)) {
      // Create fresh regex for detection
      const detectPattern = new RegExp(patternSource, 'g');
      if (detectPattern.test(text)) {
        detectedTypes.push(type);
        // Create fresh regex for replacement
        const replacePattern = new RegExp(patternSource, 'g');
        sanitized = sanitized.replace(replacePattern, `[REDACTED_${type.toUpperCase()}]`);
      }
    }

    return {
      detected: detectedTypes.length > 0,
      types: detectedTypes,
      sanitized,
    };
  }

  /**
   * Calculate Risk Score (0-10)
   */
  private calculateRiskScore(prompt: string, shieldResult: { blocked: boolean; riskFactors: string[] }): number {
    let score = 0;

    // Check for prompt injection specifically (high priority)
    if (shieldResult.riskFactors.includes("prompt_injection")) {
      score += 8;
    }

    // Add points for each injection attempt
    const injectionAttempts = shieldResult.riskFactors.filter(rf => rf.startsWith("injection_attempt")).length;
    score += injectionAttempts * 4;

    // Base score from shield (add extra points to ensure blocking)
    if (shieldResult.blocked) {
      score += 4;
    }

    const sensitiveKeywords = shieldResult.riskFactors.filter(rf => rf.startsWith("sensitive_")).length;
    score += sensitiveKeywords * 0.5;

    // Length-based risk (very long prompts might be attacks)
    if (prompt.length > 10000) {
      score += 1;
    }

    // Cap at 10
    return Math.min(score, 10);
  }

  /**
   * Analyze Response Content
   */
  private analyzeResponse(response: string): {
    riskScore: number;
    sanitizedResponse: string;
    contentCategories: string[];
    piiResult: { detected: boolean; types: string[]; sanitized: string };
  } {
    let riskScore = 0;
    const contentCategories: string[] = [];

    // Check for PII in response
    const piiResult = this.detectAndRedactPII(response);
    if (piiResult.detected) {
      riskScore += 2;
      contentCategories.push("contains_pii");
    }

    // Check for code blocks (might contain secrets)
    if (response.includes("```")) {
      contentCategories.push("contains_code");
    }

    // Check for discriminatory or harmful content
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes("discriminat")) {
      riskScore += 3;
      contentCategories.push("potentially_harmful");
    }

    // Check for common harmful patterns
    const harmfulPatterns = [
      /\b(password|secret|token|api[_\s]key)\s*[:=]/gi,
      /\b(kill|harm|hurt|attack)\b/gi,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(response)) {
        riskScore += 1;
        contentCategories.push("potentially_harmful");
      }
    }

    return {
      riskScore: Math.min(riskScore, 10),
      sanitizedResponse: piiResult.sanitized,
      contentCategories,
      piiResult,
    };
  }

  /**
   * Determine Severity Level
   */
  private determineSeverity(promptRiskScore: number, responseRiskScore: number): "low" | "medium" | "high" | "critical" {
    const maxScore = Math.max(promptRiskScore, responseRiskScore);

    if (maxScore >= 8) return "critical";
    if (maxScore >= 6) return "high";
    if (maxScore >= 4) return "medium";
    return "low";
  }

  /**
   * Get Moderation Flags
   * In production, integrate with OpenAI Moderation API or similar
   */
  private getModerationFlags(prompt: string, response: string | null): {
    hate: number;
    harassment: number;
    violence: number;
    sexual: number;
    selfHarm: number;
    pii: number;
  } {
    // Mock implementation - replace with actual moderation API
    const combined = `${prompt} ${response || ""}`.toLowerCase();

    return {
      hate: combined.includes("hate") ? 0.8 : 0.1,
      harassment: combined.includes("harass") ? 0.7 : 0.1,
      violence: combined.includes("violen") || combined.includes("kill") ? 0.6 : 0.1,
      sexual: combined.includes("sexual") || combined.includes("explicit") ? 0.5 : 0.1,
      selfHarm: combined.includes("suicide") || combined.includes("self-harm") ? 0.9 : 0.1,
      pii: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(combined) ? 0.8 : 0.1,
    };
  }

  /**
   * Log Guardrail Check to Database
   */
  private async logGuardrailCheck(data: {
    organizationId?: string;
    userId?: string;
    requestId: string;
    guardrailType: string;
    action: string;
    severity: string;
    originalPrompt: string;
    sanitizedPrompt: string;
    promptRiskScore: number;
    piiDetected: boolean;
    piiTypes: string[];
    piiRedacted: boolean;
    originalResponse: string | null;
    sanitizedResponse: string | null;
    responseRiskScore: number;
    contentCategories: string[];
    moderationFlags: any;
    requiresHumanReview: boolean;
    modelProvider: string;
    modelName: string;
    processingTimeMs: number;
    ipAddress?: string;
  }): Promise<string> {
    try {
      const [log] = await db.insert(aiGuardrailsLogs).values({
        organizationId: data.organizationId,
        userId: data.userId,
        requestId: data.requestId,
        guardrailType: data.guardrailType,
        action: data.action,
        severity: data.severity as "low" | "medium" | "high" | "critical",
        originalPrompt: data.originalPrompt,
        sanitizedPrompt: data.sanitizedPrompt,
        promptRiskScore: data.promptRiskScore.toString(),
        piiDetected: data.piiDetected,
        piiTypes: data.piiTypes,
        piiRedacted: data.piiRedacted,
        originalResponse: data.originalResponse,
        sanitizedResponse: data.sanitizedResponse,
        responseRiskScore: data.responseRiskScore.toString(),
        contentCategories: data.contentCategories,
        moderationFlags: data.moderationFlags,
        requiresHumanReview: data.requiresHumanReview,
        modelProvider: data.modelProvider,
        modelName: data.modelName,
        processingTimeMs: data.processingTimeMs,
        ipAddress: data.ipAddress,
      }).returning({ id: aiGuardrailsLogs.id });

      return log.id;
    } catch (error: any) {
      logger.error("Failed to log guardrail check", { error: error.message });
      throw error;
    }
  }

  /**
   * Get Guardrail Logs for Organization
   */
  async getGuardrailLogs(organizationId: string, options?: {
    severity?: string;
    requiresReview?: boolean;
    limit?: number;
    offset?: number;
  }) {
    // Implementation would use drizzle queries
    logger.info("Fetching guardrail logs", { organizationId, options });
    // TODO: Implement actual query
    return [];
  }

  /**
   * Submit Human Review Decision
   */
  async submitHumanReview(
    logId: string,
    reviewedBy: string,
    decision: "approved" | "rejected" | "modified",
    notes?: string
  ) {
    try {
      // Update the log with human review decision
      logger.info("Submitting human review", { logId, decision, reviewedBy });
      // TODO: Implement actual update
      return { success: true };
    } catch (error: any) {
      logger.error("Failed to submit human review", { error: error.message });
      throw error;
    }
  }
}

export const aiGuardrailsService = new AIGuardrailsService();
