import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { 
  InsertGapAnalysisReport, 
  InsertGapAnalysisFinding, 
  InsertRemediationRecommendation,
  GapAnalysisReport,
  GapAnalysisFinding
} from '../../shared/schema';

describe('Gap Analysis Unit Tests', () => {
  let storage: MemStorage;
  let organizationId: string;
  let userId: string;
  let companyProfileId: string;

  beforeEach(async () => {
    storage = new MemStorage();

    const user = await storage.createUser({
      email: 'gap.test@example.com',
      firstName: 'Gap',
      lastName: 'Test',
      role: 'user'
    });
    userId = user.id;

    const org = await storage.createOrganization({
      name: 'Gap Test Org',
      slug: 'gap-test-org'
    });
    organizationId = org.id;

    const profile = await storage.createCompanyProfile({
      organizationId: org.id,
      createdBy: user.id,
      companyName: 'Gap Analysis Test Company',
      industry: 'Technology',
      companySize: '51-200',
      headquarters: 'San Francisco, CA',
      dataClassification: 'Confidential',
      businessApplications: 'Web applications',
      cloudInfrastructure: ['AWS', 'GCP'],
      complianceFrameworks: ['SOC2', 'ISO27001', 'FedRAMP']
    });
    companyProfileId = profile.id;
  });

  describe('Gap Analysis Report Operations', () => {
    it('should create a gap analysis report', async () => {
      const reportData: InsertGapAnalysisReport = {
        organizationId,
        framework: 'soc2',
        status: 'pending',
        overallScore: 0
      };

      const report = await storage.createGapAnalysisReport(reportData);
      expect(report.id).toBeDefined();
      expect(report.framework).toBe('soc2');
      expect(report.status).toBe('pending');
    });

    it('should retrieve gap analysis reports by organization', async () => {
      await storage.createGapAnalysisReport({
        organizationId,
        framework: 'soc2',
        status: 'completed',
        overallScore: 75
      });

      await storage.createGapAnalysisReport({
        organizationId,
        framework: 'iso27001',
        status: 'completed',
        overallScore: 82
      });

      const reports = await storage.getGapAnalysisReports(organizationId);
      expect(reports.length).toBe(2);
    });

    it('should get a single gap analysis report', async () => {
      const created = await storage.createGapAnalysisReport({
        organizationId,
        framework: 'fedramp',
        status: 'in_progress',
        overallScore: 50
      });

      const retrieved = await storage.getGapAnalysisReport(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.framework).toBe('fedramp');
    });

    it('should update gap analysis report status', async () => {
      const report = await storage.createGapAnalysisReport({
        organizationId,
        framework: 'soc2',
        status: 'pending',
        overallScore: 0
      });

      const updated = await storage.updateGapAnalysisReport(report.id, {
        status: 'completed',
        overallScore: 85
      });

      expect(updated.status).toBe('completed');
      expect(updated.overallScore).toBe(85);
    });
  });

  describe('Gap Analysis Findings', () => {
    let reportId: string;

    beforeEach(async () => {
      const report = await storage.createGapAnalysisReport({
        organizationId,
        framework: 'soc2',
        status: 'in_progress',
        overallScore: 0
      });
      reportId = report.id;
    });

    it('should create a gap analysis finding', async () => {
      const findingData: InsertGapAnalysisFinding = {
        reportId,
        controlId: 'CC1.1',
        controlTitle: 'Control Environment',
        currentStatus: 'partially_implemented',
        riskLevel: 'high',
        gapDescription: 'Missing formal security policies',
        businessImpact: 'Increased risk of security incidents',
        complianceScore: 50,
        priority: 1
      };

      const finding = await storage.createGapAnalysisFinding(findingData);
      expect(finding.id).toBeDefined();
      expect(finding.controlId).toBe('CC1.1');
      expect(finding.riskLevel).toBe('high');
    });

    it('should get findings for a report', async () => {
      await storage.createGapAnalysisFinding({
        reportId,
        controlId: 'CC1.1',
        controlTitle: 'Control Environment',
        currentStatus: 'not_implemented',
        riskLevel: 'high',
        gapDescription: 'Finding 1',
        businessImpact: 'Impact 1',
        complianceScore: 30,
        priority: 1
      });

      await storage.createGapAnalysisFinding({
        reportId,
        controlId: 'CC1.2',
        controlTitle: 'Communication',
        currentStatus: 'partially_implemented',
        riskLevel: 'medium',
        gapDescription: 'Finding 2',
        businessImpact: 'Impact 2',
        complianceScore: 60,
        priority: 2
      });

      const findings = await storage.getGapAnalysisFindings(reportId);
      expect(findings.length).toBe(2);
    });

    it('should handle different risk levels', async () => {
      const riskLevels: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
      
      for (const riskLevel of riskLevels) {
        const finding = await storage.createGapAnalysisFinding({
          reportId,
          controlId: `TEST-${riskLevel}`,
          controlTitle: `${riskLevel} Test`,
          currentStatus: 'not_implemented',
          riskLevel: riskLevel,
          gapDescription: `${riskLevel} finding`,
          businessImpact: 'Test impact',
          complianceScore: 50,
          priority: 1
        });
        expect(finding.riskLevel).toBe(riskLevel);
      }
    });
  });

  describe('Remediation Recommendations', () => {
    let findingId: string;

    beforeEach(async () => {
      const report = await storage.createGapAnalysisReport({
        organizationId,
        framework: 'soc2',
        status: 'in_progress',
        overallScore: 0
      });

      const finding = await storage.createGapAnalysisFinding({
        reportId: report.id,
        controlId: 'CC1.1',
        controlTitle: 'Control Environment',
        currentStatus: 'not_implemented',
        riskLevel: 'high',
        gapDescription: 'Test finding',
        businessImpact: 'Test impact',
        complianceScore: 40,
        priority: 1
      });
      findingId = finding.id;
    });

    it('should create a remediation recommendation', async () => {
      const recommendation = await storage.createRemediationRecommendation({
        findingId,
        title: 'Implement Security Policy',
        description: 'Create and implement a formal security policy document',
        implementation: 'Draft policy, review with stakeholders, approve and publish',
        timeframe: 'short_term',
        priority: 1,
        status: 'pending'
      });

      expect(recommendation.id).toBeDefined();
      expect(recommendation.title).toBe('Implement Security Policy');
      expect(recommendation.timeframe).toBe('short_term');
    });

    it('should get recommendations for a finding', async () => {
      await storage.createRemediationRecommendation({
        findingId,
        title: 'Recommendation 1',
        description: 'Description 1',
        implementation: 'Implementation 1',
        timeframe: 'immediate',
        priority: 1,
        status: 'pending'
      });

      await storage.createRemediationRecommendation({
        findingId,
        title: 'Recommendation 2',
        description: 'Description 2',
        implementation: 'Implementation 2',
        timeframe: 'medium_term',
        priority: 2,
        status: 'pending'
      });

      const recommendations = await storage.getRemediationRecommendations(findingId);
      expect(recommendations.length).toBe(2);
    });

    it('should update recommendation status', async () => {
      const recommendation = await storage.createRemediationRecommendation({
        findingId,
        title: 'Update Test',
        description: 'Test description',
        implementation: 'Test implementation',
        timeframe: 'short_term',
        priority: 1,
        status: 'pending'
      });

      const updated = await storage.updateRemediationRecommendation(recommendation.id, {
        status: 'in_progress'
      });

      expect(updated.status).toBe('in_progress');
    });

    it('should handle different timeframes', async () => {
      const timeframes: Array<'immediate' | 'short_term' | 'medium_term' | 'long_term'> = ['immediate', 'short_term', 'medium_term', 'long_term'];

      for (const timeframe of timeframes) {
        const recommendation = await storage.createRemediationRecommendation({
          findingId,
          title: `${timeframe} Priority`,
          description: 'Test',
          implementation: 'Test implementation',
          timeframe: timeframe,
          priority: 1,
          status: 'pending'
        });
        expect(recommendation.timeframe).toBe(timeframe);
      }
    });
  });

  describe('Compliance Maturity Assessment', () => {
    it('should create compliance maturity assessment', async () => {
      const assessment = await storage.createComplianceMaturityAssessment({
        organizationId,
        framework: 'soc2',
        overallScore: 3.5,
        categoryScores: {
          'Control Environment': 4,
          'Risk Assessment': 3,
          'Control Activities': 3.5,
          'Information and Communication': 3.5,
          'Monitoring': 3
        },
        maturityLevel: 'Defined',
        recommendations: ['Improve monitoring controls', 'Enhance risk assessment process']
      });

      expect(assessment.id).toBeDefined();
      expect(assessment.overallScore).toBe(3.5);
      expect(assessment.maturityLevel).toBe('Defined');
    });

    it('should get compliance maturity assessment by org and framework', async () => {
      await storage.createComplianceMaturityAssessment({
        organizationId,
        framework: 'iso27001',
        overallScore: 4.0,
        categoryScores: {
          'Information Security Policies': 4,
          'Organization of Information Security': 4,
          'Human Resource Security': 4,
          'Asset Management': 4
        },
        maturityLevel: 'Managed',
        recommendations: ['Continue monitoring', 'Regular audits']
      });

      const assessment = await storage.getComplianceMaturityAssessment(organizationId, 'iso27001');
      expect(assessment).toBeDefined();
      expect(assessment?.framework).toBe('iso27001');
      expect(assessment?.overallScore).toBe(4.0);
    });
  });

  describe('Framework-Specific Gap Analysis', () => {
    const frameworks: Array<'soc2' | 'iso27001' | 'fedramp' | 'nist'> = ['soc2', 'iso27001', 'fedramp', 'nist'];

    frameworks.forEach(framework => {
      it(`should create gap analysis for ${framework}`, async () => {
        const report = await storage.createGapAnalysisReport({
          organizationId,
          framework,
          status: 'pending',
          overallScore: 0
        });

        expect(report.framework).toBe(framework);
      });
    });
  });
});
