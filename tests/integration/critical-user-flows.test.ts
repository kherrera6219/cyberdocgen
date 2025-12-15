import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { User, Organization, Document, CompanyProfile } from '../../shared/schema';

describe('Critical User Flows E2E Tests', () => {
  let storage: MemStorage;
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    storage = new MemStorage();

    testOrg = await storage.createOrganization({
      name: 'Test Organization',
      industry: 'Technology',
      size: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    testUser = await storage.createUser({
      email: 'test@example.com',
      password: 'hashedpassword',
      organizationId: testOrg.id!,
      createdAt: new Date(),
    });
  });

  describe('Flow 1: New User Onboarding to First Document', () => {
    it('should complete full onboarding flow from registration to document generation', async () => {
      // Step 1: User registration (organization already created)
      const newUser = await storage.createUser({
        email: 'newuser@example.com',
        password: 'hashedpassword',
        organizationId: testOrg.id!,
        createdAt: new Date(),
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.organizationId).toBe(testOrg.id);

      // Step 2: Create company profile
      const companyProfile = await storage.createCompanyProfile({
        organizationId: testOrg.id!,
        companyName: 'New Startup Inc',
        industry: 'Technology',
        companySize: '1-50',
        headquarters: 'San Francisco, CA',
        description: 'Innovative SaaS platform',
        complianceFrameworks: ['ISO27001'],
        cloudProviders: ['AWS'],
        dataClassification: 'Confidential',
        businessApplications: 'Web application, Mobile app',
      });

      expect(companyProfile.id).toBeDefined();
      expect(companyProfile.complianceFrameworks).toContain('ISO27001');

      // Step 3: Generate first compliance document
      const firstDocument = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Information Security Policy',
        description: 'Main security policy for the organization',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'This policy establishes the framework for information security...',
        version: '1.0',
        aiGenerated: true,
        aiModel: 'claude-3-5-sonnet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(firstDocument.id).toBeDefined();
      expect(firstDocument.aiGenerated).toBe(true);
      expect(firstDocument.status).toBe('draft');

      // Step 4: View generated document
      const document = await storage.getDocument(firstDocument.id!);
      expect(document).toBeDefined();
      expect(document?.title).toBe('Information Security Policy');

      // Step 5: Update document to in_progress
      const updatedDocument = await storage.updateDocument(firstDocument.id!, {
        status: 'in_progress',
      });

      expect(updatedDocument.status).toBe('in_progress');

      // Verify complete flow
      const orgDocuments = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      expect(orgDocuments.length).toBe(1);
      expect(orgDocuments[0].aiGenerated).toBe(true);
    });
  });

  describe('Flow 2: Bulk AI Document Generation', () => {
    it('should generate multiple documents for selected frameworks', async () => {
      // Step 1: Setup company profile with multiple frameworks
      const profile = await storage.createCompanyProfile({
        organizationId: testOrg.id!,
        companyName: 'Multi-Framework Corp',
        industry: 'Healthcare',
        companySize: '201-1000',
        headquarters: 'Boston, MA',
        complianceFrameworks: ['ISO27001', 'SOC2', 'FedRAMP'],
        cloudProviders: ['AWS', 'Azure'],
        dataClassification: 'Highly Confidential',
        businessApplications: 'Healthcare records system, Patient portal',
      });

      expect(profile.complianceFrameworks).toHaveLength(3);

      // Step 2: Initiate bulk AI generation (simulated)
      const documentsToGenerate = [
        // ISO27001 documents
        {
          title: 'ISO27001 Information Security Policy',
          framework: 'ISO27001',
          category: 'policy' as const,
        },
        {
          title: 'ISO27001 Risk Assessment Procedure',
          framework: 'ISO27001',
          category: 'procedure' as const,
        },
        // SOC2 documents
        {
          title: 'SOC2 Security Controls',
          framework: 'SOC2',
          category: 'control' as const,
        },
        {
          title: 'SOC2 Access Control Policy',
          framework: 'SOC2',
          category: 'policy' as const,
        },
        // FedRAMP documents
        {
          title: 'FedRAMP System Security Plan',
          framework: 'FedRAMP',
          category: 'plan' as const,
        },
        {
          title: 'FedRAMP Incident Response Plan',
          framework: 'FedRAMP',
          category: 'plan' as const,
        },
      ];

      // Step 3: Generate all documents
      const generatedDocs = await Promise.all(
        documentsToGenerate.map(doc =>
          storage.createDocument({
            organizationId: testOrg.id!,
            title: doc.title,
            framework: doc.framework,
            category: doc.category,
            status: 'draft',
            content: `AI-generated content for ${doc.title}`,
            version: '1.0',
            aiGenerated: true,
            aiModel: 'claude-3-5-sonnet',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        )
      );

      expect(generatedDocs).toHaveLength(6);

      // Step 4: Verify documents by framework
      const allStorageDocs = await storage.getDocuments();
      const iso27001Docs = allStorageDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'ISO27001'
      );

      const soc2Docs = allStorageDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'SOC2'
      );

      const fedrampDocs = allStorageDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'FedRAMP'
      );

      expect(iso27001Docs).toHaveLength(2);
      expect(soc2Docs).toHaveLength(2);
      expect(fedrampDocs).toHaveLength(2);

      // Step 5: Verify all are AI-generated
      const allDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      expect(allDocs.every(doc => doc.aiGenerated)).toBe(true);
    });
  });

  describe('Flow 3: Document Review and Approval Workflow', () => {
    it('should complete document review lifecycle from draft to approved', async () => {
      // Step 1: Create draft document
      const draftDoc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Data Protection Policy',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'Initial draft content',
        version: '0.1',
        aiGenerated: true,
        aiModel: 'claude-3-5-sonnet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(draftDoc.status).toBe('draft');
      expect(draftDoc.version).toBe('0.1');

      // Step 2: Reviewer marks as in_progress
      const inProgressDoc = await storage.updateDocument(draftDoc.id!, {
        status: 'in_progress',
        content: 'Updated content after initial review',
        version: '0.2',
      });

      expect(inProgressDoc.status).toBe('in_progress');
      expect(inProgressDoc.version).toBe('0.2');

      // Step 3: Further revisions
      const revisedDoc = await storage.updateDocument(draftDoc.id!, {
        content: 'Content after stakeholder feedback',
        version: '0.5',
      });

      expect(revisedDoc.version).toBe('0.5');

      // Step 4: Final approval
      const approvedDoc = await storage.updateDocument(draftDoc.id!, {
        status: 'complete',
        content: 'Final approved content',
        version: '1.0',
      });

      expect(approvedDoc.status).toBe('complete');
      expect(approvedDoc.version).toBe('1.0');

      // Step 5: Verify document history
      const finalDoc = await storage.getDocument(draftDoc.id!);
      expect(finalDoc?.status).toBe('complete');
      expect(finalDoc?.version).toBe('1.0');
    });

    it('should handle document rejection and revision flow', async () => {
      // Create document
      const doc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Access Control Policy',
        framework: 'SOC2',
        category: 'policy',
        status: 'draft',
        content: 'Initial content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Move to review
      await storage.updateDocument(doc.id!, {
        status: 'in_progress',
      });

      // Reject and send back to draft
      const rejectedDoc = await storage.updateDocument(doc.id!, {
        status: 'draft',
        content: 'Revised content addressing feedback',
        version: '1.1',
      });

      expect(rejectedDoc.status).toBe('draft');
      expect(rejectedDoc.version).toBe('1.1');

      // Re-review and approve
      await storage.updateDocument(doc.id!, {
        status: 'in_progress',
      });

      const finalDoc = await storage.updateDocument(doc.id!, {
        status: 'complete',
        version: '2.0',
      });

      expect(finalDoc.status).toBe('complete');
      expect(finalDoc.version).toBe('2.0');
    });
  });

  describe('Flow 4: Gap Analysis and Remediation', () => {
    it('should identify gaps and track remediation progress', async () => {
      // Step 1: Create initial documents (partial coverage)
      await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'ISO Policy 1',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'ISO Policy 2',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Step 2: Perform gap analysis
      const allDocs = await storage.getDocuments();
      const iso27001Docs = allDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'ISO27001'
      );

      const totalISO27001Controls = 114;
      const completedDocs = iso27001Docs.filter(d => d.status === 'complete');
      const coverage = (completedDocs.length / totalISO27001Controls) * 100;
      const gaps = totalISO27001Controls - completedDocs.length;

      expect(coverage).toBeLessThan(5); // Very low initial coverage
      expect(gaps).toBeGreaterThan(100);

      // Step 3: Generate additional documents to close gaps
      const newDocs = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          storage.createDocument({
            organizationId: testOrg.id!,
            title: `ISO Control ${i + 3}`,
            framework: 'ISO27001',
            category: 'control',
            status: 'complete',
            content: 'Control content',
            version: '1.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        )
      );

      expect(newDocs).toHaveLength(10);

      // Step 4: Re-analyze gap
      const allUpdatedDocs = await storage.getDocuments();
      const updatedDocs = allUpdatedDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'ISO27001'
      );

      const updatedCompleted = updatedDocs.filter(d => d.status === 'complete');
      const updatedCoverage = (updatedCompleted.length / totalISO27001Controls) * 100;

      expect(updatedCoverage).toBeGreaterThan(coverage);
      expect(updatedCompleted.length).toBe(12); // 2 initial + 10 new
    });
  });

  describe('Flow 5: Multi-User Collaboration', () => {
    it('should support multiple users working on same framework', async () => {
      // Create additional users
      const user2 = await storage.createUser({
        email: 'reviewer@example.com',
        password: 'hashedpassword',
        organizationId: testOrg.id!,
        createdAt: new Date(),
      });

      const user3 = await storage.createUser({
        email: 'approver@example.com',
        password: 'hashedpassword',
        organizationId: testOrg.id!,
        createdAt: new Date(),
      });

      expect(user2.id).toBeDefined();
      expect(user3.id).toBeDefined();

      // User 1 creates document
      const doc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Shared Security Policy',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'Initial content by user 1',
        version: '0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // User 2 reviews and updates (simulated)
      const reviewedDoc = await storage.updateDocument(doc.id!, {
        status: 'in_progress',
        content: 'Content updated by reviewer',
        version: '0.5',
      });

      expect(reviewedDoc.status).toBe('in_progress');

      // User 3 approves (simulated)
      const approvedDoc = await storage.updateDocument(doc.id!, {
        status: 'complete',
        version: '1.0',
      });

      expect(approvedDoc.status).toBe('complete');

      // All users can see the document
      const orgDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      expect(orgDocs).toHaveLength(1);
      expect(orgDocs[0].status).toBe('complete');
    });
  });

  describe('Flow 6: Framework Migration', () => {
    it('should support adding new frameworks and generating documents', async () => {
      // Step 1: Initial setup with ISO27001
      const initialProfile = await storage.createCompanyProfile({
        organizationId: testOrg.id!,
        companyName: 'Growing Company',
        industry: 'Finance',
        companySize: '51-200',
        headquarters: 'New York, NY',
        complianceFrameworks: ['ISO27001'],
        cloudProviders: ['AWS'],
        dataClassification: 'Confidential',
        businessApplications: 'Financial services platform',
      });

      // Create ISO27001 documents
      await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'ISO Security Policy',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Step 2: Add SOC2 framework requirement
      const updatedProfile = await storage.updateCompanyProfile(initialProfile.id!, {
        complianceFrameworks: ['ISO27001', 'SOC2'],
      });

      expect(updatedProfile.complianceFrameworks).toContain('SOC2');

      // Step 3: Generate SOC2 documents
      await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'SOC2 Security Controls',
          framework: 'SOC2',
          category: 'control',
          status: 'draft',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'SOC2 Availability Controls',
          framework: 'SOC2',
          category: 'control',
          status: 'draft',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Step 4: Verify both frameworks have documents
      const allFrameworkDocs = await storage.getDocuments();
      const iso27001Docs = allFrameworkDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'ISO27001'
      );

      const soc2Docs = allFrameworkDocs.filter(d =>
        d.organizationId === testOrg.id! && d.framework === 'SOC2'
      );

      expect(iso27001Docs).toHaveLength(1);
      expect(soc2Docs).toHaveLength(2);
    });
  });

  describe('Flow 7: Document Export and Reporting', () => {
    it('should prepare documents for export and audit', async () => {
      // Create various documents
      const docs = await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Complete Policy 1',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Complete policy content',
          version: '2.0',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-02-01'),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Complete Policy 2',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Complete policy content',
          version: '1.5',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-02-05'),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Draft Policy',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Draft content',
          version: '0.1',
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-10'),
        }),
      ]);

      // Export only completed documents
      const allExportDocs = await storage.getDocuments();
      const completedDocs = allExportDocs.filter(d =>
        d.organizationId === testOrg.id! && d.status === 'complete'
      );

      expect(completedDocs).toHaveLength(2);

      // Prepare export package (simulated)
      const exportPackage = completedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        framework: doc.framework,
        version: doc.version,
        status: doc.status,
        lastUpdated: doc.updatedAt,
      }));

      expect(exportPackage).toHaveLength(2);
      expect(exportPackage.every(doc => doc.status === 'complete')).toBe(true);
    });
  });

  describe('Flow 8: Real-time Dashboard Updates', () => {
    it('should track compliance metrics as documents are created', async () => {
      // Initial state - no documents
      let allDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      let completedCount = allDocs.filter(d => d.status === 'complete').length;

      expect(completedCount).toBe(0);

      // Create and complete documents progressively
      const doc1 = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Doc 1',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      allDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      expect(allDocs.length).toBe(1);

      // Complete first document
      await storage.updateDocument(doc1.id!, { status: 'complete' });
      allDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      completedCount = allDocs.filter(d => d.status === 'complete').length;
      expect(completedCount).toBe(1);

      // Add more documents
      const doc2 = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Doc 2',
        framework: 'ISO27001',
        category: 'policy',
        status: 'complete',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      allDocs = await storage.getDocuments().then(docs => docs.filter(d => d.organizationId === testOrg.id!));
      completedCount = allDocs.filter(d => d.status === 'complete').length;

      expect(allDocs.length).toBe(2);
      expect(completedCount).toBe(2);

      // Calculate compliance percentage
      const totalRequired = 114; // ISO27001 controls
      const compliancePercentage = (completedCount / totalRequired) * 100;

      expect(compliancePercentage).toBeGreaterThan(0);
      expect(compliancePercentage).toBeLessThan(5);
    });
  });

  describe('Flow 9: Error Recovery and Data Integrity', () => {
    it('should handle errors gracefully and maintain data integrity', async () => {
      // Create a document successfully
      const doc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Important Policy',
        framework: 'ISO27001',
        category: 'policy',
        status: 'complete',
        content: 'Critical content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Attempt to get non-existent document
      const nonExistent = await storage.getDocument('99999');
      expect(nonExistent).toBeUndefined();

      // Verify original document is still intact
      const existingDoc = await storage.getDocument(doc.id!);
      expect(existingDoc).toBeDefined();
      expect(existingDoc?.title).toBe('Important Policy');

      // Try to update with invalid data (should still work in memory storage)
      const updated = await storage.updateDocument(doc.id!, {
        version: '2.0',
      });

      expect(updated.version).toBe('2.0');
      expect(updated.title).toBe('Important Policy'); // Other fields preserved
    });
  });

  describe('Flow 10: Complete Compliance Journey', () => {
    it('should track complete journey from onboarding to audit-ready', async () => {
      // Phase 1: Onboarding
      const profile = await storage.createCompanyProfile({
        organizationId: testOrg.id!,
        companyName: 'Startup XYZ',
        industry: 'Technology',
        companySize: '1-50',
        headquarters: 'Seattle, WA',
        complianceFrameworks: ['ISO27001'],
        cloudProviders: ['AWS'],
        dataClassification: 'Confidential',
        businessApplications: 'SaaS platform',
      });

      expect(profile.id).toBeDefined();

      // Phase 2: Initial document generation
      const initialDocs = await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Information Security Policy',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Policy content',
          version: '1.0',
          aiGenerated: true,
          aiModel: 'claude-3-5-sonnet',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Access Control Policy',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Policy content',
          version: '1.0',
          aiGenerated: true,
          aiModel: 'claude-3-5-sonnet',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      expect(initialDocs.length).toBe(2);

      // Phase 3: Review and approval
      await Promise.all(
        initialDocs.map(doc =>
          storage.updateDocument(doc.id!, { status: 'in_progress' })
        )
      );

      await Promise.all(
        initialDocs.map(doc =>
          storage.updateDocument(doc.id!, { status: 'complete' })
        )
      );

      // Phase 4: Gap analysis
      const gapAnalysisDocs = await storage.getDocuments();
      const completedDocs = gapAnalysisDocs.filter(d =>
        d.organizationId === testOrg.id! && d.status === 'complete'
      );

      expect(completedDocs.length).toBe(2);

      const totalControls = 114;
      const coverage = (completedDocs.length / totalControls) * 100;

      expect(coverage).toBeLessThan(2); // Still need many more documents

      // Phase 5: Generate additional documents to increase coverage
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          storage.createDocument({
            organizationId: testOrg.id!,
            title: `Additional Control ${i + 1}`,
            framework: 'ISO27001',
            category: 'control',
            status: 'complete',
            content: 'Control content',
            version: '1.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        )
      );

      // Phase 6: Final compliance check
      const allFinalDocs = await storage.getDocuments();
      const finalDocs = allFinalDocs.filter(d =>
        d.organizationId === testOrg.id! && d.status === 'complete'
      );

      const finalCoverage = (finalDocs.length / totalControls) * 100;

      expect(finalDocs.length).toBe(22);
      expect(finalCoverage).toBeGreaterThan(coverage);
      expect(finalCoverage).toBeGreaterThan(15); // Significant progress

      // Verify audit-ready state
      expect(finalDocs.every(doc => doc.status === 'complete')).toBe(true);
    });
  });
});
