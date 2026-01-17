# Backend Refactoring Recommendations

## Executive Summary

This document outlines findings from a comprehensive backend code review focused on identifying large files that could benefit from refactoring into smaller, more maintainable modules.

## Large Files Identified

### Critical Priority

#### 1. server/services/documentTemplates.ts
- **Size:** 11,868 lines (483 KB)
- **Issue:** Massive single file containing all template definitions and service logic
- **Recommendation:** Split into:
  ```
  server/services/templates/
    ├── types.ts (Interface definitions)
    ├── iso27001.ts (ISO 27001 templates)
    ├── soc2.ts (SOC 2 templates)
    ├── fedramp.ts (FedRAMP templates)
    ├── nist.ts (NIST templates)
    ├── operational.ts (Operational templates)
    ├── certification.ts (Certification templates)
    ├── service.ts (DocumentTemplateService class)
    └── index.ts (Re-exports for backward compatibility)
  ```
- **Impact:** Low risk - mostly static data
- **Benefit:** Significantly improved maintainability, faster file loading, easier to find specific templates

### High Priority

#### 2. server/storage.ts
- **Size:** 1,879 lines (66 KB)
- **Methods:** 192 database operations
- **Issue:** Monolithic data access layer
- **Recommendation:** Split into repository pattern:
  ```
  server/repositories/
    ├── userRepository.ts (User CRUD operations)
    ├── organizationRepository.ts (Organization operations)
    ├── documentRepository.ts (Document operations)
    ├── companyProfileRepository.ts (Company profile operations)
    ├── auditRepository.ts (Audit trail operations)
    ├── roleRepository.ts (Role and permissions)
    ├── notificationRepository.ts (Notifications)
    └── index.ts (Aggregate exports)
  ```
- **Impact:** Medium risk - widely imported across codebase
- **Benefit:** Better separation of concerns, easier testing, clearer dependencies

#### 3. server/routes/ai.ts
- **Size:** 1,084 lines (40 KB)
- **Routes:** 24 endpoints
- **Issue:** Too many responsibilities in single route file
- **Recommendation:** Split by feature:
  ```
  server/routes/ai/
    ├── models.ts (Model management - 1 route)
    ├── analysis.ts (Quality & document analysis - 4 routes)
    ├── generation.ts (Document generation - 3 routes)
    ├── chat.ts (Chat & suggestions - 3 routes)
    ├── risk.ts (Risk & threat analysis - 3 routes)
    ├── quality.ts (Quality scoring & alignment - 2 routes)
    ├── vision.ts (Image analysis & multimodal - 2 routes)
    ├── fineTuning.ts (AI fine-tuning - 1 route)
    ├── statistics.ts (Usage stats & guardrails - 5 routes)
    └── index.ts (Route aggregator)
  ```
- **Impact:** Low risk - easy to refactor
- **Benefit:** Much easier to navigate, clear feature boundaries, better code organization

### Medium Priority

#### 4. server/routes/documents.ts
- **Size:** 674 lines (25 KB)
- **Routes:** ~15 endpoints
- **Recommendation:** Consider splitting into documents/crud.ts and documents/operations.ts if it grows further

#### 5. server/routes.ts
- **Size:** 593 lines (22 KB)
- **Issue:** Main router registry file
- **Recommendation:** Already well-organized, no changes needed currently

## Refactoring Strategy

### Phase 1: Low-Hanging Fruit (Low Risk)
1. **Split routes/ai.ts** into feature-based sub-modules
   - Estimated effort: 4-6 hours
   - Risk: Low (isolated to routes layer)
   - Benefit: Immediate improvement in code navigation

### Phase 2: Medium Effort (Medium Risk)
2. **Refactor storage.ts** into repository pattern
   - Estimated effort: 2-3 days
   - Risk: Medium (requires updating many imports)
   - Benefit: Better testability and maintainability
   - Strategy: Create new repositories while keeping storage.ts as facade initially

### Phase 3: Large Effort (Low Risk)
3. **Split documentTemplates.ts** by framework
   - Estimated effort: 3-4 days
   - Risk: Low (mostly data reorganization)
   - Benefit: Easier to manage individual framework templates
   - Strategy: Split data files first, then migrate service

## Other Observations

### Well-Structured Files
The following files are appropriately sized and well-organized:
- server/middleware/security.ts (609 lines) - Reasonable for security logic
- server/services/aiOrchestrator.ts (611 lines) - Good service organization
- server/config/swagger.ts (439 lines) - Appropriate for API documentation

### Files to Monitor
These files are approaching the threshold where refactoring should be considered:
- server/routes/documents.ts (674 lines)
- server/services/enterpriseAuthService.ts (640 lines)
- server/services/aiGuardrailsService.ts (558 lines)

## Best Practices for Future Development

1. **Route Files:** Keep under 500 lines or ~10 routes per file
2. **Service Files:** Keep under 600 lines or split by feature domains
3. **Data Files:** Consider external storage (JSON/YAML) for large template sets
4. **Utility Files:** Maximum 300 lines; split by category if larger

## Implementation Priority

**Recommended Order:**
1. ✅ Fix TypeScript errors (COMPLETED)
2. 🔄 Split routes/ai.ts (NEXT - Low risk, high benefit)
3. ⏳ Refactor storage.ts to repositories (High impact)
4. ⏳ Split documentTemplates.ts (Low priority - mostly working fine)

## Conclusion

The codebase is generally well-structured, but three files stand out as candidates for refactoring:
- **documentTemplates.ts** is exceptionally large but low risk to refactor
- **storage.ts** would significantly benefit from repository pattern
- **routes/ai.ts** is the easiest and most beneficial to refactor first

Recommend starting with AI routes refactoring as a proof of concept, then proceeding to storage layer if successful.
