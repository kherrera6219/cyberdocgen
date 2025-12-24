# Duplicate Code Analysis Report

**Generated:** December 24, 2025
**Last Updated:** December 24, 2025 (Deduplication in progress)
**Analysis Type:** Complete Codebase Duplication Audit
**Status:** ✅ File-level duplicates removed, code-level duplicates identified

---

## Executive Summary

A comprehensive analysis of the CyberDocGen codebase has identified **approximately 5,000-7,000 lines of duplicate code** across 10 major duplication patterns. This report details each duplication, provides file-level references, and offers specific recommendations for consolidation.

### Impact Assessment

| Category | Lines Duplicated | Priority | Files Affected |
|----------|------------------|----------|----------------|
| Framework Pages | ~4,000+ | **P0 - Critical** | 4 |
| Validation Schemas | ~200+ | **P0 - Critical** | 2 |
| Chatbot Components | ~500+ | **P1 - High** | 2 |
| Error Handling | ~300+ | **P1 - High** | 26 |
| AI Client Init | ~70 | **P0 - Critical** | 7 |
| Result Interfaces | ~100+ | **P2 - Medium** | 8+ |
| API Key Validation | ~50+ | **P2 - Medium** | 9 |
| Framework Templates | Variable | **P0 - Critical** | 2 |
| Logging Patterns | Variable | **P3 - Low** | All |
| Middleware | Variable | **P2 - Medium** | 4 |

### Key Findings

- **Total Duplicate Code:** 5,000-7,000+ lines
- **High Priority Items:** 4 patterns (P0)
- **Medium Priority Items:** 5 patterns (P1-P2)
- **Potential Reduction:** 40-50% of identified duplicates

---

## Priority 0: Critical Duplications

### 1. Framework Page Duplication ⚠️ CRITICAL

**Severity:** HIGH | **Lines:** ~4,000+ | **Priority:** P0

#### Affected Files

1. `/home/user/cyberdocgen/client/src/pages/iso27001-framework.tsx` (1,022 lines)
2. `/home/user/cyberdocgen/client/src/pages/soc2-framework.tsx` (837 lines)
3. `/home/user/cyberdocgen/client/src/pages/nist-framework.tsx` (1,154 lines)
4. `/home/user/cyberdocgen/client/src/pages/fedramp-framework.tsx` (1,274 lines)

#### Duplicated Elements

**Type Definitions (Identical across all 4 files):**
```typescript
interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string | null;
  createdAt: string;
  metadata: { tags?: string[]; description?: string } | null;
}

interface Control {
  id: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  evidence: EvidenceFile[];
}

type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
type EvidenceStatus = "none" | "partial" | "complete";
```

**Component Imports (Identical):**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

**UI Structure (Near-Identical):**
- Control list with filtering
- Evidence management dialogs
- Status tracking
- Progress bars
- Query patterns using `react-query`

#### Recommendation

**Create Generic FrameworkPage Component:**

```typescript
// File: client/src/components/compliance/FrameworkPage.tsx
interface FrameworkConfig {
  framework: string;
  displayName: string;
  controlTypes: string[];
  maxControls: number;
  categories?: string[];
  description?: string;
}

export function FrameworkPage({ config }: { config: FrameworkConfig }) {
  // Shared implementation for all frameworks
  const { controls, isLoading } = useQuery({
    queryKey: ['controls', config.framework],
    queryFn: () => fetchControls(config.framework)
  });

  // ... shared logic

  return (
    <div className="framework-page">
      {/* Shared UI */}
    </div>
  );
}

// File: client/src/pages/iso27001-framework.tsx
import { FrameworkPage } from '@/components/compliance/FrameworkPage';

export default function ISO27001Framework() {
  const config: FrameworkConfig = {
    framework: 'ISO27001',
    displayName: 'ISO 27001:2022',
    controlTypes: ['A.5', 'A.6', 'A.7', 'A.8', /* ... */],
    maxControls: 114,
    description: 'Information Security Management System'
  };

  return <FrameworkPage config={config} />;
}
```

