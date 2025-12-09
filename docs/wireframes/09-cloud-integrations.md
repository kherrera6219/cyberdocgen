# Cloud Integrations Wireframe

**Screen:** Cloud Integrations
**Status:** Complete
**Priority:** Medium (Productivity Feature)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                           [User Menu v] │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   SIDEBAR (240px)      │              CLOUD INTEGRATIONS                    │
│   ─────────────────    │              ──────────────────                    │
│                        │                                                    │
│   > Dashboard          │   ┌────────────────────────────────────────────┐   │
│     Documents          │   │                                            │   │
│     Gap Analysis       │   │   Connect your cloud storage providers     │   │
│     Audit Trail        │   │   to sync documents and collaborate        │   │
│     Reports            │   │   with your team.                          │   │
│     ─────────────      │   │                                            │   │
│   * Cloud Storage      │   └────────────────────────────────────────────┘   │
│     Settings           │                                                    │
│                        │   CONNECTED SERVICES                               │
│                        │   ──────────────────                               │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   [DRIVE ICON]                             │   │
│                        │   │   Google Drive                             │   │
│                        │   │   ────────────                             │   │
│                        │   │                                            │   │
│                        │   │   Status: Connected                        │   │
│                        │   │   Account: user@company.com                │   │
│                        │   │   Last Sync: 5 minutes ago                 │   │
│                        │   │   Files Synced: 45                         │   │
│                        │   │                                            │   │
│                        │   │   ┌─────────────────────────────────────┐  │   │
│                        │   │   │ Sync Folder: /CyberDocGen/Documents│  │   │
│                        │   │   │ [Change Folder]                     │  │   │
│                        │   │   └─────────────────────────────────────┘  │   │
│                        │   │                                            │   │
│                        │   │   [x] Auto-sync new documents              │   │
│                        │   │   [x] Sync document updates                │   │
│                        │   │   [ ] Two-way sync                         │   │
│                        │   │                                            │   │
│                        │   │   (---- Sync Now ----) [Disconnect]        │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   AVAILABLE SERVICES                               │
│                        │   ──────────────────                               │
│                        │                                                    │
│                        │   ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│                        │   │              │ │              │ │            │ │
│                        │   │ [ONEDRIVE]   │ │ [DROPBOX]    │ │ [AWS S3]   │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ OneDrive     │ │ Dropbox      │ │ Amazon S3  │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ Not          │ │ Not          │ │ Not        │ │
│                        │   │ Connected    │ │ Connected    │ │ Connected  │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ [Connect]    │ │ [Connect]    │ │ [Connect]  │ │
│                        │   │              │ │              │ │            │ │
│                        │   └──────────────┘ └──────────────┘ └────────────┘ │
│                        │                                                    │
│                        │   ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│                        │   │              │ │              │ │            │ │
│                        │   │ [SHAREPOINT] │ │ [BOX]        │ │ [AZURE]    │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ SharePoint   │ │ Box          │ │ Azure Blob │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ Not          │ │ Not          │ │ Not        │ │
│                        │   │ Connected    │ │ Connected    │ │ Connected  │ │
│                        │   │              │ │              │ │            │ │
│                        │   │ [Connect]    │ │ [Connect]    │ │ [Connect]  │ │
│                        │   │              │ │              │ │            │ │
│                        │   └──────────────┘ └──────────────┘ └────────────┘ │
│                        │                                                    │
│                        │   SYNC HISTORY                                     │
│                        │   ────────────                                     │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │ Dec 9, 10:30   Google Drive   45 files    │   │
│                        │   │ Dec 9, 09:00   Google Drive   42 files    │   │
│                        │   │ Dec 8, 18:00   Google Drive   40 files    │   │
│                        │   │ [View Full History]                        │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Connection Flow

### Step 1: Select Provider
```
┌────────────────────────────────────────┐
│                                        │
│   Connect to Google Drive              │
│   ───────────────────────              │
│                                        │
│   You'll be redirected to Google       │
│   to authorize CyberDocGen.            │
│                                        │
│   Permissions requested:               │
│   - View and manage files              │
│   - View file metadata                 │
│                                        │
│   [Cancel] [====== Continue ======]    │
│                                        │
└────────────────────────────────────────┘
```

### Step 2: OAuth Authorization
(External Google/Microsoft/etc. login page)

### Step 3: Select Folder
```
┌────────────────────────────────────────┐
│                                        │
│   Select Sync Folder                   │
│   ─────────────────                    │
│                                        │
│   Choose a folder to sync documents:   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │ > My Drive                     │   │
│   │   > Documents                  │   │
│   │     > CyberDocGen         [*]  │   │
│   │     > Personal                 │   │
│   │   > Shared with me             │   │
│   │   > Starred                    │   │
│   └────────────────────────────────┘   │
│                                        │
│   [+ Create New Folder]                │
│                                        │
│   [Cancel] [===== Select Folder =====] │
│                                        │
└────────────────────────────────────────┘
```

