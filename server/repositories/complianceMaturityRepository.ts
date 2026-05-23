import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { 
  complianceMaturityAssessments,
  type ComplianceMaturityAssessment,
  type InsertComplianceMaturityAssessment
} from "@shared/schema";

export function createComplianceMaturityRepository(dbClient: typeof db) {
  return {
    async createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment> {
        const inputOverallScore = (assessment as any).overallScore ?? (assessment as any).score ?? 3;
        const inputMaturityLevel = assessment.maturityLevel;
        
        let maturityLevel: number = 3;
        if (typeof inputMaturityLevel === 'string') {
          const map: Record<string, number> = {
            'Initial': 1,
            'Developing': 2,
            'Defined': 3,
            'Managed': 4,
            'Optimizing': 5
          };
          maturityLevel = map[inputMaturityLevel] ?? parseInt(inputMaturityLevel, 10) ?? 3;
        } else if (typeof inputMaturityLevel === 'number') {
          maturityLevel = inputMaturityLevel;
        }

        const assessmentData = assessment.assessmentData ?? {
          categoryScores: (assessment as any).categoryScores,
          overallScore: inputOverallScore,
          maturityLevelString: inputMaturityLevel,
        };
        const framework = (assessment.framework ? assessment.framework.toLowerCase() : 'soc2') as any;
        
        const [newAssessment] = await dbClient.insert(complianceMaturityAssessments)
          .values({ ...assessment, maturityLevel, assessmentData, framework })
          .returning();

        if (newAssessment) {
          const mapBack: Record<number, string> = {
            1: 'Initial',
            2: 'Developing',
            3: 'Defined',
            4: 'Managed',
            5: 'Optimizing'
          };
          return {
            ...newAssessment,
            maturityLevel: mapBack[newAssessment.maturityLevel] ?? newAssessment.maturityLevel as any,
            overallScore: (newAssessment.assessmentData as any)?.overallScore ?? newAssessment.maturityLevel,
          } as any;
        }
        return newAssessment;
      },

    async getComplianceMaturityAssessment(
        organizationId: string,
        framework: ComplianceMaturityAssessment["framework"]
      ): Promise<ComplianceMaturityAssessment | undefined> {
        const normalizedFramework = (framework ? framework.toLowerCase() : 'soc2') as any;
        const [assessment] = await dbClient.select()
          .from(complianceMaturityAssessments)
          .where(
            and(
              eq(complianceMaturityAssessments.organizationId, organizationId),
              eq(complianceMaturityAssessments.framework, normalizedFramework)
            )
          )
          .orderBy(desc(complianceMaturityAssessments.createdAt));
    
        if (assessment) {
          const mapBack: Record<number, string> = {
            1: 'Initial',
            2: 'Developing',
            3: 'Defined',
            4: 'Managed',
            5: 'Optimizing'
          };
          return {
            ...assessment,
            maturityLevel: mapBack[assessment.maturityLevel] ?? assessment.maturityLevel as any,
            overallScore: (assessment.assessmentData as any)?.overallScore ?? assessment.maturityLevel,
          } as any;
        }
        return assessment || undefined;
      },

  };
}
