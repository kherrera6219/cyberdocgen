import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { InsertDocument, InsertCompanyProfile, Document } from '../../shared/schema';

describe('Document Unit Tests', () => {
  let storage: MemStorage;
  let companyProfileId: string;
  let organizationId: string;
  let userId: string;

  beforeEach(async () => {
    storage = new MemStorage();
    
    const user = await storage.createUser({
      email: 'doc.test@example.com',
      firstName: 'Doc',
      lastName: 'Test',
      role: 'user'
    });
    userId = user.id;

    const org = await storage.createOrganization({
      name: 'Doc Test Org',
      slug: 'doc-test-org'
    });
    organizationId = org.id;

    const profile = await storage.createCompanyProfile({
      organizationId: org.id,
      createdBy: user.id,
      companyName: 'Test Company',
      industry: 'Technology',
      companySize: '51-200',
      headquarters: 'San Francisco, CA',
      dataClassification: 'Confidential',
      businessApplications: 'Web applications',
      cloudInfrastructure: ['AWS'],
      complianceFrameworks: ['SOC2', 'ISO27001']
    });
    companyProfileId = profile.id;
  });

  describe('Document CRUD Operations', () => {
    it('should create a document with valid data', async () => {
      const docData: InsertDocument = {
        companyProfileId,
        createdBy: userId,
        title: 'Information Security Policy',
        framework: 'SOC2',
        category: 'policy',
        content: 'This is the information security policy content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      };

      const doc = await storage.createDocument(docData);
      expect(doc.id).toBeDefined();
      expect(doc.title).toBe('Information Security Policy');
      expect(doc.framework).toBe('SOC2');
      expect(doc.status).toBe('draft');
    });

    it('should retrieve a document by ID', async () => {
      const docData: InsertDocument = {
        companyProfileId,
        createdBy: userId,
        title: 'Retrieve Test Document',
        framework: 'ISO27001',
        category: 'procedure',
        content: 'Document content for retrieval test.',
        status: 'draft',
        documentType: 'text',
        version: 1
      };

      const created = await storage.createDocument(docData);
      const retrieved = await storage.getDocument(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Retrieve Test Document');
    });

    it('should return undefined for non-existent document', async () => {
      const doc = await storage.getDocument('non-existent-id');
      expect(doc).toBeUndefined();
    });

    it('should update a document', async () => {
      const docData: InsertDocument = {
        companyProfileId,
        createdBy: userId,
        title: 'Original Title',
        framework: 'SOC2',
        category: 'policy',
        content: 'Original content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      };

      const created = await storage.createDocument(docData);
      const updated = await storage.updateDocument(created.id, {
        title: 'Updated Title',
        status: 'published',
        version: 2
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('published');
      expect(updated?.version).toBe(2);
    });

    it('should delete a document', async () => {
      const docData: InsertDocument = {
        companyProfileId,
        createdBy: userId,
        title: 'Document to Delete',
        framework: 'SOC2',
        category: 'policy',
        content: 'Content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      };

      const created = await storage.createDocument(docData);
      const deleted = await storage.deleteDocument(created.id);
      expect(deleted).toBe(true);

      const retrieved = await storage.getDocument(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Document Filtering', () => {
    beforeEach(async () => {
      await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'SOC2 Policy 1',
        framework: 'SOC2',
        category: 'policy',
        content: 'SOC2 content 1.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });

      await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'SOC2 Policy 2',
        framework: 'SOC2',
        category: 'policy',
        content: 'SOC2 content 2.',
        status: 'published',
        documentType: 'text',
        version: 1
      });

      await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'ISO27001 Policy',
        framework: 'ISO27001',
        category: 'policy',
        content: 'ISO content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });
    });

    it('should get all documents', async () => {
      const docs = await storage.getDocuments();
      expect(docs.length).toBe(3);
    });

    it('should filter documents by framework', async () => {
      const soc2Docs = await storage.getDocumentsByFramework('SOC2');
      expect(soc2Docs.length).toBe(2);
      expect(soc2Docs.every(d => d.framework === 'SOC2')).toBe(true);

      const isoDocs = await storage.getDocumentsByFramework('ISO27001');
      expect(isoDocs.length).toBe(1);
      expect(isoDocs[0].framework).toBe('ISO27001');
    });

    it('should filter documents by company profile', async () => {
      const docs = await storage.getDocumentsByCompanyProfile(companyProfileId);
      expect(docs.length).toBe(3);
      expect(docs.every(d => d.companyProfileId === companyProfileId)).toBe(true);
    });

    it('should return empty array for non-existent company profile', async () => {
      const docs = await storage.getDocumentsByCompanyProfile('non-existent-profile');
      expect(docs.length).toBe(0);
    });
  });

  describe('Document Status Management', () => {
    it('should create document with draft status', async () => {
      const doc = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'Draft Document',
        framework: 'SOC2',
        category: 'policy',
        content: 'Content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });

      expect(doc.status).toBe('draft');
    });

    it('should update document status to published', async () => {
      const doc = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'Publish Test',
        framework: 'SOC2',
        category: 'policy',
        content: 'Content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });

      const updated = await storage.updateDocument(doc.id, { status: 'published' });
      expect(updated?.status).toBe('published');
    });

    it('should update document status to archived', async () => {
      const doc = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'Archive Test',
        framework: 'SOC2',
        category: 'policy',
        content: 'Content.',
        status: 'published',
        documentType: 'text',
        version: 1
      });

      const updated = await storage.updateDocument(doc.id, { status: 'archived' });
      expect(updated?.status).toBe('archived');
    });
  });

  describe('Document Version Management', () => {
    it('should create document with version', async () => {
      const doc = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'Versioned Document',
        framework: 'SOC2',
        category: 'policy',
        content: 'Content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });

      expect(doc.version).toBe(1);
    });

    it('should increment document version on update', async () => {
      const doc = await storage.createDocument({
        companyProfileId,
        createdBy: userId,
        title: 'Version Increment Test',
        framework: 'SOC2',
        category: 'policy',
        content: 'Original content.',
        status: 'draft',
        documentType: 'text',
        version: 1
      });

      const updated = await storage.updateDocument(doc.id, {
        content: 'Updated content.',
        version: 2
      });

      expect(updated?.version).toBe(2);
    });
  });

  describe('Document Frameworks', () => {
    const frameworks = ['SOC2', 'ISO27001', 'FedRAMP', 'NIST'];

    frameworks.forEach(framework => {
      it(`should create document for ${framework} framework`, async () => {
        const doc = await storage.createDocument({
          companyProfileId,
          createdBy: userId,
          title: `${framework} Policy`,
          framework: framework,
          category: 'policy',
          content: `${framework} specific content.`,
          status: 'draft',
          documentType: 'text',
          version: 1
        });

        expect(doc.framework).toBe(framework);
      });
    });
  });

  describe('Document Categories', () => {
    const categories = ['policy', 'procedure', 'guideline', 'standard', 'control'];

    categories.forEach(category => {
      it(`should create document with ${category} category`, async () => {
        const doc = await storage.createDocument({
          companyProfileId,
          createdBy: userId,
          title: `${category} Document`,
          framework: 'SOC2',
          category: category,
          content: `${category} specific content.`,
          status: 'draft',
          documentType: 'text',
          version: 1
        });

        expect(doc.category).toBe(category);
      });
    });
  });
});
