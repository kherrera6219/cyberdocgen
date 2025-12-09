# Audit Trail Wireframe

**Screen:** Audit Trail / Activity Log
**Status:** Complete
**Priority:** High (Compliance Critical)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                           [User Menu v] │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   SIDEBAR (240px)      │              AUDIT TRAIL                           │
│   ─────────────────    │              ───────────                           │
│                        │                                                    │
│   > Dashboard          │   ┌────────────────────────────────────────────┐   │
│     Documents          │   │                                            │   │
│     Gap Analysis       │   │   FILTERS                                  │   │
│   * Audit Trail        │   │   ───────                                  │   │
│     Reports            │   │                                            │   │
│     ─────────────      │   │   Date Range        Action Type            │   │
│     Cloud Storage      │   │   ┌──────────[v]┐   ┌──────────────[v]┐    │   │
│     Settings           │   │   │ Last 7 days │   │ All Actions     │    │   │
│                        │   │   └─────────────┘   └─────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   User              Resource Type          │   │
│                        │   │   ┌──────────[v]┐   ┌──────────────[v]┐    │   │
│                        │   │   │ All Users   │   │ All Resources   │    │   │
│                        │   │   └─────────────┘   └─────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   Risk Level        Search                 │   │
│                        │   │   ┌──────────[v]┐   ┌──────────────────┐   │   │
│                        │   │   │ All Levels  │   │ Search events... │   │   │
│                        │   │   └─────────────┘   └──────────────────┘   │   │
│                        │   │                                            │   │
│                        │   │   (-------- Clear --------) [== Apply ==]  │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   ACTIVITY LOG                             │   │
│                        │   │   ────────────                             │   │
│                        │   │                                            │   │
│                        │   │   Showing 1-50 of 1,234 events             │   │
│                        │   │   [Export CSV] [Export PDF]                │   │
│                        │   │                                            │   │
│                        │   │   ┌────────────────────────────────────┐   │   │
│                        │   │   │ TIMESTAMP    ACTION   USER  DETAIL │   │   │
│                        │   │   ├────────────────────────────────────┤   │   │
│                        │   │   │ Dec 9, 10:32 [LOGIN]  jsmith       │   │   │
│                        │   │   │ [LOW]        Successful login from │   │   │
│                        │   │   │              IP: 192.168.1.100     │   │   │
│                        │   │   ├────────────────────────────────────┤   │   │
│                        │   │   │ Dec 9, 10:28 [DOCUMENT] agarcia   │   │   │
│                        │   │   │ [MEDIUM]     Updated document:     │   │   │
│                        │   │   │              "ISO 27001 Policy"    │   │   │
│                        │   │   ├────────────────────────────────────┤   │   │
│                        │   │   │ Dec 9, 10:15 [EXPORT]  mjohnson   │   │   │
│                        │   │   │ [HIGH]       Exported 15 documents │   │   │
│                        │   │   │              to external storage   │   │   │
│                        │   │   ├────────────────────────────────────┤   │   │
│                        │   │   │ Dec 9, 10:02 [SETTINGS] admin     │   │   │
│                        │   │   │ [CRITICAL]   Changed MFA policy   │   │   │
│                        │   │   │              for organization     │   │   │
│                        │   │   ├────────────────────────────────────┤   │   │
│                        │   │   │ Dec 9, 09:45 [AI]       lchen     │   │   │
│                        │   │   │ [LOW]        AI document analysis │   │   │
│                        │   │   │              completed             │   │   │
│                        │   │   └────────────────────────────────────┘   │   │
│                        │   │                                            │   │
│                        │   │   [< Prev] Page 1 of 25 [Next >]           │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Filter Options

### Date Range
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range (date picker)

### Action Types
- All Actions
- Login/Logout
- Document Create
- Document Update
- Document Delete
- Document Export
- Settings Change
- User Management
- AI Operations
- API Access

### Resource Types
- All Resources
- Documents
- Users
- Organizations
- Settings
- Integrations
- AI Features

### Risk Levels
- All Levels
- Low (informational)
- Medium (notable)
- High (attention required)
- Critical (security event)

---

## Event Detail Expansion

