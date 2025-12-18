# Industry Specialization Wireframe

**Screen:** Industry-Specific Compliance
**Page:** `/industry-specialization`
**Complexity:** Medium
**User Type:** Authenticated (All roles)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] CyberDocGen                  Industry Specialization               [🔔] [👤] john.doe  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  🏢 Industry Specialization                                    [Select Your Industry] │ │
│  │                                                                                        │ │
│  │  Compliance frameworks and controls tailored to your specific industry                │ │
│  │                                                                                        │ │
│  │  [All Industries] [Healthcare] [Financial] [Technology] [Government] [Retail]        │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  YOUR SELECTED INDUSTRY                                                              │  │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │  🏥 Healthcare                                                [Change Industry] ││  │
│  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││  │
│  │  │                                                                                  ││  │
│  │  │  Healthcare providers, medical device manufacturers, health plans, and          ││  │
│  │  │  healthcare clearinghouses managing protected health information (PHI)          ││  │
│  │  │                                                                                  ││  │
│  │  │  Primary Regulations: HIPAA, HITECH Act, FDA 21 CFR Part 11                    ││  │
│  │  │  Selected: Nov 15, 2025                                                         ││  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  APPLICABLE FRAMEWORKS                                              [Filter] [Sort]  │  │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  Required Frameworks                                                                 │  │
│  │                                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │  🏥 HIPAA Security Rule                                       ✅ Implemented    ││  │
│  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││  │
│  │  │                                                                                  ││  │
│  │  │  Status: ● Active  •  Progress: [██████████] 94%  •  45/48 Controls Implemented││  │
│  │  │                                                                                  ││  │
│  │  │  Implementation Requirements:                                                    ││  │
│  │  │  • Administrative Safeguards (18 controls)       [████████████░] 92%           ││  │
│  │  │  • Physical Safeguards (8 controls)              [██████████░░] 88%           ││  │
│  │  │  • Technical Safeguards (19 controls)            [███████████░] 95%           ││  │
│  │  │  • Organizational Requirements (2 controls)      [████████████] 100%          ││  │
│  │  │  • Policies & Procedures (1 control)             [████████████] 100%          ││  │
│  │  │                                                                                  ││  │
│  │  │  Next Audit: Mar 15, 2026  •  Last Audit: Sep 10, 2025                         ││  │
│  │  │                                                                                  ││  │
│  │  │  [View Details] [Run Gap Analysis] [Generate Report]                            ││  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │  🔐 HITECH Act Compliance                                     🔄 In Progress   ││  │
│  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││  │
│  │  │                                                                                  ││  │
│  │  │  Status: ● Active  •  Progress: [████████░░] 78%  •  14/18 Controls Implemented││  │
│  │  │                                                                                  ││  │
│  │  │  Implementation Requirements:                                                    ││  │
│  │  │  • Breach Notification Rules (6 controls)        [████████░░░] 67%            ││  │
│  │  │  • Business Associate Agreements (4 controls)    [██████████░] 75%            ││  │
│  │  │  • Encryption & Security (5 controls)            [███████████░] 80%            ││  │
│  │  │  • Enforcement & Penalties (3 controls)          [████████████] 100%          ││  │
│  │  │                                                                                  ││  │
│  │  │  Target Completion: Jan 31, 2026                                                ││  │
│  │  │                                                                                  ││  │
│  │  │  [View Details] [Run Gap Analysis] [Generate Report]                            ││  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                      │  │
│  │  Recommended Frameworks                                                              │  │
│  │                                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │  ⚕️  FDA 21 CFR Part 11                                       ○ Not Started    ││  │
│  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ││  │
│  │  │                                                                                  ││  │
│  │  │  Electronic records and signatures for medical devices and pharmaceutical       ││  │
│  │  │  manufacturing                                                                   ││  │
│  │  │                                                                                  ││  │
│  │  │  Applies to: Medical device manufacturers, pharmaceutical companies             ││  │
│  │  │                                                                                  ││  │
│  │  │  [Get Started] [Learn More]                                                     ││  │
│  │  └────────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────────────────────────────────────┐ ┌──────────────────────────────────────────┐ │
│  │  INDUSTRY-SPECIFIC DOCUMENTS             │ │  COMPLIANCE CHECKLIST                    │ │
│  ├──────────────────────────────────────────┤ ├──────────────────────────────────────────┤ │
│  │                                          │ │                                          │ │
│  │  Policy Templates (Healthcare)           │ │  Required Actions:                      │ │
│  │                                          │ │                                          │ │
│  │  📄 HIPAA Privacy Policy                 │ │  ✅ Complete HIPAA Security Risk        │ │
│  │     [Use Template]                       │ │     Assessment (Completed)              │ │
│  │                                          │ │                                          │ │
│  │  📄 Breach Notification Procedures       │ │  ✅ Implement Business Associate        │ │
│  │     [Use Template]                       │ │     Agreements (Completed)              │ │
│  │                                          │ │                                          │ │
│  │  📄 Patient Data Access Policy           │ │  🔄 Update Breach Response Plan         │ │
│  │     [Use Template]                       │ │     (In Progress - 60%)                 │ │
│  │                                          │ │                                          │ │
│  │  📄 PHI Disposal Procedures              │ │  ⏳ Implement Encryption at Rest        │ │
│  │     [Use Template]                       │ │     (Pending)                           │ │
│  │                                          │ │                                          │ │
│  │  📄 Mobile Device Security Policy        │ │  ⏳ Conduct Annual Security Training    │ │
│  │     [Use Template]                       │ │     (Due: Jan 15, 2026)                 │ │
│  │                                          │ │                                          │ │
│  │  [View All Templates (24)]               │ │  [View Full Checklist]                  │ │
│  │                                          │ │                                          │ │
│  └──────────────────────────────────────────┘ └──────────────────────────────────────────┘ │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Industry Selection View

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] CyberDocGen                  Industry Specialization               [🔔] [👤] john.doe  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  🏢 Select Your Industry                                                              │ │
│  │                                                                                        │ │
│  │  Choose your industry to get tailored compliance frameworks and requirements         │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐                   │
│  │  🏥 Healthcare                 │  │  💰 Financial Services         │                   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                   │
│  │                                │  │                                │                   │
│  │  Healthcare providers, medical │  │  Banks, credit unions, payment │                   │
│  │  devices, health plans         │  │  processors, investment firms  │                   │
│  │                                │  │                                │                   │
│  │  Primary Regulations:          │  │  Primary Regulations:          │                   │
│  │  • HIPAA Security & Privacy    │  │  • PCI DSS                     │                   │
│  │  • HITECH Act                  │  │  • SOX (Sarbanes-Oxley)        │                   │
│  │  • FDA 21 CFR Part 11          │  │  • GLBA (Gramm-Leach-Bliley)   │                   │
│  │                                │  │  • FFIEC Guidelines            │                   │
│  │  [Select Healthcare]           │  │                                │                   │
│  │                                │  │  [Select Financial]            │                   │
│  └────────────────────────────────┘  └────────────────────────────────┘                   │
│                                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐                   │
│  │  💻 Technology                 │  │  🏛️  Government                │                   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                   │
│  │                                │  │                                │                   │
│  │  Software companies, SaaS,     │  │  Federal, state, local         │                   │
│  │  cloud providers               │  │  government agencies           │                   │
│  │                                │  │                                │                   │
│  │  Primary Regulations:          │  │  Primary Regulations:          │                   │
│  │  • SOC 2                       │  │  • FedRAMP                     │                   │
│  │  • ISO 27001                   │  │  • NIST 800-53                 │                   │
│  │  • GDPR (EU customers)         │  │  • FISMA                       │                   │
│  │  • CCPA (CA customers)         │  │  • CJIS (law enforcement)      │                   │
│  │                                │  │                                │                   │
│  │  [Select Technology]           │  │  [Select Government]           │                   │
│  │                                │  │                                │                   │
│  └────────────────────────────────┘  └────────────────────────────────┘                   │
│                                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐                   │
│  │  🛒 Retail & E-Commerce        │  │  🏭 Manufacturing              │                   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                   │
│  │                                │  │                                │                   │
│  │  Online merchants, payment     │  │  Manufacturing, supply chain,  │                   │
│  │  processing                    │  │  industrial systems            │                   │
│  │                                │  │                                │                   │
│  │  Primary Regulations:          │  │  Primary Regulations:          │                   │
│  │  • PCI DSS                     │  │  • ISO 9001                    │                   │
│  │  • GDPR (EU customers)         │  │  • ISO 27001                   │                   │
│  │  • CCPA (CA customers)         │  │  • NIST CSF                    │                   │
│  │  • FTC Guidelines              │  │  • Industry-specific (FDA, etc)│                   │
│  │                                │  │                                │                   │
│  │  [Select Retail]               │  │  [Select Manufacturing]        │                   │
│  │                                │  │                                │                   │
│  └────────────────────────────────┘  └────────────────────────────────┘                   │
│                                                                                             │
│  [Other Industry]                                                                          │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌──────────────────────────────────────────────┐
│  [☰]  Industry Specialization    [🔔] [👤]   │
├──────────────────────────────────────────────┤
│                                              │
│  Current Industry: 🏥 Healthcare             │
│  [Change]                                    │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  HIPAA Security Rule                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│  │  Status: ✅ Implemented              │   │
│  │  Progress: [██████████] 94%          │   │
│  │  Controls: 45/48                     │   │
│  │  [View] [Gap Analysis]               │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  HITECH Act                          │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│  │  Status: 🔄 In Progress              │   │
│  │  Progress: [████████░░] 78%          │   │
│  │  Controls: 14/18                     │   │
│  │  [View] [Gap Analysis]               │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Templates                                   │
│  • HIPAA Privacy Policy                      │
│  • Breach Notification                       │
│  • Patient Data Access                       │
│  [View All]                                  │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────┐
│  [<]  Industry          │
├─────────────────────────┤
│                         │
│  🏥 Healthcare          │
│  [Change Industry]      │
│                         │
│  Frameworks             │
│  ┌───────────────────┐ │
│  │ HIPAA Security    │ │
│  │ ✅ 94% Complete   │ │
│  │ 45/48 controls    │ │
│  │ [View]            │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ HITECH Act        │ │
│  │ 🔄 78% Complete   │ │
│  │ 14/18 controls    │ │
│  │ [View]            │ │
│  └───────────────────┘ │
│                         │
│  Templates              │
│  • Privacy Policy       │
│  • Breach Notice        │
│  • Data Access          │
│  [View All]             │
│                         │
│  Checklist              │
│  ✅ Risk Assessment     │
│  ✅ BAA Agreements      │
│  🔄 Breach Plan (60%)   │
│  [View All]             │
│                         │
└─────────────────────────┘
```

---

## Component States

### Industry Information Modal
```
┌─────────────────────────────────────────────────┐
│  Healthcare Industry - Regulatory Overview [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🏥 Healthcare Industry                         │
│                                                 │
│  Overview:                                      │
│  Healthcare providers, health plans, healthcare │
│  clearinghouses, and business associates that   │
│  create, receive, maintain, or transmit         │
│  protected health information (PHI).            │
│                                                 │
│  Primary Regulations:                           │
│                                                 │
│  HIPAA (Health Insurance Portability Act)       │
│  • Privacy Rule: PHI protection standards       │
│  • Security Rule: Technical safeguards          │
│  • Breach Notification Rule: Incident response  │
│  • Enforcement Rule: Penalties & audits         │
│                                                 │
│  HITECH Act (2009)                              │
│  • Enhanced HIPAA enforcement                   │
│  • Breach notification requirements             │
│  • Business associate liability                 │
│  • Meaningful use requirements                  │
│                                                 │
│  FDA 21 CFR Part 11                             │
│  • Electronic records and signatures            │
│  • Medical device software                      │
│  • Pharmaceutical manufacturing                 │
│                                                 │
│  Key Compliance Requirements:                   │
│  • Risk assessments (annual)                    │
│  • Business associate agreements                │
│  • Breach notification procedures               │
│  • Employee training (annual)                   │
│  • Access controls & audit logs                 │
│  • Encryption for PHI at rest & in transit      │
│                                                 │
│  Penalties for Non-Compliance:                  │
│  • Tier 1: $100-$50,000 per violation           │
│  • Tier 2: $1,000-$50,000 per violation         │
│  • Tier 3: $10,000-$50,000 per violation        │
│  • Tier 4: $50,000 per violation                │
│  • Annual maximum: $1.5 million                 │
│                                                 │
│  [Get Started] [View Frameworks] [Close]        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Interactions

### 1. Select Industry
1. User clicks "Select Your Industry"
2. Views industry options
3. Clicks on industry card
4. System loads industry-specific frameworks
5. Shows applicable regulations and templates

### 2. View Framework Details
1. User clicks on framework card
2. Opens framework detail view
3. Shows controls and requirements
4. Can run gap analysis
5. Can generate compliance report

### 3. Use Policy Template
1. User browses policy templates
2. Clicks "Use Template"
3. Opens document editor with template
4. Customizes for organization
5. Saves as document

### 4. Track Compliance Checklist
1. User views industry checklist
2. Marks items as complete
3. System tracks progress
4. Updates compliance score
5. Generates reports

### 5. Change Industry
1. User clicks "Change Industry"
2. Confirms change (warns about data)
3. Selects new industry
4. System updates frameworks
5. Remaps existing controls

---

## Industry Coverage

### Healthcare
- HIPAA Security & Privacy Rules
- HITECH Act
- FDA 21 CFR Part 11
- State-specific (e.g., California CMIA)

### Financial Services
- PCI DSS
- SOX (Sarbanes-Oxley)
- GLBA (Gramm-Leach-Bliley)
- FFIEC Guidelines
- State regulations (e.g., NY DFS)

### Technology
- SOC 2
- ISO 27001
- GDPR (EU)
- CCPA (California)
- Cloud-specific certifications

### Government
- FedRAMP
- NIST 800-53
- FISMA
- CJIS (law enforcement)
- State & local requirements

### Retail & E-Commerce
- PCI DSS
- GDPR (EU customers)
- CCPA (California)
- FTC Guidelines

### Manufacturing
- ISO 9001
- ISO 27001
- NIST Cybersecurity Framework
- Industry-specific (automotive, aerospace, etc.)

---

## Accessibility

### WCAG 2.2 AA Compliance
- ✅ Keyboard navigation for industry cards
- ✅ Screen reader support for frameworks
- ✅ Clear focus indicators
- ✅ Accessible progress bars
- ✅ ARIA labels for interactive elements

### Keyboard Shortcuts
- `Tab` - Navigate industries
- `Enter` - Select industry
- `Escape` - Close modals

---

## Technical Notes

### API Endpoints
```
GET    /api/industries                - List all industries
GET    /api/industries/:id            - Get industry details
POST   /api/organization/industry     - Set organization industry
GET    /api/industries/:id/frameworks - Get industry frameworks
GET    /api/industries/:id/templates  - Get policy templates
GET    /api/industries/:id/checklist  - Get compliance checklist
```

### Data Model
```typescript
interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  regulations: Regulation[];
  frameworks: string[]; // Framework IDs
  templates: Template[];
  checklist: ChecklistItem[];
}

interface Regulation {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  scope: string;
  requirements: string[];
  penalties: PenaltyTier[];
  resources: {
    officialSite: string;
    guidance: string[];
  };
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  frequency: 'once' | 'annual' | 'quarterly' | 'ongoing';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
}
```

### Industry Mapping
```typescript
const industryFrameworkMap = {
  healthcare: {
    required: ['hipaa-security', 'hipaa-privacy', 'hitech'],
    recommended: ['fda-21-cfr-11', 'iso-27001'],
    optional: ['soc-2', 'nist-800-53'],
  },
  financial: {
    required: ['pci-dss', 'sox', 'glba'],
    recommended: ['ffiec', 'iso-27001'],
    optional: ['soc-2', 'nist-csf'],
  },
  technology: {
    required: ['soc-2', 'iso-27001'],
    recommended: ['gdpr', 'ccpa'],
    optional: ['nist-csf', 'fedramp'],
  },
  // ... other industries
};

function getApplicableFrameworks(industryId: string) {
  const mapping = industryFrameworkMap[industryId];
  return {
    required: mapping.required.map(id => frameworks.find(f => f.id === id)),
    recommended: mapping.recommended.map(id => frameworks.find(f => f.id === id)),
    optional: mapping.optional.map(id => frameworks.find(f => f.id === id)),
  };
}
```

---

## Related Wireframes
- [14-compliance-frameworks.md](./14-compliance-frameworks.md) - Compliance frameworks
- [03-documents-list.md](./03-documents-list.md) - Document templates
- [15-risk-assessment.md](./15-risk-assessment.md) - Risk assessment
- [16-reports-export.md](./16-reports-export.md) - Compliance reports

---

**Created:** December 12, 2025
**Status:** Complete
**Version:** 1.0