**Impact:**
- Reduces code by ~4,000 lines
- Single maintenance point
- Consistent behavior across all frameworks
- Easy to add new frameworks

**Files to Modify:**
1. Create: `client/src/components/compliance/FrameworkPage.tsx`
2. Create: `client/src/types/framework.ts`
3. Update: `client/src/pages/iso27001-framework.tsx`
4. Update: `client/src/pages/soc2-framework.tsx`
5. Update: `client/src/pages/nist-framework.tsx`
6. Update: `client/src/pages/fedramp-framework.tsx`

---

### 2. Validation Schema Duplication ⚠️ CRITICAL

**Severity:** HIGH | **Lines:** ~200+ | **Priority:** P0

#### Affected Files

1. `/home/user/cyberdocgen/server/validation/schemas.ts`
2. `/home/user/cyberdocgen/server/validation/requestSchemas.ts`

#### Duplicated Schemas

**Identical or Near-Identical Schemas:**

```typescript
// Both files contain these schemas with slight variations:
- createOrganizationSchema
- analyzeQualitySchema
- generateInsightsSchema
- generateComplianceDocsSchema
- chatMessageSchema
- analyzeDocumentSchema
- riskAssessmentSchema
- generateDocumentSchema
- batchGenerationSchema
- frameworkSelectionSchema
- evidenceUploadSchema
- controlUpdateSchema
```

**Example Duplication:**

```typescript
// In server/validation/schemas.ts
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  framework: z.string().optional(),
  sessionId: z.string().optional()
});

// In server/validation/requestSchemas.ts (nearly identical)
export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  framework: z.string().optional(),
  sessionId: z.string().optional()
});
```

#### Recommendation

**Consolidate into Single Schema File:**

1. Keep `requestSchemas.ts` as the authoritative source (has better error messages)
2. Update `schemas.ts` to re-export from `requestSchemas.ts`:

```typescript
// File: server/validation/schemas.ts
// Re-export all schemas from the authoritative source
export * from './requestSchemas';

// Keep any legacy-specific schemas here if needed
```

3. Update all imports across the codebase to use consistent path

**Impact:**
- Removes ~200+ lines of duplicate code
- Single source of truth for validation
- Prevents schema drift
- Easier to maintain

**Files to Modify:**
1. Update: `server/validation/schemas.ts` (make it a re-export)
2. Keep: `server/validation/requestSchemas.ts` (authoritative source)
3. Search and update all imports across routes and services

---

### 3. AI Client Initialization Duplication ⚠️ CRITICAL

**Severity:** HIGH | **Lines:** ~70 | **Priority:** P0

#### Affected Files

1. `/home/user/cyberdocgen/server/services/openai.ts:7-15`
2. `/home/user/cyberdocgen/server/services/anthropic.ts:19-27`
3. `/home/user/cyberdocgen/server/services/chatbot.ts:13-30`
4. `/home/user/cyberdocgen/server/services/documentAnalysis.ts:9-27`
5. `/home/user/cyberdocgen/server/services/qualityScoring.ts:8-26`
6. `/home/user/cyberdocgen/server/services/riskAssessment.ts:9-27`
7. `/home/user/cyberdocgen/server/services/geminiVision.ts:4-9`

#### Duplicated Pattern

**Repeated in 7 files:**
```typescript
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

// Similar patterns for:
// - getAnthropicClient()
// - getGeminiClient()
```

#### Centralized Solution Already Exists

**File:** `/home/user/cyberdocgen/server/services/aiClients.ts:9-36`

This file already provides centralized client initialization, but services aren't using it!

#### Recommendation

**Remove Duplicates and Use Centralized Clients:**

1. Update all 7 services to import from `aiClients.ts`:

