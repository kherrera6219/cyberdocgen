# Dashboard (Home) Wireframe

**Screen:** Dashboard - Home Page
**Route:** `/`
**Viewport:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
**Status:** Core screen

---

## Desktop Layout (1920x1080)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] CyberDocGen          🔍 Search...                    [🔔] [👤] John Doe  [⚙️]     │
├──────────┬─────────────────────────────────────────────────────────────────────────────┤
│          │                                                                             │
│ 📊 Dashboard                     Dashboard                      Last updated: 5m ago │
│          │                                                                             │
│ 📄 Documents  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│          │    │   📄 1,247  │  │   ✅ 892    │  │   ⚠️  124    │  │   🔄 231    │   │
│ 🔍 Gap Analysis│ Total       │  │ Compliant   │  │  Gaps       │  │  In Review  │   │
│          │    │ Documents   │  │ Documents   │  │  Found      │  │  Documents  │   │
│ 📋 Frameworks │└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│          │                                                                             │
│ 🎯 Risk      │  ┌──────────────────────────────────────────────────────────────┐     │
│  Assessment  │  │  📊 Compliance Status by Framework                           │     │
│          │  │                                                              │     │
│ 📝 Audit Trail│  │  ISO 27001  [████████████════════] 82%  🟢 On Track      │     │
│          │  │                                                              │     │
│ ☁️  Cloud    │  │  SOC 2      [██████████══════════] 75%  🟡 Needs Attention│     │
│  Integrations│  │                                                              │     │
│          │  │  NIST 800-53[████████████████════] 88%  🟢 Excellent        │     │
│ 👥 Users     │  │                                                              │     │
│          │  │  FedRAMP    [████════════════════] 45%  🔴 Critical Gaps    │     │
│ 🤖 AI Assistant│  └──────────────────────────────────────────────────────────────┘     │
│          │                                                                             │
│ ⚙️  Settings  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐   │
│          │  │  🕒 Recent Activity          │  │  📈 AI Insights              │   │
│          │  │  ─────────────────────────   │  │  ─────────────────────────   │   │
│          │  │  • Document "Security Policy"│  │  💡 3 high-priority gaps    │   │
│          │  │    updated by Jane Smith     │  │     require attention       │   │
│          │  │    2 hours ago               │  │                             │   │
│          │  │                              │  │  ⚠️  2 documents are         │   │
│          │  │  • Gap analysis completed    │  │     missing required        │   │
│          │  │    for ISO 27001             │  │     signatures              │   │
│          │  │    4 hours ago               │  │                             │   │
│          │  │                              │  │  ✅ 12 new controls met     │   │
│          │  │  • New document uploaded     │  │     compliance standards    │   │
│          │  │    "Incident Response Plan"  │  │                             │   │
│          │  │    Yesterday                 │  │  🔄 Recommended actions:    │   │
│          │  │                              │  │     [Review Gaps]           │   │
│          │  │  [View All Activity →]       │  │     [Generate Report]       │   │
│          │  └─────────────────────────────┘  └─────────────────────────────┘   │
│          │                                                                             │
│          │  ┌────────────────────────────────────────────────────────────────┐        │
│          │  │  📝 Quick Actions                                               │        │
│          │  │  ──────────────────────────────────────────────────────────   │        │
│          │  │  [+ New Document]  [🔍 Run Gap Analysis]  [📊 Generate Report] │        │
│          │  │  [☁️  Sync Cloud]   [🤖 Ask AI Assistant]  [⚙️  Settings]       │        │
│          │  └────────────────────────────────────────────────────────────────┘        │
│          │                                                                             │
└──────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Metric Cards (Top Row)
- **Width:** 23% each (4 columns with gap)
- **Height:** 120px
- **Background:** White
- **Border:** 1px solid Gray 200
- **Border radius:** 12px
- **Padding:** 24px
- **Shadow:** Small shadow

**Card Structure:**
- **Icon:** 32px × 32px, top left
- **Value:** 36px font, bold, primary number
- **Label:** 14px font, gray 600, below value

**Colors:**
- Total Documents: Blue
- Compliant: Green
- Gaps Found: Amber
- In Review: Purple

### Compliance Status Chart
- **Height:** 300px
- **Background:** White card
- **Padding:** 24px
- **Border radius:** 12px

**Progress Bars:**
- **Height:** 32px per framework
- **Spacing:** 16px between bars
- **Label width:** 120px (framework name)
- **Bar:** Rounded, colored by status
- **Percentage:** Right side, bold

**Status Colors:**
- 🟢 Green (>80%): On track
- 🟡 Amber (60-79%): Needs attention
- 🔴 Red (<60%): Critical gaps

### Recent Activity Panel
- **Width:** 48% (left column)
- **Height:** Auto (min 400px)
- **Background:** White
- **Padding:** 24px

**Activity Item:**
- **Icon:** 20px × 20px
- **Title:** 14px, bold
- **Metadata:** 12px, gray 600
- **Spacing:** 16px between items

### AI Insights Panel
- **Width:** 48% (right column)
- **Height:** Matches activity panel
- **Background:** White with blue accent border
- **Padding:** 24px

**Insight Item:**
- **Icon:** 24px × 24px
- **Text:** 14px
- **Action buttons:** Secondary buttons
- **Spacing:** 16px between insights

### Quick Actions Bar
- **Height:** 80px
- **Background:** White
- **Padding:** 24px
- **Border radius:** 12px

**Action Buttons:**
- **Size:** Medium buttons
- **Spacing:** 12px between buttons
- **Icons:** 20px × 20px with text

---

## Responsive Notes

### Tablet (768-1024px)
- Metric cards: 2 columns (50% width each)
- Activity and Insights: Stack vertically (100% width each)
- Quick actions: 2 rows of 3 buttons

### Mobile (<768px)
- Metric cards: 1 column (100% width, stack vertically)
- Compliance chart: Horizontal scroll for overflow
- Activity and Insights: Full width, stack vertically
- Quick actions: 2 columns, stack buttons

---

**Status:** Complete - Core wireframe for dashboard
