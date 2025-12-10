# API Documentation

## API Overview

The CyberDocGen API provides comprehensive endpoints for managing compliance documentation, company profiles, AI-powered analysis, and organizational data. All endpoints require authentication unless otherwise specified. The API supports ISO 27001:2022, SOC 2, FedRAMP, and NIST 800-53 Rev 5 compliance frameworks.

## Authentication

### Authentication Flow
All API endpoints (except health checks) require authentication via Replit OpenID Connect:

```typescript
// Authentication headers automatically handled by frontend
Headers: {
  'Cookie': 'session=<session_token>',
  'Content-Type': 'application/json'
}
```

### Error Responses
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `429 Too Many Requests`: Rate limit exceeded

## Base URLs
- **Development**: `http://localhost:5000`
- **Production**: `https://<repl-name>.repl.co`

## Health Endpoints

### System Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-08-15T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

### AI Health Check
```http
GET /api/ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "openai": {
      "status": "available",
      "model": "gpt-5.1",
      "lastCheck": "2025-12-10T00:00:00.000Z"
    },
    "anthropic": {
      "status": "available",
      "model": "claude-opus-4-5",
      "lastCheck": "2025-12-10T00:00:00.000Z"
    },
    "google": {
      "status": "available",
      "model": "gemini-3.0-pro",
      "lastCheck": "2025-12-10T00:00:00.000Z"
    }
  },
  "orchestrator": "operational",
  "fallbackEnabled": true
}
```

### Readiness Probe
```http
GET /ready
```

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "ai_services": "ok"
  }
}
```

### Liveness Probe
```http
GET /live
```

**Response:**
```json
{
  "status": "alive",
  "uptime": 3600
}
```

### Metrics
```http
GET /metrics
```

**Response:** Prometheus-style metrics
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1000
```

## User Management

### Get Current User
```http
GET /api/auth/user
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "profileImageUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Organization Management

### List Organizations
```http
GET /api/organizations
```

### Get Organization
```http
GET /api/organizations/:id
```

### Create Organization
```http
POST /api/organizations
Content-Type: application/json

{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "description": "Technology company",
  "website": "https://acme.com"
}
```

## Company Profiles

### List Company Profiles
```http
GET /api/company-profiles
```

**Response:**
```json
[
  {
    "id": "profile_123",
    "companyName": "Acme Corp",
    "industry": "Technology",
    "companySize": "51-200",
    "headquarters": "San Francisco, CA",
    "cloudInfrastructure": ["AWS", "Azure"],
    "complianceFrameworks": ["SOC2", "ISO27001"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Company Profile
```http
POST /api/company-profiles
Content-Type: application/json

{
  "companyName": "Acme Corp",
  "industry": "Technology",
  "companySize": "51-200",
  "headquarters": "San Francisco, CA",
  "dataClassification": "Confidential",
  "businessApplications": "Web applications, mobile apps",
  "cloudInfrastructure": ["AWS", "Azure"],
  "complianceFrameworks": ["SOC2", "ISO27001"],
  "keyPersonnel": {
    "ceo": { "name": "John Smith", "email": "john@acme.com" },
    "ciso": { "name": "Jane Doe", "email": "jane@acme.com" }
  },
  "frameworkConfigs": {
    "soc2": {
      "trustServices": ["security", "availability", "confidentiality"],
      "auditPeriod": "12-months"
    }
  }
}
```

### Update Company Profile
```http
PATCH /api/company-profiles/:id
```

### Delete Company Profile
```http
DELETE /api/company-profiles/:id
```

## Document Management

### List Documents
```http
GET /api/documents
```

**Query Parameters:**
- `framework`: Filter by compliance framework
- `status`: Filter by document status
- `companyProfileId`: Filter by company profile

### Get Document
```http
GET /api/documents/:id
```

### Create Document
```http
POST /api/documents
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "title": "Data Classification Policy",
  "framework": "ISO27001",
  "category": "policy",
  "content": "Document content...",
  "status": "draft"
}
```

### Update Document
```http
PATCH /api/documents/:id
```

### Delete Document
```http
DELETE /api/documents/:id
```

## AI Services

### Generate Compliance Insights
```http
POST /api/ai/generate-insights
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "framework": "SOC2"
}
```

**Response:**
```json
{
  "insights": [
    {
      "type": "gap_analysis",
      "severity": "medium",
      "finding": "Missing data retention policy",
      "recommendation": "Implement comprehensive data retention policy"
    }
  ],
  "riskScore": 65,
  "complianceLevel": "partial",
  "generatedAt": "2024-08-15T00:00:00.000Z"
}
```

### Analyze Document Quality
```http
POST /api/ai/analyze-quality
Content-Type: application/json

{
  "content": "Document content to analyze...",
  "framework": "SOC2"
}
```

**Response:**
```json
{
  "qualityScore": 85,
  "analysis": {
    "completeness": 90,
    "clarity": 80,
    "compliance": 85,
    "structure": 85
  },
  "suggestions": [
    "Add more specific implementation details",
    "Include compliance mapping references"
  ],
  "frameworkAlignment": 85
}
```

### Chat with AI Assistant
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What are the key requirements for SOC 2 Type II?",
  "context": {
    "companyProfileId": "profile_123",
    "framework": "SOC2"
  }
}
```

### Risk Assessment
```http
POST /api/ai/assess-risk
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "framework": "ISO27001"
}
```

### Threat Landscape Analysis
```http
POST /api/ai/analyze-threats
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "industry": "technology"
}
```

## Document Generation

### Generate Single Document
```http
POST /api/documents/generate-single
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "framework": "SOC2",
  "template": "data_classification_policy",
  "model": "auto",
  "includeQualityAnalysis": true
}
```

### Batch Generate Documents
```http
POST /api/documents/generate
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "framework": "SOC2",
  "templates": ["policy", "procedure", "guideline"],
  "model": "gpt-5.1"
}
```

### Get Generation Job Status
```http
GET /api/generation-jobs/:id
```

## Audit Trail

### Get Audit Logs
```http
GET /api/audit-trail
```

**Query Parameters:**
- `entityType`: Filter by entity type
- `action`: Filter by action type
- `userId`: Filter by user
- `startDate`: Filter by date range
- `endDate`: Filter by date range

### Get User Activity
```http
GET /api/audit-trail/user/:userId
```

## Document Versions

### Get Document Versions
```http
GET /api/documents/:id/versions
```

### Create Document Version
```http
POST /api/documents/:id/versions
Content-Type: application/json