```typescript
// Example: server/services/openai.ts
import { getOpenAIClient } from './aiClients';

// Remove local client initialization
// Use imported function directly
export async function generateDocument(params: GenerateParams) {
  const client = getOpenAIClient();
  // ... rest of implementation
}
```

2. Ensure `aiClients.ts` is complete and robust:

```typescript
// server/services/aiClients.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return geminiClient;
}
```

**Impact:**
- Removes ~70 lines of duplicate code
- Single point of configuration
- Centralized API key validation
- Easier to add new AI providers

**Files to Modify:**
1. Update: All 7 service files listed above
2. Ensure: `server/services/aiClients.ts` is complete

---

### 4. Framework Template Duplication ⚠️ CRITICAL

**Severity:** HIGH | **Lines:** Variable | **Priority:** P0

#### Affected Files

1. `/home/user/cyberdocgen/server/services/openai.ts:24-140+`
2. `/home/user/cyberdocgen/server/services/documentTemplates.ts:53-11841`

#### Problem

Two separate template systems exist with overlapping definitions:

**System 1 (openai.ts):**
```typescript
const frameworkTemplates = {
  ISO27001: [
    {
      priority: "required",
      title: "Information Security Policy",
      description: "Comprehensive policy document...",
      category: "Policies",
      documentType: "Policy"
    }
    // ... 20+ basic templates
  ],
  SOC2: [...],
  FedRAMP: [...],
  NIST: [...]
}
```

**System 2 (documentTemplates.ts):**
```typescript
export const ISO27001Templates = [
  {
    id: "iso27001_isms_scope",
    title: "ISO 27001 ISMS Scope Definition",
    framework: "ISO 27001:2022",
    category: "ISMS Foundation",
    documentType: "Policy",
    priority: "required",
    content: `[FULL TEMPLATE CONTENT WITH VARIABLES]`,
    variables: [
      { name: "companyName", description: "...", required: true },
      // ... template variables
    ]
  }
  // ... 14+ comprehensive templates with full content
]

export const DocumentTemplateService = {
  getTemplateById(id: string): DocumentTemplate | undefined,
  getAllTemplates(): DocumentTemplate[],
  getTemplatesByFramework(framework: string): DocumentTemplate[],
  // ... more methods
}
```

#### Recommendation

**Establish Single Authoritative Template Source:**

1. **Choose `documentTemplates.ts` as authoritative source** (it has full content and variables)

2. **Update `openai.ts` to reference centralized templates:**

```typescript
// server/services/openai.ts
import { DocumentTemplateService } from './documentTemplates';

// Remove local frameworkTemplates definition
// Use centralized service instead

export async function generateComplianceDocuments(
  framework: string,
  companyProfile: CompanyProfile
) {
  // Get templates from centralized service
  const templates = DocumentTemplateService.getTemplatesByFramework(framework);

  // ... rest of implementation
}
```

3. **Update all route imports to use consistent source:**

```typescript
// server/routes/templates.ts
import { DocumentTemplateService } from '../services/documentTemplates';

router.get('/api/templates', (req, res) => {
  const templates = DocumentTemplateService.getAllTemplates();
  res.json(templates);
});
```

**Impact:**
- Prevents template drift and inconsistency
- Single source of truth for all templates
- Easier to add new templates
- Ensures full template content is available everywhere

**Files to Modify:**
1. Update: `server/services/openai.ts` (remove local templates)
2. Update: All routes that reference templates
3. Keep: `server/services/documentTemplates.ts` (authoritative)

---

## Priority 1: High Impact Duplications

### 5. Chatbot Component Duplication ⚠️ HIGH

**Severity:** MEDIUM | **Lines:** ~500+ | **Priority:** P1

#### Affected Files

1. `/home/user/cyberdocgen/client/src/components/ai/ComplianceChatbot.tsx` (435 lines)
2. `/home/user/cyberdocgen/client/src/components/ai/EnhancedChatbot.tsx` (921 lines)

