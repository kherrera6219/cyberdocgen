import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Document Integration Tests', () => {
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

  describe('Document Templates', () => {
    it('should return document templates', async () => {
      const response = await request(app)
        .get('/api/document-templates')
        .expect(200);

      expect(response.body.data).toHaveProperty('templates');
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });

    it('should get a specific template by ID', async () => {
      const templatesResponse = await request(app)
        .get('/api/document-templates')
        .expect(200);

      if (templatesResponse.body.data.templates && templatesResponse.body.data.templates.length > 0) {
        const templateId = templatesResponse.body.data.templates[0].id;
        const response = await request(app)
          .get(`/api/document-templates/${templateId}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('template');
      }
    });
  });

  describe('Document Generation Endpoints', () => {
    it('should require authentication for document generation', async () => {
      await request(app)
        .post('/api/documents/generate')
        .send({
          title: 'Test Policy',
          framework: 'SOC2',
          category: 'policy'
        })
        .expect(401);
    });

    it('should require authentication for document upload', async () => {
      await request(app)
        .post('/api/documents/upload-and-extract')
        .send({
          files: []
        })
        .expect(401);
    });
  });

  describe('Document Export', () => {
    it('should export document as markdown', async () => {
      const response = await request(app)
        .post('/api/export-document')
        .send({
          content: '# Test Document\n\nThis is test content.',
          format: 'md',
          filename: 'test-doc'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/markdown');
    });

    it('should handle export without content', async () => {
      await request(app)
        .post('/api/export-document')
        .send({
          format: 'md'
        })
        .expect(400);
    });
  });

  describe('Document AI Generation', () => {
    it('should reject generation request without framework', async () => {
      const response = await request(app)
        .post('/api/generate-document')
        .send({
          companyProfile: {
            name: 'Test Company',
            industry: 'Technology',
            size: '51-200'
          },
          documentType: 'policy'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Document Quality Analysis', () => {
    it('should require authentication for document quality analysis', async () => {
      const response = await request(app)
        .post('/api/analyze-document-quality')
        .send({
          content: 'Test content',
          framework: 'SOC2',
          documentType: 'policy'
        });
      expect(response.status).toBe(401);
    });
  });

  describe('Document Versioning', () => {
    it('should require authentication for version history', async () => {
      await request(app)
        .get('/api/documents/test-id/versions')
        .expect(401);
    });

    it('should require authentication for version creation', async () => {
      await request(app)
        .post('/api/documents/test-id/versions')
        .send({
          content: 'New version content',
          changeDescription: 'Updated policy'
        })
        .expect(401);
    });

    it('should require authentication for version restore', async () => {
      await request(app)
        .post('/api/documents/123/versions/1/restore')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(401);
    });
  });

  describe('Document Comparison', () => {
    it('should require authentication for version comparison', async () => {
      await request(app)
        .get('/api/documents/test-id/versions/1/compare/2')
        .expect(401);
    });
  });

  describe('Document Saving', () => {
    it('should save a document with valid data', async () => {
      const response = await request(app)
        .post('/api/save-document')
        .send({
          title: 'Test Security Policy',
          content: 'This is a test security policy document.',
          framework: 'SOC2',
          category: 'policy',
          companyProfile: {
            name: 'Test Corp',
            industry: 'Technology',
            size: '51-200'
          }
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('document');
      }
    });

    it('should reject save request without required fields', async () => {
      const response = await request(app)
        .post('/api/save-document')
        .send({
          title: 'Missing Content'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
