# Framework Page Deduplication Plan

## Analysis

All 4 framework pages (ISO 27001, SOC 2, NIST, FedRAMP) share:
- Identical TypeScript interfaces and types
- Identical import statements
- Identical UI component structure
- Identical filtering and search logic
- Identical state management patterns

**Only differences:**
1. Framework name/title
2. Control domain data (`initialControlDomains`)
3. API endpoint parameter (`framework`)

## Implementation Strategy

### Step 1: Extract Common Types
Create `/home/user/cyberdocgen/client/src/types/framework.ts`:
- EvidenceFile interface
- ControlStatus type
- EvidenceStatus type
- Control interface
- ControlDomain interface

### Step 2: Extract Control Data
Create `/home/user/cyberdocgen/client/src/data/frameworkControls.ts`:
- Export ISO27001Controls
- Export SOC2Controls
- Export NISTControls
- Export FedRAMPControls

### Step 3: Create Generic Component
Create `/home/user/cyberdocgen/client/src/components/compliance/FrameworkPage.tsx`:
- Accept `frameworkConfig` prop
- Use same UI logic for all frameworks
- Parameterize framework-specific values

### Step 4: Update Individual Pages
Update each framework page to:
- Import FrameworkPage component
- Import framework-specific controls
- Pass configuration to generic component
- Reduce from ~1000 lines to ~20-30 lines each

## Expected Impact
- **Before:** 4,287 lines total (1,274 + 1,022 + 1,154 + 837)
- **After:** ~120 lines (4 × 30) + ~1,500 (shared component) + ~1,000 (control data)
- **Savings:** ~1,667 lines (39% reduction)
- **Maintenance:** Single component instead of 4