#### Shared Code

**Interfaces (Identical):**
```typescript
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  message: string;
  frameworkReferences?: string[];
  relatedControls?: string[];
}
```

**Hooks Used (Identical):**
```typescript
const { user } = useAuth();
const { toast } = useToast();
const queryClient = useQueryClient();
```

**Logic (90% Similar):**
- CSRF token handling
- Message sending
- History management
- Framework selection
- Error handling

#### Differences

**EnhancedChatbot Additions:**
- File attachment support (`<FileUploader />`)
- Canvas drawing capability (`<CanvasDrawing />`)
- Tabbed interface (`<Tabs />`)
- Drop zone support
- Textarea instead of Input

#### Recommendation

**Consolidate into Single Component with Feature Flags:**

```typescript
// File: client/src/components/ai/ComplianceChatbot.tsx
interface ComplianceChatbotProps {
  enhanced?: boolean;
  features?: {
    allowAttachments?: boolean;
    allowCanvas?: boolean;
    showTabs?: boolean;
  };
  defaultFramework?: string;
  className?: string;
}

export function ComplianceChatbot({
  enhanced = false,
  features = {},
  defaultFramework,
  className
}: ComplianceChatbotProps) {
  // Shared state and logic
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [framework, setFramework] = useState(defaultFramework);

  // Feature flags
  const enableAttachments = enhanced || features.allowAttachments;
  const enableCanvas = enhanced || features.allowCanvas;
  const showTabs = enhanced || features.showTabs;

  // Shared logic
  const handleSendMessage = async (content: string) => {
    // ... shared implementation
  };

  return (
    <div className={className}>
      {/* Shared UI */}
      <div className="chat-messages">
        {messages.map(msg => <Message key={msg.id} {...msg} />)}
      </div>

      {/* Conditional features */}
      {showTabs && <Tabs>...</Tabs>}
      {enableAttachments && <FileUploader onUpload={handleFileUpload} />}
      {enableCanvas && <CanvasDrawing onSave={handleCanvasSave} />}

      {/* Message input */}
      <MessageInput onSend={handleSendMessage} multiline={enhanced} />
    </div>
  );
}

// Usage:
// Basic chatbot
<ComplianceChatbot />

// Enhanced chatbot
<ComplianceChatbot enhanced />

// Custom features
<ComplianceChatbot features={{ allowAttachments: true }} />
```

**Impact:**
- Removes ~500+ lines of duplicate code
- Single component to maintain
- Consistent behavior
- Easy to add new features

**Files to Modify:**
1. Update: `client/src/components/ai/ComplianceChatbot.tsx` (add features)
2. Delete: `client/src/components/ai/EnhancedChatbot.tsx`
3. Update: All pages/components using `EnhancedChatbot`

---

### 6. Error Handling Pattern Duplication ⚠️ HIGH

**Severity:** MEDIUM | **Lines:** ~300+ | **Priority:** P1

#### Affected Files

All 26 route files in `/home/user/cyberdocgen/server/routes/`:
- `ai.ts`, `documents.ts`, `gapAnalysis.ts`, `templates.ts`, `controls.ts`, `evidence.ts`
- `auditor.ts`, `approvals.ts`, `admin.ts`, `userProfile.ts`, `roles.ts`, `enterpriseAuth.ts`
- `mfa.ts`, `cloudIntegration.ts`, `export.ts`, `notifications.ts`, `aiSessions.ts`
- `auditTrail.ts`, `organizations.ts`, `companyProfiles.ts`, `analytics.ts`, `dashboard.ts`
- `frameworkControlStatuses.ts`, `generationJobs.ts`, `projects.ts`, `storage.ts`

#### Duplicated Pattern

**Repeated 177+ times across all routes:**
```typescript
try {
  // Operation
  const result = await someOperation(req.body);
  res.json(result);
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error("Failed to [operation]", { error: errorMessage });
  res.status(500).json({ message: "Failed to [operation]" });
}
```

