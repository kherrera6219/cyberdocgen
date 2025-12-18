/**
 * OpenAPI 3.1 Specification Configuration
 *
 * Automatically generates API documentation from JSDoc comments and route files.
 * Access the interactive documentation at /api-docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'CyberDocGen API',
      version: '1.0.0',
      description: `
Enterprise Compliance Management System API

CyberDocGen provides a comprehensive API for managing compliance documents,
gap analysis, AI-powered document generation, and enterprise security features.

## Features

- 🔐 **Secure Authentication** - OAuth 2.0, MFA, Enterprise SSO
- 📄 **Document Management** - Create, update, and organize compliance documents
- 🤖 **AI-Powered Analysis** - GPT-4 powered gap analysis and document generation
- ☁️ **Cloud Integration** - Google Drive and OneDrive sync
- 📊 **Analytics** - Comprehensive metrics and reporting
- 🔍 **Audit Trail** - Complete audit logging for compliance

## Authentication

Most endpoints require authentication. Use the \`/api/auth\` endpoints to obtain
a session cookie, then include it in subsequent requests.

For enterprise users, SSO is available via \`/api/auth/enterprise\`.

### Multi-Factor Authentication (MFA)

High-risk operations may require MFA verification. Configure MFA via \`/api/auth/mfa\`.

## Rate Limiting

API requests are rate-limited to prevent abuse:
- General: 100 requests/15 minutes
- AI operations: 20 requests/minute
- Document generation: 10 requests/minute

## Error Responses

All errors follow a consistent format:

\`\`\`json
{
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
\`\`\`

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
      `.trim(),
      contact: {
        name: 'CyberDocGen Support',
        email: 'support@cyberdocgen.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? process.env.API_URL || 'https://api.cyberdocgen.com'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'MFA',
        description: 'Multi-factor authentication setup and verification',
      },
      {
        name: 'Enterprise Auth',
        description: 'Enterprise SSO and SAML authentication',
      },
      {
        name: 'Organizations',
        description: 'Organization and team management',
      },
      {
        name: 'Company Profiles',
        description: 'Company profile information and settings',
      },
      {
        name: 'Documents',
        description: 'Document creation, management, and versioning',
      },
      {
        name: 'AI',
        description: 'AI-powered document generation and analysis',
      },
      {
        name: 'Gap Analysis',
        description: 'Compliance gap analysis and remediation tracking',
      },
      {
        name: 'Templates',
        description: 'Document templates and frameworks',
      },
      {
        name: 'Generation Jobs',
        description: 'Background document generation jobs',
      },
      {
        name: 'Approvals',
        description: 'Document approval workflows',
      },
      {
        name: 'Export',
        description: 'Document export in various formats',
      },
      {
        name: 'Analytics',
        description: 'Usage analytics and reporting',
      },
      {
        name: 'Audit Trail',
        description: 'Comprehensive audit logging',
      },
      {
        name: 'Storage',
        description: 'File storage and retrieval',
      },
      {
        name: 'Cloud Integration',
        description: 'Google Drive and OneDrive integration',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (admin only)',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie obtained from /api/auth/login',
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF token obtained from /api/csrf-token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer'],
            },
            mfaEnabled: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['policy', 'procedure', 'guideline', 'standard', 'other'],
            },
            framework: {
              type: 'string',
              description: 'Compliance framework (e.g., SOC2, HIPAA, ISO27001)',
            },
            status: {
              type: 'string',
              enum: ['draft', 'review', 'approved', 'published', 'archived'],
            },
            version: {
              type: 'integer',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        GapAnalysisResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            framework: {
              type: 'string',
            },
            overallScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            gaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  controlId: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                  },
                  recommendation: {
                    type: 'string',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            uptime: {
              type: 'number',
              description: 'Uptime in seconds',
            },
            version: {
              type: 'string',
            },
            environment: {
              type: 'string',
            },
            metrics: {
              type: 'object',
              properties: {
                requests: {
                  type: 'integer',
                },
                avgResponseTime: {
                  type: 'number',
                },
                errorRate: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Insufficient permissions',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Validation failed',
                error: 'Invalid input data',
                code: 'VALIDATION_ERROR',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
        csrfToken: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes.ts'),
    path.join(__dirname, '../routes/**/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
