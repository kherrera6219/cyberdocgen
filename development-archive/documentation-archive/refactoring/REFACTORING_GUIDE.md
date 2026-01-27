# AI Routes Refactoring Guide

## Overview

This guide documents the process of refactoring `server/routes/ai.ts` (1,084 lines) into smaller, maintainable feature-specific modules.

## Current Status

### ✅ Completed (Proof of Concept)

Created foundational structure with example modules:

1. **server/routes/ai/shared.ts** - Common imports and utilities
2. **server/routes/ai/models.ts** - Model management (1 route)
3. **server/routes/ai/analysis.ts** - Quality analysis & insights (2 routes)

### 📋 Remaining Work

The following modules still need to be extracted from `server/routes/ai.ts`:

#### 4. generation.ts (Document Generation - 3 routes)
- `POST /generate-compliance-docs` (lines 135-247)
- `GET /generation-jobs/:id` (lines 249-267)
- Plus background generation logic

#### 5. documentAnalysis.ts (Document Analysis - 2 routes)
- `POST /analyze-document` (lines 269-296)
- `POST /extract-profile` (lines 298-318)

#### 6. chat.ts (Chat Interface - 3 routes)
- `POST /chat` (lines 320-344)
- `GET /chat/suggestions` (lines 346-353)
- `POST /multimodal-chat` (lines 638-753)

#### 7. risk.ts (Risk Assessment - 2 routes)
- `POST /risk-assessment` (lines 355-389)
- `POST /threat-analysis` (lines 391-415)

#### 8. quality.ts (Quality Scoring - 2 routes)
- `POST /quality-score` (lines 416-457)
- `POST /framework-alignment` (lines 459-497)

#### 9. industry.ts (Industry Data - 2 routes)
- `GET /industries` (lines 499-508)
- `GET /industries/:industryId` (lines 510-520)

#### 10. fineTuning.ts (AI Fine-Tuning - 2 routes)
- `POST /fine-tune` (lines 522-552)
- `POST /generate-optimized` (lines 554-580)

#### 11. assessRisks.ts (Risk Assessment - 1 route)
- `POST /assess-risks` (lines 582-590)

#### 12. vision.ts (Vision/Multimodal - 1 route)
- `POST /analyze-image` (lines 592-636)

#### 13. statistics.ts (Statistics & Monitoring - 3 routes)
- `GET /usage-disclosure/status` (lines 755-776)
- `POST /usage-disclosure/accept` (lines 778-806)
- `GET /ai-statistics` (lines 808-875)

## Migration Pattern

Each new module should follow this pattern:

### 1. File Structure
```typescript
// Feature description comment
import { Router } from 'express';
import { /* specific dependencies */ } from '../../services/...';
import {
  /* shared utilities */
} from './shared';
import {
  /* validation schemas */
} from '../../validation/requestSchemas';

export function register[Feature]Routes(router: Router) {
  // Route implementations with JSDoc comments
}
```

### 2. Example (models.ts)
```typescript
// AI Model Management Routes
import { Router } from 'express';
import { aiOrchestrator } from '../../services/aiOrchestrator';
import { isAuthenticated, asyncHandler } from './shared';

export function registerModelRoutes(router: Router) {
  /**
   * GET /api/ai/models
   * Get list of available AI models
   */
  router.get("/models", isAuthenticated, asyncHandler(async (req, res) => {
    const models = aiOrchestrator.getAvailableModels();
    res.json({ models });
  }));
}
```

### 3. Update index.ts
After creating all modules, create `server/routes/ai/index.ts`:

```typescript
import { Router } from 'express';
import { registerModelRoutes } from './models';
import { registerAnalysisRoutes } from './analysis';
import { registerGenerationRoutes } from './generation';
// ... import all other route modules

export function registerAIRoutes(router: Router) {
  registerModelRoutes(router);
  registerAnalysisRoutes(router);
  registerGenerationRoutes(router);
  // ... register all other route modules
}
```

### 4. Update main routes.ts
Change the import in `server/routes.ts` from:
```typescript
import { registerAIRoutes } from "./routes/ai";
```
To:
```typescript
import { registerAIRoutes } from "./routes/ai/index";
```

## Benefits

After full refactoring:
- ✅ Files under 200 lines each (vs 1,084 lines currently)
- ✅ Clear feature boundaries
- ✅ Easier to test individual features
- ✅ Better code navigation
- ✅ Reduced merge conflicts
- ✅ Easier onboarding for new developers

## Testing Strategy

After each module extraction:
1. Run `npm run check` to verify TypeScript
2. Test the specific endpoints in that module
3. Verify imports are correct
4. Check for any circular dependencies

## Rollback Plan

If issues arise:
1. Keep original `ai.ts` as `ai.ts.backup`
2. Can quickly revert by removing `/ai` folder and restoring backup
3. Git history preserves original implementation

## Timeline Recommendation

- **Quick Win (1-2 hours):** Extract 2-3 simple modules (models, industry, statistics)
- **Phase 1 (4-6 hours):** Extract all read-only routes (GET endpoints)
- **Phase 2 (6-8 hours):** Extract all write routes (POST endpoints)
- **Phase 3 (2 hours):** Testing and cleanup

**Total Estimated Effort:** 12-18 hours for complete refactoring

## Current Decision

**Status:** Proof of concept completed with 3 example modules

**Recommendation:** Complete remaining extraction in a dedicated refactoring sprint when:
1. No urgent feature work in progress
2. Full test suite is available
3. Can dedicate focused time for thorough testing

For now, the organizational comments added to the original file provide immediate navigation benefits while maintaining stability.