#### Recommendation

**Create Route Handler Wrapper:**

```typescript
// File: server/utils/routeHelpers.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export type RouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void> | void;

export function createRouteHandler(
  handler: RouteHandler,
  options?: {
    operationName?: string;
    successStatus?: number;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleRouteError(error, req, res, options?.operationName);
    }
  };
}

function handleRouteError(
  error: unknown,
  req: Request,
  res: Response,
  operation?: string
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const statusCode = error instanceof Error && 'statusCode' in error
    ? (error as any).statusCode
    : 500;

  logger.error(`Route error: ${operation || req.path}`, {
    error: errorMessage,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    organizationId: (req as any).organizationId,
    ip: req.ip
  });

  res.status(statusCode).json({
    message: `Failed to ${operation || 'process request'}`,
    error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
  });
}

export function asyncHandler(fn: RouteHandler): RouteHandler {
  return createRouteHandler(fn);
}
```

**Usage:**

```typescript
// Before:
router.post('/api/documents', async (req, res) => {
  try {
    const document = await createDocument(req.body);
    res.json(document);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Failed to create document", { error: errorMessage });
    res.status(500).json({ message: "Failed to create document" });
  }
});

// After:
import { asyncHandler } from '../utils/routeHelpers';

router.post('/api/documents', asyncHandler(async (req, res) => {
  const document = await createDocument(req.body);
  res.json(document);
}));

// Or with custom options:
router.post('/api/documents', createRouteHandler(async (req, res) => {
  const document = await createDocument(req.body);
  res.json(document);
}, { operationName: 'create document' }));
```

**Impact:**
- Removes ~300 lines of duplicate code
- Consistent error handling across all routes
- Centralized error logging
- Easier to enhance error handling globally

**Files to Modify:**
1. Create: `server/utils/routeHelpers.ts`
2. Update: All 26 route files to use `asyncHandler` or `createRouteHandler`

---

## Priority 2: Medium Impact Duplications

### 7. Result Interface Duplication

**Severity:** MEDIUM | **Lines:** ~100+ | **Priority:** P2

#### Affected Services

1. `server/services/documentAnalysis.ts` - `DocumentAnalysisResult`
2. `server/services/complianceGapAnalysis.ts` - `GapAnalysisResult`
3. `server/services/chatbot.ts` - `ChatResponse`
4. `server/services/geminiVision.ts` - `ImageAnalysisResult`
5. `server/services/riskAssessment.ts` - `RiskAssessmentResult`
6. `server/services/qualityScoring.ts` - `QualityScoreResult`
7. `server/services/aiOrchestrator.ts` - `DocumentGenerationResult`
8. `server/services/aiOrchestrator.ts` - `GuardrailedResult<T>`

#### Problem

Each service defines its own result interface without common structure.

#### Recommendation

**Create Base Result Interfaces:**

```typescript
// File: shared/types/serviceResults.ts
export interface BaseServiceResult {
  success: boolean;
  timestamp: Date;
  requestId?: string;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface AnalysisResult extends BaseServiceResult {
  analysis: string;
  confidence: number;
  recommendations?: string[];
  metadata?: Record<string, any>;
}

export interface GenerationResult extends BaseServiceResult {
  content: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
}

export interface QualityResult extends BaseServiceResult {
  score: number;
  breakdown: Record<string, number>;
  feedback: string[];
}

export interface GuardrailedResult<T> extends BaseServiceResult {
  data: T;
  guardrails: {
    passed: boolean;
    checks: GuardrailCheck[];
    riskScore: number;
  };
}

export interface GuardrailCheck {
  name: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
}
```

**Usage:**

