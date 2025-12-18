# Risk Assessment Wireframe

**Screen:** Risk Assessment & Management
**Page:** `/risk-assessment`
**Complexity:** High
**User Type:** Authenticated (Risk Manager, Auditor, Admin)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] CyberDocGen                      Risk Assessment                     [🔔] [👤] john.doe│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  🎯 Risk Assessment Dashboard                              [+ New Risk] [Export Report]│ │
│  │                                                                                        │ │
│  │  Identify, assess, and track organizational risks                                     │ │
│  │                                                                                        │ │
│  │  [All Risks] [Critical] [High] [Medium] [Low]              🔍 [Search risks        ] │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  ┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────┐ │
│  │  RISK MATRIX                                 │ │  RISK SUMMARY                        │ │
│  ├──────────────────────────────────────────────┤ ├──────────────────────────────────────┤ │
│  │                                              │ │                                      │ │
│  │        LIKELIHOOD                            │ │  ┌────────────┬──────────┐          │ │
│  │  ^                                           │ │  │ Severity   │  Count   │          │ │
│  │  │ Very    │ 🟡(2) │ 🟠(1) │ 🔴(3) │ 🔴(5) │ │  ├────────────┼──────────┤          │ │
│  │  │ Likely  │       │       │       │       │ │  │ 🔴 Critical│    8     │          │ │
│  │  │         │       │       │       │       │ │  │ 🟠 High    │   15     │          │ │
│  │  │ Likely  │ 🟢(3) │ 🟡(4) │ 🟠(2) │ 🔴(1) │ │  │ 🟡 Medium  │   27     │          │ │
│  │  │         │       │       │       │       │ │  │ 🟢 Low     │   12     │          │ │
│  │  │ Possible│ 🟢(1) │ 🟡(2) │ 🟡(3) │ 🟠(2) │ │  └────────────┴──────────┘          │ │
│  │  │         │       │       │       │       │ │                                      │ │
│  │  │ Unlikely│ 🟢(2) │ 🟢(1) │ 🟡(1) │ 🟡(2) │ │  Total Risks: 62                    │ │
│  │  │         │       │       │       │       │ │  Open: 45  •  Mitigated: 17         │ │
│  │  │ Rare    │ 🟢(1) │ 🟢(2) │ 🟢(1) │ 🟡(1) │ │                                      │ │
│  │  │         └───────┴───────┴───────┴───────┘ │  [View Risk Trends]                 │ │
│  │  │         Low     Minor   Moderate Critical │ │                                      │ │
│  │  │              IMPACT               -->     │ └──────────────────────────────────────┘ │
│  └──────────────────────────────────────────────┘                                         │
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  RISK FINDINGS                                                    [Filter] [Sort]     │ │
│  ├───────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                        │ │
│  │  🔴 CRITICAL                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ RISK-2025-045 │ Data Breach - Unencrypted PII Storage              │ 🔴 Critical│ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │ Impact: Critical  •  Likelihood: Very Likely  •  Risk Score: 25/25              │ │ │
│  │  │ Owner: Sarah Chen  •  Department: IT Security  •  Status: 🔄 In Remediation     │ │ │
│  │  │                                                                                  │ │ │
│  │  │ Description: Customer PII stored in unencrypted databases across 3 systems      │ │ │
│  │  │                                                                                  │ │ │
│  │  │ Remediation Plan: [████████░░] 80% Complete  •  Due: Dec 20, 2025              │ │ │
│  │  │ • ✅ Inventory all databases (Complete)                                         │ │ │
│  │  │ • ✅ Implement encryption at rest (Complete)                                    │ │ │
│  │  │ • 🔄 Migrate Production DB (In Progress - 80%)                                  │ │ │
│  │  │ • ⏳ Security audit (Pending)                                                   │ │ │
│  │  │                                                                                  │ │ │
│  │  │ [View Details] [Update Status] [Add Note]                      Last update: 2h │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                        │ │
│  │  🟠 HIGH                                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ RISK-2025-038 │ Insufficient Access Controls on Admin Panel       │ 🟠 High    │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────────┤ │ │
│  │  │ Impact: Moderate  •  Likelihood: Likely  •  Risk Score: 18/25                   │ │ │
│  │  │ Owner: Mike Johnson  •  Department: Engineering  •  Status: ⏳ Identified       │ │ │
│  │  │                                                                                  │ │ │
│  │  │ Remediation Plan: [░░░░░░░░░░] 0% Complete  •  Due: Jan 15, 2026               │ │ │
│  │  │ • ⏳ Define RBAC requirements                                                   │ │ │
│  │  │ • ⏳ Implement role-based access                                                │ │ │
│  │  │ • ⏳ Audit logs configuration                                                   │ │ │
│  │  │                                                                                  │ │ │
│  │  │ [View Details] [Assign Owner] [Create Ticket]                 Last update: 1d  │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                        │ │
│  │  [Load More Risks...]                                                                 │ │
│  │                                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌──────────────────────────────────────────────┐
│  [☰]  Risk Assessment            [🔔] [👤]   │
├──────────────────────────────────────────────┤
│                                              │
│  🔍 [Search risks                         ]  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  RISK SUMMARY                        │   │
│  ├──────────────────────────────────────┤   │
│  │  🔴 Critical:  8                     │   │
│  │  🟠 High:     15                     │   │
│  │  🟡 Medium:   27                     │   │
│  │  🟢 Low:      12                     │   │
│  │                                      │   │
│  │  Total: 62  •  Open: 45              │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  🔴 RISK-2025-045                    │   │
│  │  Data Breach - Unencrypted PII       │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│  │  Risk Score: 25/25  •  Critical      │   │
│  │  Remediation: [████████░░] 80%       │   │
│  │  Due: Dec 20, 2025                   │   │
│  │  [View] [Update]                     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [+ New Risk] [Export Report]                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────┐
│  [<]  Risk Assessment   │
├─────────────────────────┤
│                         │
│  🎯 Risk Summary        │
│  ┌───────────────────┐ │
│  │ 🔴 Critical:  8   │ │
│  │ 🟠 High:     15   │ │
│  │ 🟡 Medium:   27   │ │
│  │ 🟢 Low:      12   │ │
│  └───────────────────┘ │
│                         │
│  Critical Risks ▼       │
│  ┌───────────────────┐ │
│  │ RISK-2025-045     │ │
│  │ Data Breach       │ │
│  │ 🔴 Critical       │ │
│  │ Remediation: 80%  │ │
│  │ Due: Dec 20       │ │
│  │ [View Details]    │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ RISK-2025-038     │ │
│  │ Access Controls   │ │
│  │ 🟠 High           │ │
│  │ Remediation: 0%   │ │
│  │ Due: Jan 15       │ │
│  │ [View Details]    │ │
│  └───────────────────┘ │
│                         │
│  [+ New Risk]           │
│                         │
└─────────────────────────┘
```

---

## Component States

### Default State
- Risk matrix with color-coded cells
- Summary statistics
- List of risks sorted by severity
- Remediation progress bars

### Loading State
```
┌──────────────────────────────────┐
│  ⏳ Loading risk assessment...   │
│  [====       ] 45%               │
└──────────────────────────────────┘
```

### Empty State
```
┌──────────────────────────────────┐
│  🎯 No Risks Identified          │
│                                  │
│  Start by creating your first    │
│  risk assessment.                │
│                                  │
│  [+ Create Risk Assessment]      │
└──────────────────────────────────┘
```

### Risk Detail Modal
```
┌─────────────────────────────────────────────────┐
│  Risk Details - RISK-2025-045              [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Title: Data Breach - Unencrypted PII Storage  │
│  ID: RISK-2025-045                              │
│  Status: 🔄 In Remediation                      │
│                                                 │
│  Risk Assessment:                               │
│  Impact:      🔴 Critical (5/5)                 │
│  Likelihood:  🔴 Very Likely (5/5)              │
│  Risk Score:  25/25                             │
│                                                 │
│  Details:                                       │
│  Customer PII stored in unencrypted databases   │
│  across 3 production systems. Violates GDPR     │
│  and PCI-DSS requirements.                      │
│                                                 │
│  Affected Systems:                              │
│  • Customer DB (PostgreSQL)                     │
│  • Analytics DB (MySQL)                         │
│  • Archive Storage (S3)                         │
│                                                 │
│  Owner: Sarah Chen (IT Security)                │
│  Created: Nov 15, 2025                          │
│  Due Date: Dec 20, 2025                         │
│                                                 │
│  Remediation Plan: [████████░░] 80%             │
│  • ✅ Inventory databases                       │
│  • ✅ Implement encryption at rest              │
│  • 🔄 Migrate production (80%)                  │
│  • ⏳ Security audit                            │
│                                                 │
│  [Edit] [Add Note] [Update Status] [Close]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Interactions

### 1. View Risk Matrix
1. User views color-coded risk matrix
2. Clicks on matrix cell
3. Shows list of risks in that category
4. Can drill down to individual risk details

### 2. Create New Risk
1. User clicks "+ New Risk"
2. Opens risk assessment form
3. Selects impact and likelihood
4. System calculates risk score
5. Assigns owner and due date
6. Creates remediation plan
7. Saves risk to database

### 3. Update Remediation Status
1. User opens risk detail
2. Updates remediation task status
3. Progress bar updates automatically
4. System tracks changes in activity log
5. Notifications sent to stakeholders

### 4. Risk Filtering
1. User selects severity filter
2. List updates to show matching risks
3. Can combine multiple filters
4. Export filtered results

### 5. Export Risk Report
1. User clicks "Export Report"
2. Selects report format (PDF, Excel, CSV)
3. Chooses data range and filters
4. System generates report
5. Download link provided

---

## Risk Assessment Criteria

### Impact Levels
- **Critical (5):** Catastrophic business impact, regulatory violations
- **Moderate (4):** Major business disruption, significant financial loss
- **Moderate (3):** Moderate business impact, manageable losses
- **Minor (2):** Minor disruption, minimal impact
- **Low (1):** Negligible impact

### Likelihood Levels
- **Very Likely (5):** Expected to occur frequently
- **Likely (4):** Will probably occur
- **Possible (3):** Might occur occasionally
- **Unlikely (2):** Not expected to occur
- **Rare (1):** May occur in exceptional circumstances

### Risk Score Calculation
```
Risk Score = Impact × Likelihood
Range: 1-25

Severity Classification:
• 20-25: 🔴 Critical
• 15-19: 🟠 High
• 8-14:  🟡 Medium
• 1-7:   🟢 Low
```

---

## Accessibility

### WCAG 2.2 AA Compliance
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Screen reader support for risk matrix
- ✅ Color-blind friendly color palette
- ✅ Text alternatives for color coding
- ✅ Focus indicators on all interactive elements
- ✅ ARIA labels for progress bars
- ✅ Sufficient color contrast (4.5:1 minimum)

### Keyboard Shortcuts
- `N` - New risk
- `F` - Filter risks
- `E` - Export report
- `/` - Search
- `Escape` - Close modals

---

## Technical Notes

### API Endpoints
```
GET    /api/risks                    - List all risks
POST   /api/risks                    - Create new risk
GET    /api/risks/:id                - Get risk details
PUT    /api/risks/:id                - Update risk
DELETE /api/risks/:id                - Delete risk
GET    /api/risks/matrix             - Get risk matrix data
GET    /api/risks/:id/remediation    - Get remediation plan
PUT    /api/risks/:id/remediation    - Update remediation
POST   /api/risks/export             - Export risk report
GET    /api/risks/analytics          - Get risk analytics
```

### Data Model
```typescript
interface Risk {
  id: string;
  title: string;
  description: string;
  impact: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  riskScore: number; // impact × likelihood
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'identified' | 'in_remediation' | 'mitigated' | 'accepted';
  owner: User;
  department: string;
  affectedSystems: string[];
  remediationPlan: RemediationTask[];
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RemediationTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'complete';
  assignee: User;
  dueDate: Date;
  completedAt?: Date;
}
```

### Real-Time Updates
```typescript
// WebSocket for live updates
const ws = new WebSocket('/api/risks/live');

ws.on('risk_updated', (data) => {
  updateRiskInList(data.riskId);
  refreshRiskMatrix();
});

ws.on('remediation_progress', (data) => {
  updateProgressBar(data.riskId, data.progress);
});
```

---

## Related Wireframes
- [02-dashboard.md](./02-dashboard.md) - Main dashboard
- [14-compliance-frameworks.md](./14-compliance-frameworks.md) - Compliance frameworks
- [16-reports-export.md](./16-reports-export.md) - Reports & export
- [20-admin-dashboard.md](./20-admin-dashboard.md) - Admin dashboard

---

**Created:** December 12, 2025
**Status:** Complete
**Version:** 1.0
