export type AIOutputClassificationLabel = "empty" | "safe" | "sensitive" | "high_risk";

export interface AIOutputClassification {
  label: AIOutputClassificationLabel;
  score: number;
  tags: string[];
}

const HIGH_RISK_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /api[_\s]?key\s*[:=]/i,
  /password\s*[:=]/i,
  /private[_\s]?key/i,
  /credit[_\s]?card/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

const SENSITIVE_PATTERNS = [
  /\bconfidential\b/i,
  /\binternal\s+only\b/i,
  /\brestricted\b/i,
  /\bpersonal\s+data\b/i,
  /\bpii\b/i,
];

class AIOutputClassificationService {
  classify(content: string): AIOutputClassification {
    const normalized = content.trim();
    if (!normalized) {
      return {
        label: "empty",
        score: 0,
        tags: ["empty_content"],
      };
    }

    const highRiskTags = HIGH_RISK_PATTERNS
      .map((pattern, index) => (pattern.test(normalized) ? `high_risk_pattern_${index + 1}` : null))
      .filter((tag): tag is string => Boolean(tag));
    if (highRiskTags.length > 0) {
      return {
        label: "high_risk",
        score: 90,
        tags: highRiskTags,
      };
    }

    const sensitiveTags = SENSITIVE_PATTERNS
      .map((pattern, index) => (pattern.test(normalized) ? `sensitive_pattern_${index + 1}` : null))
      .filter((tag): tag is string => Boolean(tag));
    if (sensitiveTags.length > 0) {
      return {
        label: "sensitive",
        score: 65,
        tags: sensitiveTags,
      };
    }

    return {
      label: "safe",
      score: 20,
      tags: ["general_safe_output"],
    };
  }
}

export const aiOutputClassificationService = new AIOutputClassificationService();