```typescript
// server/services/documentAnalysis.ts
import { AnalysisResult } from '../../shared/types/serviceResults';

export interface DocumentAnalysisResult extends AnalysisResult {
  documentType: string;
  frameworkCompliance: Record<string, number>;
  gaps: string[];
}

export async function analyzeDocument(doc: string): Promise<DocumentAnalysisResult> {
  return {
    success: true,
    timestamp: new Date(),
    analysis: "...",
    confidence: 0.95,
    documentType: "policy",
    frameworkCompliance: { "ISO27001": 0.85 },
    gaps: []
  };
}
```

**Impact:**
- Improves type consistency across services
- ~100 lines saved
- Better API contracts
- Easier to add common fields

**Files to Modify:**
1. Create: `shared/types/serviceResults.ts`
2. Update: All 8 service files to extend base types

---

### 8. API Key Validation Duplication

**Severity:** LOW-MEDIUM | **Lines:** ~50+ | **Priority:** P2

#### Affected Files

1. `server/services/openai.ts`
2. `server/services/anthropic.ts`
3. `server/services/geminiVision.ts`
4. `server/services/chatbot.ts`
5. `server/services/documentAnalysis.ts`
6. `server/services/qualityScoring.ts`
7. `server/services/riskAssessment.ts`
8. `server/services/aiClients.ts`
9. `server/mcp/agentClient.ts`

#### Duplicated Pattern

```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}
```

#### Recommendation

**Consolidate in aiClients.ts:**

```typescript
// File: server/services/aiClients.ts
export interface AIApiKeyStatus {
  openai: boolean;
  anthropic: boolean;
  gemini: boolean;
}

export function validateAIApiKeys(): AIApiKeyStatus {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GOOGLE_API_KEY,
  };
}

export function requireAPIKey(
  provider: 'openai' | 'anthropic' | 'gemini'
): void {
  const keys = validateAIApiKeys();
  if (!keys[provider]) {
    const envVar = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      gemini: 'GOOGLE_API_KEY'
    }[provider];

    throw new Error(`${envVar} environment variable is not set`);
  }
}

export function getConfiguredProviders(): string[] {
  const keys = validateAIApiKeys();
  return Object.entries(keys)
    .filter(([_, isConfigured]) => isConfigured)
    .map(([provider]) => provider);
}
```

**Usage:**

```typescript
import { requireAPIKey, getConfiguredProviders } from './aiClients';

export async function generateDocument(params: any) {
  requireAPIKey('openai');  // Centralized validation
  const client = getOpenAIClient();
  // ...
}
```

**Impact:**
- ~50 lines saved
- Consistent error messages
- Easy to check all API key status
- Centralized configuration

**Files to Modify:**
1. Update: `server/services/aiClients.ts`
2. Update: All 9 files to use centralized validation

---

### 9. Middleware Pattern Duplication

**Severity:** MEDIUM | **Lines:** Variable | **Priority:** P2

#### Affected Files

1. `server/middleware/security.ts`
2. `server/middleware/rateLimiter.ts`
3. `server/middleware/routeValidation.ts`
4. `server/middleware/production.ts`

#### Recommendation

Extract common middleware base utilities for error handling and response patterns.

**Impact:** Variable, improves consistency

---

## Priority 3: Low Impact Duplications

### 10. Logging Pattern Duplication

**Severity:** LOW | **Lines:** Variable | **Priority:** P3

#### Affected Files

All route and service files (207+ logger calls)

#### Recommendation

**Create Logging Context Helper:**

```typescript
// File: server/utils/loggingHelpers.ts
import { Request } from 'express';

export interface LogContext {
  operation: string;
  userId?: number;
  organizationId?: number;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export function createLogContext(
  req: Request,
  operation: string
): LogContext {
  return {
    operation,
    userId: (req as any).user?.id,
    organizationId: (req as any).organizationId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  };
}

export function logSuccess(
  operation: string,
  context: Partial<LogContext>,
  data?: any
) {
  logger.info(operation, { ...context, data, timestamp: new Date() });
}

export function logError(
  operation: string,
  error: unknown,
  context: Partial<LogContext>
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(operation, {
    ...context,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date()
  });
}
```

