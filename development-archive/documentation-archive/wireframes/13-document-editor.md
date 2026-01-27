# Document Editor Wireframe

**Screen:** Document Editor / Workspace
**Page:** `/document-workspace`
**Complexity:** High
**User Type:** Authenticated (Editor, Admin)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] CyberDocGen        Documents > Compliance Policies > Data Classification Policy        │
│                                                                          [🔔] [👤] john.doe  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Data Classification Policy - Draft                              [Save] [Preview]   │  │
│  │                                                                                      │  │
│  │  [B] [I] [U] | [≡ H1 v] | [•••] [123] | [🔗] [📎] [📊] | [<-] [->] | [AI Assist]   │  │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                      │  │
│  │  # Data Classification Policy                                                       │  │
│  │                                                                                      │  │
│  │  **Version:** 2.1                                                                   │  │
│  │  **Effective Date:** January 15, 2026                                               │  │
│  │  **Classification:** Internal Use                                                   │  │
│  │                                                                                      │  │
│  │  ## 1. Purpose                                                                      │  │
│  │                                                                                      │  │
│  │  This policy establishes a framework for classifying and protecting organizational  │  │
│  │  data based on its sensitivity, criticality, and regulatory requirements. ⎹         │  │
│  │                                                                                      │  │
│  │  ## 2. Scope                                                                        │  │
│  │                                                                                      │  │
│  │  This policy applies to all employees, contractors, and third-party vendors who     │  │
│  │  access, process, or store organizational data.                                     │  │
│  │                                                                                      │  │
│  │  ## 3. Data Classification Levels                                                   │  │
│  │                                                                                      │  │
│  │  ### 3.1 Public                                                                     │  │
│  │  - Marketing materials                                                              │  │
│  │  - Press releases                                                                   │  │
│  │  - Public website content                                                           │  │
│  │                                                                                      │  │
│  │                                                                                      │  │
│  │                                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌────────────────────────────────────────────┐ ┌──────────────────────────────────────┐  │
│  │  PROPERTIES                                │ │  ACTIVITY                            │  │
│  ├────────────────────────────────────────────┤ ├──────────────────────────────────────┤  │
│  │                                            │ │                                      │  │
│  │  Status:        ● Draft                    │ │  💬 John Doe                         │  │
│  │  Owner:         John Doe                   │ │     Updated section 3.1              │  │
│  │  Framework:     ISO 27001                  │ │     2 minutes ago                    │  │
│  │  Version:       2.1                        │ │                                      │  │
│  │  Modified:      2 minutes ago              │ │  💬 Sarah Chen                       │  │
│  │  Word Count:    1,247                      │ │     Added comment on line 45         │  │
│  │                                            │ │     15 minutes ago                   │  │
│  │  ┌──────────────────────────────────────┐ │ │                                      │  │
│  │  │ AI Quality Score                     │ │ │  💬 Mike Johnson                     │  │
│  │  │                                      │ │ │     Approved section 2               │  │
│  │  │  Completeness    [████████░░] 82%    │ │ │     1 hour ago                       │  │
│  │  │  Compliance      [█████████░] 90%    │ │ │                                      │  │
│  │  │  Clarity         [███████░░░] 75%    │ │ │  View All Activity >                 │  │
│  │  │  Security        [████████░░] 85%    │ │ │                                      │  │
│  │  │                                      │ │ └──────────────────────────────────────┘  │
│  │  │  Overall: Good (83%)                 │ │                                           │
│  │  │                                      │ │ ┌──────────────────────────────────────┐  │
│  │  │  [View Recommendations]              │ │ │  VERSIONS                            │  │
│  │  └──────────────────────────────────────┘ │ ├──────────────────────────────────────┤  │
│  │                                            │ │                                      │  │
│  │  ┌──────────────────────────────────────┐ │ │  ● v2.1 - Draft (Current)            │  │
│  │  │ Attachments (3)                      │ │ │    2 minutes ago                     │  │
│  │  │                                      │ │ │                                      │  │
│  │  │  📄 data-flow-diagram.pdf            │ │ │  • v2.0 - Published                  │  │
│  │  │  📊 classification-matrix.xlsx       │ │ │    Dec 1, 2025                       │  │
│  │  │  🖼️ data-lifecycle.png                │ │ │                                      │  │
│  │  │                                      │ │ │  • v1.5 - Published                  │  │
│  │  │  [+ Add Attachment]                  │ │ │    Nov 15, 2025                      │  │
│  │  └──────────────────────────────────────┘ │ │                                      │  │
│  │                                            │ │  View All Versions >                 │  │
│  │  Tags: #ISO27001 #DataProtection         │ │                                      │  │
│  │        #GDPR #Classification              │ │ └──────────────────────────────────────┘  │
│  │                                            │                                           │
│  └────────────────────────────────────────────┘                                           │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌───────────────────────────────────────────────────────────┐
│  [☰]  Data Classification Policy               [Save]     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  [Tabs: Edit | Properties | Activity | Versions]         │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [B] [I] [U] | [H1 v] | [•] | [🔗] | [AI]         │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  # Data Classification Policy                      │ │
│  │                                                     │ │
│  │  **Version:** 2.1                                  │ │
│  │  **Effective:** Jan 15, 2026                       │ │
│  │                                                     │ │
│  │  ## 1. Purpose                                     │ │
│  │                                                     │ │
│  │  This policy establishes a framework for           │ │
│  │  classifying and protecting organizational data... │ │
│  │                                                     │ │
│  │  ## 2. Scope                                       │ │
│  │                                                     │ │
│  │  This policy applies to all employees...           │ │
│  │                                                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────┐
│  [<]  Document Editor   │
├─────────────────────────┤
│                         │
│  Data Classification    │
│  Policy (Draft)         │
│                         │
│  [Edit] [View]          │
│                         │
│  ┌───────────────────┐ │
│  │                   │ │
│  │  # Data Class...  │ │
│  │                   │ │
│  │  **Version:** 2.1 │ │
│  │                   │ │
│  │  ## 1. Purpose    │ │
│  │                   │ │
│  │  This policy...   │ │
│  │                   │ │
│  │                   │ │
│  │                   │ │
│  │                   │ │
│  └───────────────────┘ │
│                         │
│  [≡] [💬] [📎] [⋮]     │
└─────────────────────────┘
```

---

## Component States

### Normal Editing State
```
┌──────────────────────────────────────────┐
│  [B] [I] [U] | [H1 v] | [AI Assist]     │
├──────────────────────────────────────────┤
│  # Data Classification Policy            │
│  This policy establishes...⎹             │
└──────────────────────────────────────────┘
```

### Saving State
```
┌──────────────────────────────────────────┐
│  ⏳ Saving...                   [Saved ✓]│
├──────────────────────────────────────────┤
│  # Data Classification Policy            │
└──────────────────────────────────────────┘
```

### Auto-Save Indicator
```
┌──────────────────────────────────────────┐
│  Auto-saved at 10:45 AM           [Save] │
├──────────────────────────────────────────┤
│  # Data Classification Policy            │
└──────────────────────────────────────────┘
```

### Conflict Warning
```
┌──────────────────────────────────────────┐
│  ⚠️  Another user made changes            │
│  [View Changes] [Reload] [Keep Mine]     │
├──────────────────────────────────────────┤
│  # Data Classification Policy            │
└──────────────────────────────────────────┘
```

### AI Assist Panel
```
┌──────────────────────────────────────────┐
│  🤖 AI Writing Assistant                 │
├──────────────────────────────────────────┤
│  Selected text:                          │
│  "This policy establishes..."            │
│                                          │
│  Suggestions:                            │
│  • Improve clarity                       │
│  • Add compliance reference              │
│  • Suggest related controls              │
│  • Check for gaps                        │
│                                          │
│  [Apply] [Dismiss]                       │
└──────────────────────────────────────────┘
```

### Comment Thread
```
┌──────────────────────────────────────────┐
│  💬 2 comments on this line              │
├──────────────────────────────────────────┤
│  Sarah Chen - 15 min ago                 │
│  "Should we add GDPR reference here?"    │
│                                          │
│  John Doe - 10 min ago                   │
│  "Good point, I'll add it in v2.2"       │
│                                          │
│  [Reply] [Resolve]                       │
└──────────────────────────────────────────┘
```

---

## Toolbar Features

### Formatting Toolbar
```
[B] [I] [U] [S] | [H1 v] [H2] [H3] | [•••] [123] | [←] [→] [↔] | [🔗] [📎] [📊] [📷]
 Bold Italic Under Strike  Headers        Lists    Align  Link Attach Table Image