{
  "content": "Updated document content...",
  "changeDescription": "Updated compliance requirements",
  "changeType": "minor"
}
```

### Restore Document Version
```http
POST /api/documents/:id/versions/:versionId/restore
```

## Multi-Factor Authentication

### Setup MFA
```http
POST /api/mfa/setup
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["12345678", "87654321", ...]
}
```

### Verify MFA Token
```http
POST /api/mfa/verify
Content-Type: application/json

{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA enabled successfully"
}
```

### Verify Backup Code
```http
POST /api/mfa/verify-backup-code
Content-Type: application/json

{
  "code": "12345678"
}
```

### Disable MFA
```http
POST /api/mfa/disable
Content-Type: application/json

{
  "token": "123456"
}
```

## Gap Analysis

### Analyze Compliance Framework
```http
POST /api/gap-analysis/analyze
Content-Type: application/json

{
  "companyProfileId": "profile_123",
  "framework": "ISO27001"
}
```

**Response:**
```json
{
  "reportId": "report_123",
  "framework": "ISO27001",
  "overallScore": 75,
  "findings": [
    {
      "controlId": "A.5.1",
      "controlName": "Policies for information security",
      "status": "partial",
      "gap": "Missing documentation review schedule",
      "riskLevel": "medium"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "description": "Implement quarterly policy review process"
    }
  ],
  "maturityLevel": "managed"
}
```

### Get Gap Analysis Report
```http
GET /api/gap-analysis/reports/:id
```

### List Gap Analysis Reports
```http
GET /api/gap-analysis/reports
```

**Query Parameters:**
- `framework`: Filter by framework
- `companyProfileId`: Filter by company profile
- `minScore`: Minimum compliance score

## Cloud Integration

### Get Integration Status
```http
GET /api/cloud-integration/status
```

**Response:**
```json
{
  "googleDrive": {
    "connected": true,
    "lastSync": "2025-12-10T00:00:00.000Z"
  },
  "oneDrive": {
    "connected": false
  }
}
```

### Authorize Cloud Service
```http
POST /api/cloud-integration/authorize
Content-Type: application/json

{
  "service": "googleDrive",
  "authCode": "authorization_code_here"
}
```

### Sync Documents
```http
POST /api/cloud-integration/sync
Content-Type: application/json

{
  "service": "googleDrive",
  "direction": "push"
}
```

## Storage

### Upload File
```http
POST /api/storage/upload
Content-Type: multipart/form-data

file: <binary data>
```

**Response:**
```json
{
  "fileId": "file_123",
  "fileName": "document.pdf",
  "size": 1024000,
  "url": "https://storage.example.com/file_123"
}
```

### List Files
```http
GET /api/storage/files
```

### Download File
```http
GET /api/storage/files/:id
```

### Delete File
```http
DELETE /api/storage/files/:id
```

## Export

### Export as PDF
```http
POST /api/export/pdf
Content-Type: application/json

{
  "documentId": "doc_123",
  "options": {
    "watermark": true,
    "includeMetadata": true
  }
}
```

### Export as Word
```http
POST /api/export/word
Content-Type: application/json

{
  "documentId": "doc_123"
}
```

### Export as Excel
```http
POST /api/export/excel
Content-Type: application/json

{
  "frameworkId": "ISO27001",
  "includeGapAnalysis": true
}
```

## Analytics

### Get Dashboard Metrics
```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "documents": {
    "total": 150,
    "byFramework": {
      "ISO27001": 50,
      "SOC2": 40,
      "FedRAMP": 30,
      "NIST": 30
    }
  },
  "compliance": {
    "averageScore": 82,
    "gapsIdentified": 25
  },
  "aiUsage": {
    "documentsGenerated": 100,
    "analysesPerformed": 200
  }
}
```

### Get Compliance Status
```http
GET /api/analytics/compliance-status
```

**Query Parameters:**
- `framework`: Specific framework
- `companyProfileId`: Specific company profile

## Admin Endpoints

### List All Users
```http
GET /api/admin/users
```

**Requires:** Admin role

### Create User
```http
POST /api/admin/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "user",
  "organizationId": "org_123"
}
```

### Update User
```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "role": "admin"
}
```

### Delete User
```http
DELETE /api/admin/users/:id
```

### Get System Metrics
```http
GET /api/admin/metrics
```

**Response:**
```json
{
  "systemHealth": "healthy",
  "activeUsers": 50,
  "documentsGenerated": 1000,
  "storageUsed": "5GB",
  "aiRequestsToday": 200
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "field": "companyName",
      "issue": "Required field missing"
    }
  },
  "timestamp": "2024-08-15T00:00:00.000Z",
  "requestId": "req_123456"
}
```

### Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limits

### Endpoint-Specific Limits
- **General API**: 1000 requests per 15 minutes
- **AI Generation**: 10 requests per hour
- **Authentication**: 5 attempts per 15 minutes
- **File Upload**: 5 uploads per hour
- **MFA Operations**: 10 attempts per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1628875200
Retry-After: 900
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order (asc, desc)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```