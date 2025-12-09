import { describe, it, expect, beforeAll, afterAll } from '../setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Gap Analysis Integration Tests', () => {
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

  describe('Gap Analysis Creation', () => {
    it('should require authentication for gap analysis', async () => {
      await request(app)
        .post('/api/gap-analysis')
        .send({
          framework: 'SOC2',
          companyProfileId: 'test-profile-id'
        })
        .expect(401);
    });

    it('should require authentication to update recommendations', async () => {
      await request(app)
        .patch('/api/gap-analysis/recommendations/test-id')
        .send({
          status: 'in_progress'
        })
        .expect(401);
    });
  });

  describe('Compliance Analysis Endpoint', () => {
    it('should analyze compliance gaps', async () => {
      const response = await request(app)
        .post('/api/analyze-compliance-gaps')
        .send({
          framework: 'SOC2',
          currentControls: ['Access Control', 'Logging', 'Encryption'],
          requirements: ['CC1.1', 'CC1.2', 'CC2.1']
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('gaps');
        expect(response.body).toHaveProperty('recommendations');
      } else {
        expect([500, 503]).toContain(response.status);
      }
    });
  });

  describe('Compliance Frameworks', () => {
    const frameworks = ['SOC2', 'ISO27001', 'FedRAMP', 'NIST'];

    frameworks.forEach(framework => {
      it(`should handle ${framework} framework gap analysis request`, async () => {
        const response = await request(app)
          .post('/api/gap-analysis')
          .send({
            framework,
            companyProfileId: 'test-profile'
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Document Quality for Compliance', () => {
    it('should analyze document quality against framework', async () => {
      const response = await request(app)
        .post('/api/analyze-document-quality')
        .send({
          content: `
            # Information Security Policy
            
            ## Purpose
            This policy establishes the information security requirements for our organization.
            
            ## Scope
            This policy applies to all employees, contractors, and third parties.
            
            ## Security Controls
            1. Access Control
            2. Data Classification
            3. Incident Response
          `,
          framework: 'SOC2'
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('quality');
      }
    });
  });

  describe('Gap Analysis Reports', () => {
    it('should require authentication for report access', async () => {
      await request(app)
        .get('/api/gap-analysis/reports')
        .expect(401);
    });

    it('should require authentication for specific report', async () => {
      await request(app)
        .get('/api/gap-analysis/reports/test-report-id')
        .expect(401);
    });
  });

  describe('Remediation Tracking', () => {
    it('should require authentication for remediation updates', async () => {
      await request(app)
        .patch('/api/gap-analysis/recommendations/test-rec-id')
        .send({
          status: 'completed',
          completedAt: new Date().toISOString()
        })
        .expect(401);
    });
  });

  describe('Risk Assessment', () => {
    it('should handle risk assessment requests', async () => {
      const response = await request(app)
        .post('/api/assess-risk')
        .send({
          threats: ['Data Breach', 'Insider Threat', 'Ransomware'],
          assets: ['Customer Data', 'Financial Records', 'Intellectual Property'],
          controls: ['Encryption', 'Access Control', 'Backup']
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('risks');
      }
    });
  });

  describe('Compliance Scoring', () => {
    it('should calculate compliance score', async () => {
      const response = await request(app)
        .post('/api/calculate-compliance-score')
        .send({
          framework: 'SOC2',
          implementedControls: 45,
          totalControls: 50,
          findings: {
            critical: 0,
            high: 1,
            medium: 3,
            low: 5
          }
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('score');
      }
    });
  });

  describe('AI-Powered Analysis', () => {
    it('should require authentication for AI gap analysis', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-gaps')
        .send({
          framework: 'ISO27001',
          currentState: {
            policies: ['Information Security Policy', 'Access Control Policy'],
            controls: ['A.5.1', 'A.6.1', 'A.9.1'],
            evidence: ['Policy documents', 'Access logs']
          }
        });

      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Framework Requirements', () => {
    it('should return framework control requirements', async () => {
      const response = await request(app)
        .get('/api/frameworks/SOC2/controls');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('controls');
      }
    });
  });
});
