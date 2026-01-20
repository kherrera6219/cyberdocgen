import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('E2E Flow Tests', () => {
  let app: any;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app as express.Express);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Onboarding Flow', () => {
    describe('Organization Setup', () => {
      it('should require authentication for organization creation', async () => {
        await request(app)
          .post('/api/organizations')
          .send({
            name: 'Test Organization',
            industry: 'technology',
            size: 'medium'
          })
          .expect(401);
      });

      it('should require authentication to list organizations', async () => {
        await request(app)
          .get('/api/organizations')
          .expect(401);
      });
    });

    describe('Company Profile Creation', () => {
      it('should require authentication for company profile creation', async () => {
        const profileData = {
          companyName: 'Test Company Inc.',
          industry: 'Technology',
          companySize: '50-200',
          complianceFrameworks: ['ISO 27001', 'SOC 2'],
          description: 'A test company for compliance management'
        };

        await request(app)
          .post('/api/company-profiles')
          .send(profileData)
          .expect(401);
      });

      it('should require authentication to get company profile', async () => {
        await request(app)
          .get('/api/company-profiles')
          .expect(401);
      });
    });

    describe('Initial Framework Selection', () => {
      it('should require authentication to update framework preferences', async () => {
        await request(app)
          .patch('/api/company-profiles/1')
          .send({
            complianceFrameworks: ['ISO 27001', 'SOC 2', 'FedRAMP']
          })
          .expect(401);
      });
    });
  });

  describe('AI Generation Flow', () => {
    describe('Document Generation', () => {
      it('should require authentication for AI document generation', async () => {
        await request(app)
          .post('/api/ai/generate-compliance-docs')
          .send({
            companyInfo: { companyName: 'Test' },
            frameworks: ['ISO 27001']
          })
          .expect(401);
      });

      it('should require authentication for AI document analysis', async () => {
        await request(app)
          .post('/api/ai/analyze-document')
          .send({
            content: 'test',
            filename: 'test.txt',
            framework: 'ISO 27001'
          })
          .expect(401);
      });

      it('should return AI service health status', async () => {
        const response = await request(app)
          .get('/api/ai/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('models');
      });
    });

    describe('Evidence Upload', () => {
      it('should require authentication for evidence upload', async () => {
        await request(app)
          .post('/api/evidence/upload')
          .send({
            fileName: 'test.pdf',
            fileData: 'base64data',
            snapshotId: '123'
          })
          .expect(401);
      });

      it('should require authentication to list evidence', async () => {
        await request(app)
          .get('/api/evidence')
          .expect(401);
      });
    });

    describe('Control Approvals', () => {
      it('should require authentication to list pending approvals', async () => {
        await request(app)
          .get('/api/controls/approvals')
          .expect(401);
      });

      it('should require authentication to approve a control', async () => {
        await request(app)
          .post('/api/controls/1/approve')
          .send({
            approved: true,
            comments: 'Approved after review'
          })
          .expect(401);
      });
    });
  });

  describe('Audit Flow', () => {
    describe('Audit Trail Access', () => {
      it('should require authentication to view audit trail', async () => {
        await request(app)
          .get('/api/audit-trail')
          .expect(401);
      });

      it('should require authentication to get audit entry details', async () => {
        await request(app)
          .get('/api/audit-trail/1')
          .expect(401);
      });
    });

    describe('Auditor Workspace', () => {
      it('should require authentication for auditor workspace access', async () => {
        await request(app)
          .get('/api/auditor/documents')
          .expect(401);
      });

      it('should require authentication to view compliance overview', async () => {
        await request(app)
          .get('/api/auditor/overview')
          .expect(401);
      });

      it('should require authentication to export audit reports', async () => {
        await request(app)
          .get('/api/auditor/export')
          .expect(401);
      });
    });

    describe('Gap Analysis', () => {
      it('should require authentication for gap analysis', async () => {
        await request(app)
          .get('/api/gap-analysis')
          .expect(401);
      });

      it('should require authentication for gap analysis by framework', async () => {
        await request(app)
          .get('/api/gap-analysis/ISO27001')
          .expect(401);
      });
    });
  });

  describe('Cross-Flow Integration', () => {
    describe('Document to Audit Trail', () => {
      it('should require authentication to track document changes', async () => {
        await request(app)
          .get('/api/documents/1/history')
          .expect(401);
      });
    });

    describe('Evidence to Control Mapping', () => {
      // TODO: Implement evidence-to-control mapping (Schema and Routes missing)
      it.skip('should require authentication to map evidence to controls', async () => {
        await request(app)
          .post('/api/evidence/1/controls')
          .send({
            controlIds: ['CC6.1', 'CC6.7']
          })
          .expect(401);
      });
    });

    describe('AI Hub Stats', () => {
      it('should require authentication for AI stats', async () => {
        await request(app)
          .get('/api/ai/stats')
          .expect(401);
      });
    });
  });
});