```

### Advanced Features
```
[AI Assist] - AI writing suggestions
[💬 Comments] - Add inline comments
[📋 Template] - Insert template sections
[🔍 Search] - Find and replace
[📖 Spell Check] - Grammar and spelling
[📊 Metrics] - Document quality metrics
```

---

## Interactions

### 1. Editing Flow
1. User opens document
2. Document loads with cursor at last position
3. User types/edits content
4. Auto-save every 30 seconds
5. Real-time collaboration (see other cursors)

### 2. AI Assistance
1. User selects text or places cursor
2. Clicks "AI Assist"
3. AI analyzes context
4. Provides suggestions (improve, expand, check compliance)
5. User applies or dismisses suggestions

### 3. Commenting
1. User selects text
2. Clicks comment icon
3. Enters comment
4. Comment saved and visible to collaborators
5. Others can reply or resolve

### 4. Version Control
1. System auto-creates versions on publish
2. User can manually create checkpoint
3. View version history in sidebar
4. Compare versions side-by-side
5. Restore previous version if needed

### 5. Collaboration
1. Multiple users can edit simultaneously
2. See live cursors with user names
3. Changes sync in real-time
4. Conflict resolution when needed
5. Activity feed shows all changes

---

## Keyboard Shortcuts

### Formatting
- `Ctrl + B` - Bold
- `Ctrl + I` - Italic
- `Ctrl + U` - Underline
- `Ctrl + K` - Insert link
- `Ctrl + Shift + 1-6` - Headings 1-6

### Editing
- `Ctrl + S` - Save
- `Ctrl + Z` - Undo
- `Ctrl + Y` - Redo
- `Ctrl + F` - Find
- `Ctrl + H` - Replace
- `Ctrl + /` - Toggle comment

### Navigation
- `Ctrl + Home` - Go to start
- `Ctrl + End` - Go to end
- `Ctrl + G` - Go to line

### AI Features
- `Ctrl + Space` - AI suggestions
- `Ctrl + Shift + A` - AI assist panel

---

## AI Features

### Writing Assistance
- Grammar and spell checking
- Style improvements
- Clarity enhancements
- Compliance language suggestions

### Compliance Checking
- Framework requirement mapping
- Missing control identification
- Reference suggestions
- Gap detection

### Auto-Completion
- Policy templates
- Standard clauses
- Regulatory references
- Common definitions

### Quality Scoring
- Completeness (0-100%)
- Compliance alignment (0-100%)
- Clarity score (0-100%)
- Security coverage (0-100%)

---

## Accessibility

### WCAG 2.2 AA Compliance
- ✅ Full keyboard navigation
- ✅ Screen reader support (ARIA labels)
- ✅ High contrast mode
- ✅ Focus indicators
- ✅ Keyboard shortcuts announced
- ✅ Alt text for all icons
- ✅ Status announcements

### Keyboard Navigation
- `Tab` - Navigate toolbar and panels
- `F6` - Cycle between editor areas
- `Alt + 1-9` - Quick access to panels
- `Escape` - Close modals/panels

---

## Technical Notes

### Auto-Save
```typescript
// Auto-save every 30 seconds
const AUTO_SAVE_INTERVAL = 30000;