```
┌────────────────────────────────────────────────────────────────┐
│ EVENT DETAILS                                          [Close] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Timestamp:     December 9, 2025 10:32:45 AM UTC                │
│ Event ID:      evt_1234567890abcdef                            │
│ Action:        LOGIN                                           │
│ Risk Level:    LOW                                             │
│                                                                │
│ ─────────────────────────────────────────────                  │
│                                                                │
│ User Information                                               │
│ ─────────────────                                              │
│ User:          John Smith (jsmith@company.com)                 │
│ Role:          Compliance Manager                              │
│ Organization:  TechCorp Industries                             │
│                                                                │
│ ─────────────────────────────────────────────                  │
│                                                                │
│ Session Details                                                │
│ ───────────────                                                │
│ IP Address:    192.168.1.100                                   │
│ Location:      San Francisco, CA, USA                          │
│ Device:        Chrome 120.0 on Windows 11                      │
│ MFA Used:      Yes (TOTP)                                      │
│                                                                │
│ ─────────────────────────────────────────────                  │
│                                                                │
│ Additional Metadata                                            │
│ ───────────────────                                            │
│ Session ID:    sess_abc123def456                               │
│ Request ID:    req_xyz789012345                                │
│                                                                │
│ ─────────────────────────────────────────────                  │
│                                                                │
│ [View User Profile] [View Related Events] [Export Event]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Risk Level Indicators

| Level | Color | Badge | Description |
|-------|-------|-------|-------------|
| LOW | Gray | [LOW] | Routine operations |
| MEDIUM | Blue | [MEDIUM] | Notable changes |
| HIGH | Orange | [HIGH] | Attention required |
| CRITICAL | Red | [CRITICAL] | Security events |

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [=] [Logo] CyberDocGen                        [User Menu v] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              AUDIT TRAIL                                     │
│              ───────────                                     │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ FILTERS                                              │   │
│   │ ───────                                              │   │
│   │                                                      │   │
│   │ Date Range          Action Type         Risk Level   │   │
│   │ ┌────────────[v]┐   ┌────────────[v]┐   ┌────────[v]┐│   │
│   │ │ Last 7 days  │   │ All Actions  │   │ All     │   │   │
│   │ └──────────────┘   └──────────────┘   └─────────┘   │   │
│   │                                                      │   │
│   │ Search: ┌─────────────────────────────────────────┐  │   │
│   │         │ Search events...                        │  │   │
│   │         └─────────────────────────────────────────┘  │   │
│   │                                                      │   │
│   │ (------- Clear -------) [======= Apply =======]      │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ ACTIVITY LOG                   [Export CSV] [PDF]    │   │
│   │ ────────────                                         │   │
│   │                                                      │   │
│   │ Showing 1-50 of 1,234 events                         │   │
│   │                                                      │   │
│   │ ┌────────────────────────────────────────────────┐   │   │
│   │ │ Dec 9, 10:32   [LOGIN]   jsmith                │   │   │
│   │ │ [LOW]          Successful login from IP:...    │   │   │
│   │ ├────────────────────────────────────────────────┤   │   │
│   │ │ Dec 9, 10:28   [DOCUMENT] agarcia              │   │   │
│   │ │ [MEDIUM]       Updated document: "ISO 27001"   │   │   │
│   │ ├────────────────────────────────────────────────┤   │   │
│   │ │ Dec 9, 10:15   [EXPORT]   mjohnson             │   │   │
│   │ │ [HIGH]         Exported 15 documents           │   │   │
│   │ └────────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │ [< Prev] Page 1 of 25 [Next >]                       │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component States

### Filter Dropdowns
- **Default:** Placeholder or "All" selected
- **Focus:** Border highlighted, options visible
- **Selected:** Selected value displayed
- **Disabled:** Greyed out during loading

### Event List
- **Default:** List of events with pagination
- **Loading:** Skeleton rows
- **Empty:** "No events match your filters" message
- **Error:** Error banner with retry option

### Event Row
- **Default:** Condensed event summary
- **Hover:** Row highlighted
- **Expanded:** Full event details visible
- **Selected:** Row selected for actions

### Export Buttons
- **Default:** Active
- **Loading:** Spinner, disabled
- **Disabled:** When no events to export
- **Success:** Download initiated

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│  [=] AUDIT TRAIL         [...]  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ [Filter]  [Last 7 days] │    │
│  └─────────────────────────┘    │
│                                 │
│  1,234 events                   │
│                                 │
│  ─────────────────────────      │
│                                 │
│  Today                          │
│  ─────                          │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10:32 AM                │    │
│  │ [LOGIN] jsmith          │    │
│  │ Successful login        │    │
│  │ [LOW]                 > │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10:28 AM                │    │
│  │ [DOCUMENT] agarcia      │    │
│  │ Updated "ISO 27001..."  │    │
│  │ [MEDIUM]              > │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10:15 AM                │    │
│  │ [EXPORT] mjohnson       │    │
│  │ Exported 15 documents   │    │
│  │ [HIGH]                > │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10:02 AM                │    │
│  │ [SETTINGS] admin        │    │
│  │ Changed MFA policy      │    │
│  │ [CRITICAL]            > │    │
│  └─────────────────────────┘    │
│                                 │
│  [Load More]                    │
│                                 │
└─────────────────────────────────┘
```

---

## Export Options

### CSV Export
- All visible columns
- Full event details
- Filterable by current filters

### PDF Export
- Formatted report
- Company branding
- Summary statistics
- Detailed event log

---

## Accessibility Notes

- Risk level colors supplemented with text labels
- Keyboard navigation through event list
- Screen reader announces event summaries
- Filter changes announced
- Pagination accessible via keyboard

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