### Step 4: Configure Sync
```
┌────────────────────────────────────────┐
│                                        │
│   Sync Settings                        │
│   ─────────────                        │
│                                        │
│   [x] Auto-sync new documents          │
│       Automatically upload new docs    │
│                                        │
│   [x] Sync document updates            │
│       Keep changes in sync             │
│                                        │
│   [ ] Two-way sync                     │
│       Import changes from cloud        │
│                                        │
│   Sync frequency:                      │
│   ┌─────────────────────────────[v]┐   │
│   │ Every 30 minutes               │   │
│   └────────────────────────────────┘   │
│                                        │
│   [Cancel] [======= Save ========]     │
│                                        │
└────────────────────────────────────────┘
```

---

## Connected Service Card States

### Connected
- Green status indicator
- Account info displayed
- Sync options visible
- Disconnect option available

### Disconnected
- Gray status
- Connect button visible
- No options shown

### Syncing
- Animated sync icon
- Progress indicator
- "Syncing..." status

### Error
- Red status indicator
- Error message
- Retry button

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [=] [Logo] CyberDocGen                        [User Menu v] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              CLOUD INTEGRATIONS                              │
│              ──────────────────                              │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Connect your cloud storage to sync documents         │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   CONNECTED SERVICES                                         │
│   ──────────────────                                         │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ [DRIVE] Google Drive                                 │   │
│   │ ────────────                                         │   │
│   │                                                      │   │
│   │ Status: Connected       Account: user@company.com    │   │
│   │ Last Sync: 5 min ago    Files: 45                    │   │
│   │                                                      │   │
│   │ Sync Folder: /CyberDocGen/Documents  [Change]        │   │
│   │                                                      │   │
│   │ [x] Auto-sync  [x] Sync updates  [ ] Two-way         │   │
│   │                                                      │   │
│   │ (---- Sync Now ----) [Disconnect]                    │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   AVAILABLE SERVICES                                         │
│   ──────────────────                                         │
│                                                              │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│   │ [ONEDRIVE]  │ │ [DROPBOX]   │ │ [AWS S3]    │            │
│   │ OneDrive    │ │ Dropbox     │ │ Amazon S3   │            │
│   │ [Connect]   │ │ [Connect]   │ │ [Connect]   │            │
│   └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│   │ [SHAREPOINT]│ │ [BOX]       │ │ [AZURE]     │            │
│   │ SharePoint  │ │ Box         │ │ Azure Blob  │            │
│   │ [Connect]   │ │ [Connect]   │ │ [Connect]   │            │
│   └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component States

### Service Card (Connected)
- **Default:** Green status, sync options visible
- **Hover:** Card slightly elevated
- **Syncing:** Animated sync icon, progress bar
- **Error:** Red status, error message, retry button
- **Disabled:** Greyed out during disconnect

### Service Card (Available)
- **Default:** Connect button visible
- **Hover:** Card slightly elevated
- **Loading:** Spinner on connect button
- **Connecting:** Redirect to OAuth flow

### Sync Button
- **Default:** Active, secondary style
- **Hover:** Slightly elevated
- **Loading:** Spinner, "Syncing..." text
- **Disabled:** During active sync
- **Success:** "Synced!" feedback

### Page States
- **Loading:** Skeleton cards
- **Empty:** "No services connected" with CTA
- **Error:** Error banner with troubleshooting
- **Partial:** Mix of connected and available

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│  [=] CLOUD INTEGRATIONS         │
├─────────────────────────────────┤
│                                 │
│  CONNECTED                      │
│  ─────────                      │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [DRIVE] Google Drive    │    │
│  │                         │    │
│  │ Status: Connected       │    │
│  │ Last Sync: 5 min ago    │    │
│  │ Files: 45               │    │
│  │                         │    │
│  │ [Sync Now] [Settings]   │    │
│  └─────────────────────────┘    │
│                                 │
│  AVAILABLE                      │
│  ─────────                      │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [ONEDRIVE] OneDrive     │    │
│  │ Not Connected           │    │
│  │ [Connect]               │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [DROPBOX] Dropbox       │    │
│  │ Not Connected           │    │
│  │ [Connect]               │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [S3] Amazon S3          │    │
│  │ Not Connected           │    │
│  │ [Connect]               │    │
│  └─────────────────────────┘    │
│                                 │
│  SYNC HISTORY                   │
│  ─────────────                  │
│                                 │
│  Dec 9, 10:30 - 45 files        │
│  Dec 9, 09:00 - 42 files        │
│  [View All]                     │
│                                 │
└─────────────────────────────────┘
```

---

## Sync Conflict Resolution

```
┌────────────────────────────────────────┐
│                                        │
│   Sync Conflict                        │
│   ─────────────                        │
│                                        │
│   The following file has been          │
│   modified in both locations:          │
│                                        │
│   "ISO-27001-Policy.docx"              │
│                                        │
│   Local Version:                       │
│   Modified: Dec 9, 10:30 AM            │
│   Size: 245 KB                         │
│                                        │
│   Cloud Version:                       │
│   Modified: Dec 9, 10:25 AM            │
│   Size: 242 KB                         │
│                                        │
│   How would you like to resolve?       │
│                                        │
│   ( ) Keep local version               │
│   ( ) Keep cloud version               │
│   (*) Keep both (rename local)         │
│                                        │
│   [Cancel] [======= Apply =======]     │
│                                        │
└────────────────────────────────────────┘
```

---

## Accessibility Notes

- Service cards are keyboard accessible
- Status changes announced to screen readers
- Clear visual distinction between connected/disconnected
- Progress indicators have text alternatives
- OAuth flow opens in accessible manner

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