**Usage:**

```typescript
// Before:
logger.info("Document created", {
  userId: req.user?.id,
  organizationId: req.organizationId,
  path: req.path,
  method: req.method
});

// After:
import { createLogContext, logSuccess } from '../utils/loggingHelpers';

logSuccess("Document created", createLogContext(req, "createDocument"), {
  documentId: document.id
});
```

**Impact:**
- Minimal lines saved
- Improved log consistency
- Easier to enhance logging globally

**Files to Modify:**
1. Create: `server/utils/loggingHelpers.ts`
2. Update: High-traffic routes and services

---

## Implementation Roadmap

### Phase 1: Critical (Week 1)

**Effort:** 2-3 days
**Impact:** ~4,500 lines reduced

- [ ] Task 1.1: Create generic FrameworkPage component
- [ ] Task 1.2: Update all 4 framework pages
- [ ] Task 1.3: Consolidate validation schemas
- [ ] Task 1.4: Remove AI client initialization duplicates
- [ ] Task 1.5: Unify framework template sources

### Phase 2: High Priority (Week 2)

**Effort:** 2-3 days
**Impact:** ~800 lines reduced

- [ ] Task 2.1: Consolidate chatbot components
- [ ] Task 2.2: Create error handling middleware
- [ ] Task 2.3: Update all route files with asyncHandler

### Phase 3: Medium Priority (Week 3)

**Effort:** 1-2 days
**Impact:** ~200 lines reduced

- [ ] Task 3.1: Create base result interfaces
- [ ] Task 3.2: Centralize API key validation
- [ ] Task 3.3: Extract middleware utilities
- [ ] Task 3.4: Create logging helpers

### Phase 4: Testing & Validation (Week 4)

**Effort:** 2-3 days

- [ ] Task 4.1: Unit tests for refactored components
- [ ] Task 4.2: Integration tests for updated routes
- [ ] Task 4.3: E2E tests for framework pages
- [ ] Task 4.4: Performance testing
- [ ] Task 4.5: Documentation updates

---

## Success Metrics

### Code Quality

- **Duplicate Code Reduction:** Target 80-90% reduction (4,000-6,000 lines removed)
- **Maintainability Index:** Increase from current baseline
- **Test Coverage:** Maintain 100% test pass rate
- **Type Safety:** No new TypeScript errors

### Performance

- **Bundle Size:** No significant increase
- **Build Time:** No degradation
- **Runtime Performance:** Maintain or improve

### Developer Experience

- **Code Consistency:** Single pattern for common operations
- **Onboarding Time:** Reduced due to clearer patterns
- **Bug Fix Time:** Reduced due to single source of truth

---

## Conclusion

This comprehensive duplicate code analysis has identified **5,000-7,000+ lines of duplicate code** across the CyberDocGen codebase. The duplications are categorized into 10 major patterns, with 4 critical priority items that should be addressed immediately.

**Key Recommendations:**

1. ✅ Create generic FrameworkPage component (~4,000 lines saved)
2. ✅ Consolidate validation schemas (~200 lines saved)
3. ✅ Centralize AI client initialization (~70 lines saved)
4. ✅ Unify framework template sources (prevents drift)
5. ✅ Merge chatbot components (~500 lines saved)
6. ✅ Extract error handling middleware (~300 lines saved)

**Total Expected Impact:**
- **Code Reduction:** 5,000-7,000+ lines
- **Maintainability:** Significantly improved
- **Consistency:** Greatly enhanced
- **Technical Debt:** Substantially reduced

By following the phased implementation roadmap, the codebase can be refactored systematically over 4 weeks with minimal risk and maximum impact.

---

**Report Version:** 1.0
**Generated By:** Claude Code AI Agent
**Last Updated:** December 24, 2025