// Debounce user input to avoid excessive saves
const SAVE_DEBOUNCE = 1000;

// Conflict detection
if (serverVersion > localVersion) {
  showConflictWarning();
}
```

### Real-Time Collaboration
```typescript
// WebSocket for live updates
const ws = new WebSocket('/api/documents/:id/collaborate');

// Operational Transform for conflict resolution
applyOT(localChanges, remoteChanges);

// Show collaborator cursors
showCursor(userId, position, color);
```

### API Endpoints
```
GET    /api/documents/:id          - Load document
PUT    /api/documents/:id          - Save document
POST   /api/documents/:id/versions - Create version
GET    /api/documents/:id/versions - List versions
POST   /api/documents/:id/comments - Add comment
GET    /api/documents/:id/activity - Get activity feed
POST   /api/documents/:id/ai       - AI assistance
```

### Document Format
```typescript
interface Document {
  id: string;
  title: string;
  content: string; // Markdown
  status: 'draft' | 'review' | 'published';
  version: string;
  owner: User;
  framework: string[];
  tags: string[];
  attachments: Attachment[];
  quality: QualityScore;
  collaborators: User[];
  modifiedAt: Date;
}
```

---

## Related Wireframes
- [03-documents-list.md](./03-documents-list.md) - Documents list
- [04-document-detail.md](./04-document-detail.md) - Document detail view
- [10-ai-assistant.md](./10-ai-assistant.md) - AI assistant
- [15-document-generation.md](./15-document-generation.md) - AI document generation

---

**Created:** December 12, 2025
**Status:** Complete
**Version:** 1.0
