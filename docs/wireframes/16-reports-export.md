# Reports & Export Center Wireframe

**Screen:** Reports & Export Center
**Page:** `/reports-export`
**Complexity:** High
**User Type:** Authenticated (All roles, with permissions)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] CyberDocGen                   Reports & Export Center              [🔔] [👤] john.doe  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  📊 Reports & Export Center                                        [+ Custom Report]  │ │
│  │                                                                                        │ │
│  │  Generate compliance reports and export documents in various formats                  │ │
│  │                                                                                        │ │
│  │  [Standard Reports] [Compliance Reports] [Custom Reports] [Export History]           │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUICK ACTIONS                                                                       │  │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │  📋 Compliance       │  │  🔍 Audit Report    │  │  📊 Gap Analysis    │        │  │
│  │  │     Summary          │  │                     │  │                     │        │  │
│  │  │                      │  │  Generate audit     │  │  Framework          │        │  │
│  │  │  All frameworks      │  │  readiness report   │  │  compliance gaps    │        │  │
│  │  │  status & coverage   │  │                     │  │                     │        │  │
│  │  │                      │  │                     │  │                     │        │  │
│  │  │  [Generate Report]   │  │  [Generate Report]  │  │  [Generate Report]  │        │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                                                      │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │  ⚠️  Risk Register   │  │  👥 User Activity   │  │  📄 Document Export │        │  │
│  │  │                      │  │                     │  │                     │        │  │
│  │  │  Risk assessment     │  │  User access &      │  │  Bulk export        │        │  │
│  │  │  & mitigation        │  │  activity logs      │  │  documents          │        │  │
│  │  │                      │  │                     │  │                     │        │  │
│  │  │  [Generate Report]   │  │  [Generate Report]  │  │  [Start Export]     │        │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  GENERATE REPORT                                                                     │  │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  Report Type                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ [v] Compliance Summary Report                                                │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                      │  │
│  │  Framework(s)                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ [x] ISO 27001:2022    [x] SOC 2 Type II    [ ] NIST 800-53    [ ] FedRAMP   │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                      │  │
│  │  Date Range                                                                          │  │
│  │  ┌────────────────────────┐  to  ┌────────────────────────┐                        │  │
│  │  │ 📅 Jan 1, 2025         │      │ 📅 Dec 12, 2025        │                        │  │
│  │  └────────────────────────┘      └────────────────────────┘                        │  │
│  │                                                                                      │  │
│  │  Export Format                                                                       │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                       │  │
│  │  │● PDF   │  │○ DOCX  │  │○ XLSX  │  │○ CSV   │  │○ HTML  │                       │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘                       │  │
│  │                                                                                      │  │
│  │  Include Sections                                                                    │  │
│  │  [x] Executive Summary        [x] Control Status        [x] Evidence Documents     │  │
│  │  [x] Gap Analysis             [x] Recommendations       [ ] Detailed Audit Trail   │  │
│  │  [x] Risk Assessment          [x] Compliance Score      [ ] User Activity Logs     │  │
│  │                                                                                      │  │
│  │  Report Options                                                                      │  │
│  │  [x] Include company logo and branding                                              │  │
│  │  [x] Add digital signature                                                          │  │
│  │  [ ] Redact sensitive information                                                   │  │
│  │  [ ] Include appendices with full documentation                                     │  │
│  │                                                                                      │  │
│  │  ┌════════════════════════════┐  ┌──────────────────────┐  ┌──────────────────┐   │  │
│  │  ║  Generate Report           ║  │  Preview             │  │  Save Template   │   │  │
│  │  └════════════════════════════┘  └──────────────────────┘  └──────────────────┘   │  │
│  │                                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RECENT EXPORTS                                                      [View All]     │  │
│  ├─────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  📄 Compliance_Summary_ISO27001_2025-12-12.pdf                          2 hours ago │  │
│  │     ISO 27001, SOC 2  •  12 pages  •  Generated by: John Doe     [Download] [Share]│  │
│  │                                                                                      │  │
│  │  📊 Risk_Register_Q4_2025.xlsx                                          1 day ago   │  │
│  │     All Frameworks  •  62 risks  •  Generated by: Sarah Chen      [Download] [Share]│  │
│  │                                                                                      │  │
│  │  📋 Audit_Readiness_Report_2025.pdf                                    3 days ago   │  │
│  │     SOC 2 Type II  •  45 pages  •  Generated by: Mike Johnson     [Download] [Share]│  │
│  │                                                                                      │  │
│  │  📈 Gap_Analysis_NIST800-53.docx                                       5 days ago   │  │
│  │     NIST 800-53  •  28 pages  •  Generated by: John Doe           [Download] [Share]│  │
│  │                                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌──────────────────────────────────────────────┐
│  [☰]  Reports & Export           [🔔] [👤]   │
├──────────────────────────────────────────────┤
│                                              │
│  📊 Quick Reports                            │
│  ┌──────────────────────────────────────┐   │
│  │  📋 Compliance Summary               │   │
│  │  [Generate]                          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  🔍 Audit Report                     │   │
│  │  [Generate]                          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Custom Report                               │
│  ┌──────────────────────────────────────┐   │
│  │  Report Type                         │   │
│  │  [v] Compliance Summary              │   │
│  │                                      │   │
│  │  Framework                           │   │
│  │  [x] ISO 27001  [x] SOC 2            │   │
│  │                                      │   │
│  │  Format                              │   │
│  │  ●PDF  ○DOCX  ○XLSX  ○CSV            │   │
│  │                                      │   │
│  │  [Generate Report]                   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Recent Exports                              │
│  ┌──────────────────────────────────────┐   │
│  │  📄 Compliance_Summary.pdf           │   │
│  │     2 hours ago  [↓]                 │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────┐
│  [<]  Reports & Export  │
├─────────────────────────┤
│                         │
│  Quick Reports          │
│  ┌───────────────────┐ │
│  │ 📋 Compliance     │ │
│  │    Summary        │ │
│  │ [Generate]        │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ 🔍 Audit Report   │ │
│  │ [Generate]        │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ 📊 Gap Analysis   │ │
│  │ [Generate]        │ │
│  └───────────────────┘ │
│                         │
│  Recent Exports         │
│  ┌───────────────────┐ │
│  │ 📄 Compliance.pdf │ │
│  │ 2 hours ago       │ │
│  │ [Download]        │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │ 📊 Risk_Q4.xlsx   │ │
│  │ 1 day ago         │ │
│  │ [Download]        │ │
│  └───────────────────┘ │
│                         │
│  [+ Custom Report]      │
│                         │
└─────────────────────────┘
```

---

## Component States

### Default State
- Quick action cards for common reports
- Report generation form
- List of recent exports

### Generating State
```
┌──────────────────────────────────────────┐
│  🔄 Generating Report...                 │
│                                          │
│  Compliance Summary Report               │
│  ISO 27001:2022, SOC 2 Type II           │
│                                          │
│  [████████████░░░░░░] 65%                │
│                                          │
│  • ✅ Gathering compliance data          │
│  • ✅ Analyzing control status           │
│  • 🔄 Generating visualizations          │
│  • ⏳ Compiling PDF document             │
│  • ⏳ Adding digital signature           │
│                                          │
│  Estimated time: 2 minutes               │
└──────────────────────────────────────────┘
```

### Report Ready State
```
┌──────────────────────────────────────────┐
│  ✅ Report Generated Successfully!       │
│                                          │
│  Compliance_Summary_2025-12-12.pdf       │
│  Size: 2.4 MB  •  12 pages               │
│                                          │
│  ┌════════════════════════════════════┐ │
│  ║  Download Report                   ║ │
│  └════════════════════════════════════┘ │
│                                          │
│  [Preview] [Share] [Generate Another]   │
└──────────────────────────────────────────┘
```

### Report Preview Modal
```
┌─────────────────────────────────────────────────────────┐
│  Report Preview - Compliance Summary          [✕]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │         COMPLIANCE SUMMARY REPORT                │ │
│  │                                                   │ │
│  │              ISO 27001:2022                      │ │
│  │               SOC 2 Type II                      │ │
│  │                                                   │ │
│  │            Generated: Dec 12, 2025               │ │
│  │                                                   │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │                                                   │ │
│  │  EXECUTIVE SUMMARY                               │ │
│  │                                                   │ │
│  │  Overall Compliance Score: 87%                   │ │
│  │                                                   │ │
│  │  ISO 27001:2022           [██████████] 92%       │ │
│  │  SOC 2 Type II            [████████░░] 78%       │ │
│  │                                                   │ │
│  │  CONTROL STATUS                                  │ │
│  │                                                   │ │
│  │  Total Controls: 178                             │ │
│  │  Implemented: 155 (87%)                          │ │
│  │  In Progress: 16 (9%)                            │ │
│  │  Not Started: 7 (4%)                             │ │
│  │                                                   │ │
│  │  [Page 1 of 12]                                  │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [< Previous] [Next >] [Download PDF] [Close]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Export Error State
```
┌──────────────────────────────────────────┐
│  ⚠️  Report Generation Failed            │
│                                          │
│  Unable to generate compliance report.   │
│                                          │
│  Error: Insufficient data for the        │
│  selected date range.                    │
│                                          │
│  [Try Again] [Contact Support]           │
└──────────────────────────────────────────┘
```

