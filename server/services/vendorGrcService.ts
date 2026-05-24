import { storage } from "../storage";
import { logger } from "../utils/logger";

export interface VendorRiskScore {
  vendorId: string;
  vendorName: string;
  overallScore: number;       // 0-100, higher = more risk
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: {
    securityStatus: number;    // 0-30 points
    dataClassification: number; // 0-25 points
    certifications: number;    // 0-20 points
    questionnairesComplete: number; // 0-25 points
  };
  recommendations: string[];
}

/**
 * Vendor GRC Service
 * Calculates third-party sub-processor risk scores and provides
 * compliance posture reporting for vendor inventories.
 * Uses existing vendor schema columns: securityStatus, dataClassification,
 * soc2Status, iso27001Status.
 */
class VendorGrcService {
  /**
   * Compute a risk score for a single vendor.
   */
  async computeVendorRiskScore(vendorId: string): Promise<VendorRiskScore | null> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) return null;

    const questionnaires = await storage.getVendorQuestionnaires(vendorId);

    let securityScore = 0;
    let dataScore = 0;
    let certScore = 0;
    let questionnaireScore = 25;

    const recommendations: string[] = [];

    // 1. Security status contribution (0-30)
    const statusMap: Record<string, number> = {
      approved: 0,
      pending: 15,
      requires_review: 20,
      rejected: 30,
    };
    securityScore = statusMap[vendor.securityStatus || "pending"] ?? 15;
    if (securityScore >= 20) {
      recommendations.push("Vendor requires security review – initiate assessment.");
    }

    // 2. Data classification contribution (0-25)
    const classificationMap: Record<string, number> = {
      public: 0,
      standard: 8,
      confidential: 16,
      restricted: 25,
    };
    dataScore = classificationMap[vendor.dataClassification || "standard"] ?? 8;
    if (dataScore >= 16) {
      recommendations.push("Vendor handles confidential or restricted data – ensure DPA is in place.");
    }

    // 3. SOC2 / ISO27001 certifications (inverse, 0-20)
    const hasSoc2 = vendor.soc2Status === "reviewed";
    const hasIso = vendor.iso27001Status === "reviewed";
    certScore = 20 - (hasSoc2 ? 10 : 0) - (hasIso ? 10 : 0);
    if (certScore > 0) {
      recommendations.push("Request SOC 2 Type II or ISO 27001 certification evidence.");
    }

    // 4. Questionnaire completeness (0-25)
    const completedCount = questionnaires.filter(
      (q) => q.status === "completed" || q.status === "reviewed"
    ).length;
    const totalCount = questionnaires.length;
    if (totalCount === 0) {
      questionnaireScore = 25;
      recommendations.push("Send an initial security questionnaire to assess vendor posture.");
    } else {
      questionnaireScore = Math.round((1 - completedCount / totalCount) * 25);
      if (questionnaireScore > 0) {
        recommendations.push(`${totalCount - completedCount} questionnaire(s) pending review.`);
      }
    }

    const overallScore = securityScore + dataScore + certScore + questionnaireScore;

    const riskLevel: VendorRiskScore["riskLevel"] =
      overallScore >= 75 ? "critical" :
      overallScore >= 50 ? "high" :
      overallScore >= 25 ? "medium" : "low";

    return {
      vendorId,
      vendorName: vendor.name,
      overallScore,
      riskLevel,
      factors: {
        securityStatus: securityScore,
        dataClassification: dataScore,
        certifications: certScore,
        questionnairesComplete: questionnaireScore,
      },
      recommendations,
    };
  }

  /**
   * Compute risk scores for all vendors in an organization.
   */
  async computeOrganizationVendorRiskReport(organizationId: string): Promise<{
    vendors: VendorRiskScore[];
    summary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      averageScore: number;
    };
  }> {
    const vendors = await storage.getVendors(organizationId);
    const scores: VendorRiskScore[] = [];

    for (const vendor of vendors) {
      try {
        const score = await this.computeVendorRiskScore(vendor.id);
        if (score) scores.push(score);
      } catch (err) {
        logger.warn(`[VendorGrcService] Failed to score vendor ${vendor.id}:`, err);
      }
    }

    const summary = {
      total: scores.length,
      critical: scores.filter((s) => s.riskLevel === "critical").length,
      high: scores.filter((s) => s.riskLevel === "high").length,
      medium: scores.filter((s) => s.riskLevel === "medium").length,
      low: scores.filter((s) => s.riskLevel === "low").length,
      averageScore:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b.overallScore, 0) / scores.length)
          : 0,
    };

    return { vendors: scores, summary };
  }
}

export const vendorGrcService = new VendorGrcService();
