import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { User, Organization, Document, CompanyProfile } from '../../shared/schema';

describe('Workflow Integration Tests', () => {
  let storage: MemStorage;
  let testUser: User;
  let testOrg: Organization;

  beforeEach(async () => {
    storage = new MemStorage();

    // Create test organization
    testOrg = await storage.createOrganization({
      name: 'Test Organization',
      industry: 'Technology',
      size: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create test user
    testUser = await storage.createUser({
      email: 'test@example.com',
      password: 'hashedpassword',
      organizationId: testOrg.id!,
      createdAt: new Date(),
    });
  });

  describe('Complete Document Generation Workflow', () => {
    it('should complete full document generation from profile to export', async () => {
      // Step 1: Create company profile
      const companyProfile: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: testOrg.id!,
        companyName: 'Acme Corp',
        industry: 'Technology',
        companySize: '51-200',
        headquarters: 'San Francisco, CA',
        description: 'SaaS platform provider',
        complianceFrameworks: ['ISO27001', 'SOC2'],
        cloudProviders: ['AWS', 'Azure'],
        dataClassification: 'Confidential',
        businessApplications: 'CRM, ERP, Analytics',
      };

      const profile = await storage.createCompanyProfile(companyProfile);
      expect(profile).toBeDefined();
      expect(profile.id).toBeDefined();

      // Step 2: Generate documents
      const doc1 = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Information Security Policy',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'Policy content...',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Main security policy',
        aiGenerated: true,
        aiModel: 'claude-3-5-sonnet',
      });

      const doc2 = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Access Control Procedure',
        framework: 'SOC2',
        category: 'procedure',
        status: 'draft',
        content: 'Procedure content...',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Access control procedures',
        aiGenerated: true,
        aiModel: 'claude-3-5-sonnet',
      });

      expect(doc1.id).toBeDefined();
      expect(doc2.id).toBeDefined();

      // Step 3: Update document status to in_progress
      const updatedDoc1 = await storage.updateDocument(doc1.id!, {
        status: 'in_progress',
      });

      expect(updatedDoc1.status).toBe('in_progress');

      // Step 4: Complete document review
      const completedDoc1 = await storage.updateDocument(doc1.id!, {
        status: 'complete',
        version: '1.1',
      });

      expect(completedDoc1.status).toBe('complete');
      expect(completedDoc1.version).toBe('1.1');

      // Step 5: Query completed documents
      const completedDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        status: 'complete',
      });

      expect(completedDocs.length).toBeGreaterThanOrEqual(1);
      expect(completedDocs.some(d => d.id === doc1.id)).toBe(true);

      // Step 6: Query all documents for organization
      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      expect(allDocs.length).toBe(2);
    });

    it('should handle document lifecycle with multiple versions', async () => {
      // Create initial document
      const doc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Risk Assessment Procedure',
        framework: 'ISO27001',
        category: 'procedure',
        status: 'draft',
        content: 'Version 1.0 content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(doc.version).toBe('1.0');
      expect(doc.status).toBe('draft');

      // Update to version 1.1
      const v11 = await storage.updateDocument(doc.id!, {
        content: 'Version 1.1 content',
        version: '1.1',
        status: 'in_progress',
      });

      expect(v11.version).toBe('1.1');
      expect(v11.status).toBe('in_progress');

      // Finalize to version 2.0
      const v20 = await storage.updateDocument(doc.id!, {
        content: 'Version 2.0 content',
        version: '2.0',
        status: 'complete',
      });

      expect(v20.version).toBe('2.0');
      expect(v20.status).toBe('complete');
    });
  });

  describe('Gap Analysis Workflow', () => {
    it('should perform gap analysis after document generation', async () => {
      // Create company profile with selected frameworks
      const profile = await storage.createCompanyProfile({
        organizationId: testOrg.id!,
        companyName: 'Tech Startup',
        industry: 'Technology',
        companySize: '1-50',
        headquarters: 'Austin, TX',
        complianceFrameworks: ['ISO27001', 'SOC2'],
        cloudProviders: ['AWS'],
        dataClassification: 'Confidential',
        businessApplications: 'Web application',
      });

      // Generate documents for ISO27001 (out of 114 controls)
      const iso27001Docs = await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'ISO 27001 Policy 1',
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
          title: 'ISO 27001 Policy 2',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Generate documents for SOC2
      const soc2Doc = await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'SOC2 Security Controls',
        framework: 'SOC2',
        category: 'control',
        status: 'draft',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Query documents by framework
      const iso27001AllDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        framework: 'ISO27001',
      });

      const soc2AllDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        framework: 'SOC2',
      });

      expect(iso27001AllDocs.length).toBe(2);
      expect(soc2AllDocs.length).toBe(1);

      // Calculate gap analysis metrics
      const totalISO27001Controls = 114;
      const implementedISO27001 = iso27001AllDocs.filter(d => d.status === 'complete').length;
      const iso27001Coverage = (implementedISO27001 / totalISO27001Controls) * 100;

      expect(iso27001Coverage).toBeGreaterThan(0);
      expect(iso27001Coverage).toBeLessThan(100);

      const totalSOC2Controls = 64;
      const implementedSOC2 = soc2AllDocs.filter(d => d.status === 'complete').length;
      const soc2Coverage = (implementedSOC2 / totalSOC2Controls) * 100;

      expect(soc2Coverage).toBeGreaterThanOrEqual(0);
    });

    it('should identify gaps in document coverage', async () => {
      // Create documents for only some frameworks
      await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'ISO 27001 Policy',
        framework: 'ISO27001',
        category: 'policy',
        status: 'complete',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Query all documents
      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      // Check for framework coverage
      const frameworks = ['ISO27001', 'SOC2', 'FedRAMP', 'NIST'];
      const gaps = frameworks.filter(framework => {
        return !allDocs.some(doc => doc.framework === framework);
      });

      expect(gaps.length).toBe(3); // Missing SOC2, FedRAMP, NIST
      expect(gaps).toContain('SOC2');
      expect(gaps).toContain('FedRAMP');
      expect(gaps).toContain('NIST');
    });
  });

  describe('Multi-Framework Document Workflow', () => {
    it('should generate and manage documents across multiple frameworks', async () => {
      const frameworks = ['ISO27001', 'SOC2', 'FedRAMP'];
      const documentsByFramework: Record<string, Document[]> = {};

      // Generate documents for each framework
      for (const framework of frameworks) {
        const docs = await Promise.all([
          storage.createDocument({
            organizationId: testOrg.id!,
            title: `${framework} Policy`,
            framework,
            category: 'policy',
            status: 'draft',
            content: 'Policy content',
            version: '1.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
          storage.createDocument({
            organizationId: testOrg.id!,
            title: `${framework} Procedure`,
            framework,
            category: 'procedure',
            status: 'draft',
            content: 'Procedure content',
            version: '1.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);

        documentsByFramework[framework] = docs;
      }

      // Verify all frameworks have documents
      for (const framework of frameworks) {
        const docs = await storage.getDocuments({
          organizationId: testOrg.id!,
          framework,
        });

        expect(docs.length).toBe(2);
        expect(documentsByFramework[framework].length).toBe(2);
      }

      // Verify total document count
      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      expect(allDocs.length).toBe(6); // 3 frameworks × 2 documents
    });

    it('should filter documents by multiple criteria', async () => {
      // Create various documents
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
          status: 'draft',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'SOC2 Control',
          framework: 'SOC2',
          category: 'control',
          status: 'complete',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Filter by framework
      const isoDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        framework: 'ISO27001',
      });
      expect(isoDocs.length).toBe(2);

      // Filter by status
      const completeDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        status: 'complete',
      });
      expect(completeDocs.length).toBe(2);

      // Filter by category
      const policies = await storage.getDocuments({
        organizationId: testOrg.id!,
        category: 'policy',
      });
      expect(policies.length).toBe(2);
    });
  });

  describe('AI-Generated Document Tracking', () => {
    it('should track AI-generated documents separately', async () => {
      // Create AI-generated documents
      await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'AI Policy 1',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'AI generated content',
          version: '1.0',
          aiGenerated: true,
          aiModel: 'claude-3-5-sonnet',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Manual Policy 1',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Manually created content',
          version: '1.0',
          aiGenerated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      const aiDocs = allDocs.filter(d => d.aiGenerated);
      const manualDocs = allDocs.filter(d => !d.aiGenerated);

      expect(aiDocs.length).toBe(1);
      expect(manualDocs.length).toBe(1);
      expect(aiDocs[0].aiModel).toBe('claude-3-5-sonnet');
    });
  });

  describe('Organization Multi-User Workflow', () => {
    it('should handle multiple users in same organization', async () => {
      // Create additional users in same organization
      const user2 = await storage.createUser({
        email: 'user2@example.com',
        password: 'hashedpassword',
        organizationId: testOrg.id!,
        createdAt: new Date(),
      });

      const user3 = await storage.createUser({
        email: 'user3@example.com',
        password: 'hashedpassword',
        organizationId: testOrg.id!,
        createdAt: new Date(),
      });

      // Create documents from different users
      await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Policy from User 1',
        framework: 'ISO27001',
        category: 'policy',
        status: 'draft',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await storage.createDocument({
        organizationId: testOrg.id!,
        title: 'Policy from User 2',
        framework: 'SOC2',
        category: 'policy',
        status: 'draft',
        content: 'Content',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // All users should see all organization documents
      const orgDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      expect(orgDocs.length).toBe(2);
    });
  });

  describe('Document Search and Filtering Workflow', () => {
    beforeEach(async () => {
      // Create a variety of documents for testing
      await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Information Security Policy',
          description: 'Main security policy document',
          framework: 'ISO27001',
          category: 'policy',
          status: 'complete',
          content: 'Security policy content',
          version: '2.0',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Access Control Procedure',
          description: 'Detailed access control procedures',
          framework: 'SOC2',
          category: 'procedure',
          status: 'in_progress',
          content: 'Access control content',
          version: '1.5',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-20'),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Incident Response Plan',
          description: 'Security incident response plan',
          framework: 'FedRAMP',
          category: 'plan',
          status: 'draft',
          content: 'Incident response content',
          version: '0.5',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-25'),
        }),
      ]);
    });

    it('should support filtering by status', async () => {
      const completeDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        status: 'complete',
      });

      expect(completeDocs.length).toBe(1);
      expect(completeDocs[0].title).toBe('Information Security Policy');
    });

    it('should support filtering by framework', async () => {
      const soc2Docs = await storage.getDocuments({
        organizationId: testOrg.id!,
        framework: 'SOC2',
      });

      expect(soc2Docs.length).toBe(1);
      expect(soc2Docs[0].title).toBe('Access Control Procedure');
    });

    it('should support filtering by category', async () => {
      const policyDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        category: 'policy',
      });

      expect(policyDocs.length).toBe(1);
      expect(policyDocs[0].category).toBe('policy');
    });

    it('should return all documents when no filters applied', async () => {
      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      expect(allDocs.length).toBe(3);
    });
  });

  describe('Bulk Document Operations Workflow', () => {
    it('should handle bulk document creation', async () => {
      const documentsToCreate = Array.from({ length: 10 }, (_, i) => ({
        organizationId: testOrg.id!,
        title: `Bulk Document ${i + 1}`,
        framework: 'ISO27001',
        category: 'policy' as const,
        status: 'draft' as const,
        content: `Content ${i + 1}`,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const createdDocs = await Promise.all(
        documentsToCreate.map(doc => storage.createDocument(doc))
      );

      expect(createdDocs.length).toBe(10);
      expect(createdDocs.every(doc => doc.id !== undefined)).toBe(true);

      // Verify all documents were created
      const allDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
      });

      expect(allDocs.length).toBe(10);
    });

    it('should handle bulk status updates', async () => {
      // Create multiple draft documents
      const draftDocs = await Promise.all([
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Draft 1',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        storage.createDocument({
          organizationId: testOrg.id!,
          title: 'Draft 2',
          framework: 'ISO27001',
          category: 'policy',
          status: 'draft',
          content: 'Content',
          version: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Update all to in_progress
      const updatedDocs = await Promise.all(
        draftDocs.map(doc =>
          storage.updateDocument(doc.id!, { status: 'in_progress' })
        )
      );

      expect(updatedDocs.every(doc => doc.status === 'in_progress')).toBe(true);

      // Verify updates persisted
      const inProgressDocs = await storage.getDocuments({
        organizationId: testOrg.id!,
        status: 'in_progress',
      });

      expect(inProgressDocs.length).toBe(2);
    });
  });
});