---

## Interactions

### 1. Quick Report Generation
1. User clicks quick action card
2. System uses predefined settings
3. Shows generation progress
4. Displays success with download link

### 2. Custom Report Creation
1. User selects report type
2. Chooses frameworks and filters
3. Selects date range
4. Picks export format
5. Configures include options
6. Clicks "Generate Report"
7. System processes request
8. Shows progress indicator
9. Provides download when ready

### 3. Report Preview
1. User clicks "Preview" button
2. Opens modal with paginated preview
3. User can navigate pages
4. Can download or close

### 4. Bulk Document Export
1. User navigates to document export
2. Selects documents or filters
3. Chooses export format
4. System creates archive
5. Downloads ZIP file

### 5. Schedule Report
1. User creates custom report
2. Clicks "Save Template"
3. Sets schedule (daily, weekly, monthly)
4. Configures email recipients
5. System sends reports automatically

---

## Report Types

### Standard Reports
- **Compliance Summary:** Overall compliance status across all frameworks
- **Audit Report:** Detailed audit readiness assessment
- **Gap Analysis:** Identifies compliance gaps and recommendations
- **Risk Register:** Complete risk assessment with mitigation plans
- **User Activity:** Access logs and user activity tracking
- **Control Evidence:** Evidence documentation for all controls

