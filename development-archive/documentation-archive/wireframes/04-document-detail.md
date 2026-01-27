# Document Detail Wireframe

**Screen:** Document Detail View
**Route:** `/documents/:id`
**Status:** Core screen

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Documents                                            [Edit] [Share] [⋮]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📄 Security Policy                               ✅ Approved               │
│  ISO 27001:2022 • Updated 2 hours ago by Jane Smith                         │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  [📝 Content] [📊 Analysis] [📜 Version History] [💬 Comments] [⚙️ Settings] │
│                                                                              │
│  ┌────────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │                                        │  │  Document Info           │  │
│  │  Document Content Preview              │  │  ───────────────────────  │  │
│  │                                        │  │                          │  │
│  │  1. Introduction                       │  │  Framework: ISO 27001    │  │
│  │     This security policy...            │  │  Status: ✅ Approved      │  │
│  │                                        │  │  Version: 3.2            │  │
│  │  2. Scope                              │  │  Author: Jane Smith      │  │
│  │     This policy applies to...          │  │  Approver: John Doe      │  │
│  │                                        │  │  Created: Jan 15, 2025   │  │
│  │  3. Information Security Principles    │  │  Modified: 2h ago        │  │
│  │     - Confidentiality                  │  │                          │  │
│  │     - Integrity                        │  │  🏷️ Tags                 │  │
│  │     - Availability                     │  │  #security #policy       │  │
│  │                                        │  │  #iso27001               │  │
│  │  4. Roles and Responsibilities         │  │                          │  │
│  │     ...                                │  │  [🔗 Share Link]         │  │
│  │                                        │  │  [⬇️ Download PDF]        │  │
│  │                                        │  └──────────────────────────┘  │
│  │                                        │                                │
│  │                                        │  ┌──────────────────────────┐  │
│  │  [Scroll for more content...]         │  │  AI Quality Score        │  │
│  │                                        │  │  ───────────────────────  │  │
│  └────────────────────────────────────────┘  │  [████████░░] 85%        │  │
│                                               │  🟢 Good                  │  │
│                                               │                          │  │
│                                               │  Completeness: 90%       │  │
│                                               │  Clarity: 82%            │  │
│                                               │  Compliance: 83%         │  │
│                                               │                          │  │
│                                               │  💡 Suggestions:         │  │
│                                               │  • Add incident examples │  │
│                                               │  • Update references     │  │
│                                               └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Document Header
- Back navigation to documents list
- Document title (editable)
- Status badge
- Quick actions: Edit, Share, More options

### Tab Navigation
1. **Content:** Document viewer/editor
2. **Analysis:** AI-powered quality analysis
3. **Version History:** All versions with diff view
4. **Comments:** Collaborative comments
5. **Settings:** Metadata and permissions

### Content Panel (70% width)
- Rich text viewer
- Markdown or WYSIWYG content
- Table of contents (auto-generated)
- Scrollable content area

### Sidebar (30% width)
**Document Info Card:**
- Framework association
- Current status
- Version number
- Author and approver
- Timestamps
- Tags
- Quick actions (share, download)

**AI Quality Score Card:**
- Overall score with progress bar
- Status indicator (Good/Needs Work/Excellent)
- Breakdown scores
- AI-generated suggestions
- Link to full analysis

---

**Status:** Complete - Core wireframe for document detail