### Compliance Reports
- **ISO 27001 Certification Report:** Annex A controls status
- **SOC 2 Readiness Report:** Trust service criteria assessment
- **NIST 800-53 Status:** Security control implementation
- **FedRAMP Assessment:** Federal compliance requirements

### Custom Reports
- User-defined filters and criteria
- Custom date ranges
- Specific frameworks or controls
- Tailored sections and content

---

## Export Formats

### PDF
- Professional formatting
- Page numbers and headers
- Table of contents
- Executive summary
- Digital signature support
- Bookmarks for navigation

### DOCX
- Editable Microsoft Word format
- Customizable templates
- Track changes enabled
- Comments supported

### XLSX
- Excel spreadsheet format
- Multiple worksheets
- Pivot tables
- Charts and graphs
- Formulas preserved

### CSV
- Raw data export
- Compatible with databases
- Easy data manipulation
- Bulk imports supported

### HTML
- Web-ready format
- Interactive elements
- Responsive design
- Shareable links

---

## Accessibility

### WCAG 2.2 AA Compliance
- ✅ Keyboard navigation for all form elements
- ✅ Screen reader support for generation progress
- ✅ Clear focus indicators
- ✅ Accessible date pickers
- ✅ ARIA labels for checkboxes and radio buttons
- ✅ Status announcements for completion
- ✅ High contrast text and buttons

### Keyboard Shortcuts
- `G` - Generate report
- `P` - Preview report
- `S` - Save template
- `Escape` - Close modal
- `Tab` - Navigate form fields

---

## Technical Notes

### API Endpoints
```
GET    /api/reports/templates           - List report templates
POST   /api/reports/generate             - Generate report
GET    /api/reports/:id                  - Get report details
GET    /api/reports/:id/download         - Download report
GET    /api/reports/history              - Export history
POST   /api/reports/schedule             - Schedule report
DELETE /api/reports/:id                  - Delete report
POST   /api/documents/bulk-export        - Bulk export documents
GET    /api/reports/:id/preview          - Preview report
```

### Report Generation Process
```typescript
interface ReportRequest {
  type: 'compliance' | 'audit' | 'gap_analysis' | 'risk' | 'custom';
  frameworks: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'html';
  sections: string[];
  options: {
    includeLogo: boolean;
    includeSignature: boolean;
    redactSensitive: boolean;
    includeAppendices: boolean;
  };
}

// Generation flow
async function generateReport(request: ReportRequest) {
  // 1. Validate request
  validateReportRequest(request);

  // 2. Gather data
  const data = await gatherReportData(request);

  // 3. Generate document
  const document = await createDocument(data, request.format);

  // 4. Apply branding
  if (request.options.includeLogo) {
    applyBranding(document);
  }

  // 5. Add signature
  if (request.options.includeSignature) {
    addDigitalSignature(document);
  }

  // 6. Save to storage
  const url = await saveReport(document);

  // 7. Return download link
  return { url, metadata };
}
```

### Report Scheduling
```typescript
interface ReportSchedule {
  reportTemplate: ReportRequest;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  recipients: string[]; // email addresses
  enabled: boolean;
}

// Cron job for scheduled reports
cron.schedule('0 * * * *', async () => {
  const dueReports = await getScheduledReports();
  for (const schedule of dueReports) {
    const report = await generateReport(schedule.reportTemplate);
    await emailReport(report, schedule.recipients);
  }
});
```

### File Storage
```typescript
// AWS S3 configuration
const s3Config = {
  bucket: 'cyberdocgen-reports',
  region: 'us-east-1',
  encryption: 'AES256',
  expirationDays: 90, // Auto-delete after 90 days
};

// Generate signed URL for secure download
const downloadUrl = s3.getSignedUrl('getObject', {
  Bucket: s3Config.bucket,
  Key: reportKey,
  Expires: 3600, // 1 hour
});
```

---

## Related Wireframes
- [02-dashboard.md](./02-dashboard.md) - Main dashboard
- [14-compliance-frameworks.md](./14-compliance-frameworks.md) - Compliance frameworks
- [15-risk-assessment.md](./15-risk-assessment.md) - Risk assessment
- [20-admin-dashboard.md](./20-admin-dashboard.md) - Admin dashboard

---

**Created:** December 12, 2025
**Status:** Complete
**Version:** 1.0
