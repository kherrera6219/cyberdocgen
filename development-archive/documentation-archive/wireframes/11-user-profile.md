# User Profile Wireframe

**Screen:** User Profile / Account Settings
**Status:** Complete
**Priority:** Medium (User Management)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                           [User Menu v] │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   SIDEBAR (240px)      │              USER PROFILE                          │
│   ─────────────────    │              ────────────                          │
│                        │                                                    │
│   > Dashboard          │   ┌────────────────────────────────────────────┐   │
│     Documents          │   │                                            │   │
│     Gap Analysis       │   │   ┌────────┐                               │   │
│     Audit Trail        │   │   │        │   John Smith                  │   │
│     Reports            │   │   │ [AVATAR]│   jsmith@company.com          │   │
│     ─────────────      │   │   │        │   Compliance Manager           │   │
│     Cloud Storage      │   │   └────────┘   Member since: Jan 2024       │   │
│   * Settings           │   │                                            │   │
│     > Profile          │   │   [Change Photo]                           │   │
│       Security         │   │                                            │   │
│       Notifications    │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   PROFILE INFORMATION                              │
│                        │   ───────────────────                              │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   Full Name                                │   │
│                        │   │   ┌───────────────────────────────────┐    │   │
│                        │   │   │ John Smith                        │    │   │
│                        │   │   └───────────────────────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   Email Address                            │   │
│                        │   │   ┌───────────────────────────────────┐    │   │
│                        │   │   │ jsmith@company.com             [!]│    │   │
│                        │   │   └───────────────────────────────────┘    │   │
│                        │   │   Verified                                 │   │
│                        │   │                                            │   │
│                        │   │   Job Title                                │   │
│                        │   │   ┌───────────────────────────────────┐    │   │
│                        │   │   │ Compliance Manager                │    │   │
│                        │   │   └───────────────────────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   Department                               │   │
│                        │   │   ┌───────────────────────────────────┐    │   │
│                        │   │   │ Information Security              │    │   │
│                        │   │   └───────────────────────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   Phone Number                             │   │
│                        │   │   ┌───────────────────────────────────┐    │   │
│                        │   │   │ +1 (555) 123-4567                 │    │   │
│                        │   │   └───────────────────────────────────┘    │   │
│                        │   │                                            │   │
│                        │   │   [========== Save Changes ===========]    │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ORGANIZATION                                     │
│                        │   ────────────                                     │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   Organization: TechCorp Industries        │   │
│                        │   │   Role: Admin                              │   │
│                        │   │   Joined: January 15, 2024                 │   │
│                        │   │                                            │   │
│                        │   │   [View Organization Settings]             │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ACCOUNT ACTIONS                                  │
│                        │   ───────────────                                  │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   [Download My Data]                       │   │
│                        │   │   Export all your personal data            │   │
│                        │   │                                            │   │
│                        │   │   [Delete Account]                         │   │
│                        │   │   Permanently delete your account          │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Security Settings Tab

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   SECURITY SETTINGS                                                        │
│   ─────────────────                                                        │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   PASSWORD                                                         │   │
│   │   ────────                                                         │   │
│   │                                                                    │   │
│   │   Last changed: 45 days ago                                        │   │
│   │                                                                    │   │
│   │   [Change Password]                                                │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   TWO-FACTOR AUTHENTICATION                                        │   │
│   │   ─────────────────────────                                        │   │
│   │                                                                    │   │
│   │   Status: Enabled (Authenticator App)                              │   │
│   │   Backup codes: 3 remaining                                        │   │
│   │                                                                    │   │
│   │   [Manage MFA] [Generate New Backup Codes]                         │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   ACTIVE SESSIONS                                                  │   │
│   │   ───────────────                                                  │   │
│   │                                                                    │   │
│   │   ┌────────────────────────────────────────────────────────────┐   │   │
│   │   │ Chrome on Windows          Current Session                 │   │   │
│   │   │ San Francisco, CA          Started: Today, 10:30 AM       │   │   │
│   │   └────────────────────────────────────────────────────────────┘   │   │
│   │                                                                    │   │
│   │   ┌────────────────────────────────────────────────────────────┐   │   │
│   │   │ Safari on macOS                              [Revoke]      │   │   │
│   │   │ New York, NY               Started: Yesterday, 2:15 PM    │   │   │
│   │   └────────────────────────────────────────────────────────────┘   │   │
│   │                                                                    │   │
│   │   [Revoke All Other Sessions]                                      │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   LOGIN HISTORY                                                    │   │
│   │   ─────────────                                                    │   │
│   │                                                                    │   │
│   │   Dec 9, 10:30 AM   Chrome/Windows   San Francisco, CA            │   │
│   │   Dec 8, 9:15 AM    Safari/macOS     New York, NY                 │   │
│   │   Dec 7, 11:00 AM   Chrome/Windows   San Francisco, CA            │   │
│   │                                                                    │   │
│   │   [View Full History]                                              │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Notification Settings Tab

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   NOTIFICATION PREFERENCES                                                 │
│   ────────────────────────                                                 │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   EMAIL NOTIFICATIONS                                              │   │
│   │   ───────────────────                                              │   │
│   │                                                                    │   │
│   │   [x] Document updates                                             │   │
│   │       Get notified when documents are created or modified         │   │
│   │                                                                    │   │
│   │   [x] Gap analysis results                                         │   │
│   │       Receive analysis reports when they complete                 │   │
│   │                                                                    │   │
│   │   [x] Security alerts                                              │   │
│   │       Important security notifications (cannot be disabled)        │   │
│   │                                                                    │   │
│   │   [ ] Weekly summary                                               │   │
│   │       Get a weekly overview of compliance activity                │   │
│   │                                                                    │   │
│   │   [ ] Marketing updates                                            │   │
│   │       Product news and feature announcements                      │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                    │   │
│   │   IN-APP NOTIFICATIONS                                             │   │
│   │   ────────────────────                                             │   │
│   │                                                                    │   │
│   │   [x] Real-time updates                                            │   │
│   │       Show notifications as they happen                           │   │
│   │                                                                    │   │
│   │   [x] Sound alerts                                                 │   │
│   │       Play sound for new notifications                            │   │
│   │                                                                    │   │
│   │   [ ] Desktop notifications                                        │   │
│   │       Show browser notifications                                  │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│   [============ Save Preferences ============]                             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [=] [Logo] CyberDocGen                        [User Menu v] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              USER PROFILE                                    │
│              ────────────                                    │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   ┌────────┐   John Smith                            │   │
│   │   │        │   jsmith@company.com                    │   │
│   │   │[AVATAR]│   Compliance Manager                    │   │
│   │   │        │   Member since: Jan 2024                │   │
│   │   └────────┘   [Change Photo]                        │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   [Profile] [Security] [Notifications]                       │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   PROFILE INFORMATION                                │   │
│   │   ───────────────────                                │   │
│   │                                                      │   │
│   │   Full Name                    Job Title             │   │
│   │   ┌──────────────────────┐     ┌────────────────────┐│   │
│   │   │ John Smith           │     │ Compliance Manager ││   │
│   │   └──────────────────────┘     └────────────────────┘│   │
│   │                                                      │   │
│   │   Email Address                Department            │   │
│   │   ┌──────────────────────┐     ┌────────────────────┐│   │
│   │   │ jsmith@company.com   │     │ Information Sec.   ││   │
│   │   └──────────────────────┘     └────────────────────┘│   │
│   │                                                      │   │
│   │   Phone Number                                       │   │
│   │   ┌────────────────────────────────────────────────┐ │   │
│   │   │ +1 (555) 123-4567                              │ │   │
│   │   └────────────────────────────────────────────────┘ │   │
│   │                                                      │   │
│   │   [============== Save Changes ==============]       │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   ORGANIZATION: TechCorp Industries                  │   │
│   │   Role: Admin  |  Joined: January 15, 2024           │   │
│   │   [View Organization Settings]                       │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component States

### Profile Form Fields
- **Default:** Current values displayed
- **Focus:** Border highlighted
- **Modified:** Unsaved indicator
- **Error:** Red border with message
- **Disabled:** During save operation

### Avatar Upload
- **Default:** Current avatar shown
- **Hover:** Upload overlay visible
- **Uploading:** Progress indicator
- **Error:** Upload failed message
- **Success:** New avatar displayed

### Save Button
- **Default:** Active, primary color
- **Hover:** Slightly elevated
- **Loading:** Spinner, disabled
- **Disabled:** No changes to save
- **Success:** "Saved!" feedback

### Tab Navigation
- **Default:** All tabs visible
- **Active:** Selected tab highlighted
- **Loading:** Content skeleton in tab

### Page States
- **Loading:** Skeleton profile
- **Empty:** N/A (always has data)
- **Error:** Error banner with retry
- **Success:** Changes saved toast

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│  [<] USER PROFILE        [...]  │
├─────────────────────────────────┤
│                                 │
│        ┌──────────┐             │
│        │          │             │
│        │ [AVATAR] │             │
│        │          │             │
│        └──────────┘             │
│                                 │
│       John Smith                │
│    jsmith@company.com           │
│    Compliance Manager           │
│                                 │
│    [Change Photo]               │
│                                 │
├─────────────────────────────────┤
│                                 │
│  [Profile] [Security] [Notif.]  │
│                                 │
├─────────────────────────────────┤
│                                 │
│  Full Name                      │
│  ┌─────────────────────────┐    │
│  │ John Smith              │    │
│  └─────────────────────────┘    │
│                                 │
│  Email Address                  │
│  ┌─────────────────────────┐    │
│  │ jsmith@company.com      │    │
│  └─────────────────────────┘    │
│                                 │
│  Job Title                      │
│  ┌─────────────────────────┐    │
│  │ Compliance Manager      │    │
│  └─────────────────────────┘    │
│                                 │
│  Department                     │
│  ┌─────────────────────────┐    │
│  │ Information Security    │    │
│  └─────────────────────────┘    │
│                                 │
│  Phone Number                   │
│  ┌─────────────────────────┐    │
│  │ +1 (555) 123-4567       │    │
│  └─────────────────────────┘    │
│                                 │
│  [======= Save Changes =======] │
│                                 │
└─────────────────────────────────┘
```

---

## Change Password Modal

```
┌────────────────────────────────────────┐
│                                        │
│   Change Password                      │
│   ───────────────                      │
│                                        │
│   Current Password                     │
│   ┌───────────────────────────────┐    │
│   │ ●●●●●●●●                   [O]│    │
│   └───────────────────────────────┘    │
│                                        │
│   New Password                         │
│   ┌───────────────────────────────┐    │
│   │ ●●●●●●●●●●●●               [O]│    │
│   └───────────────────────────────┘    │
│   [================] Strong            │
│                                        │
│   Confirm New Password                 │
│   ┌───────────────────────────────┐    │
│   │ ●●●●●●●●●●●●               [O]│    │
│   └───────────────────────────────┘    │
│                                        │
│   [Cancel] [===== Save Password =====] │
│                                        │
└────────────────────────────────────────┘
```

---

## Delete Account Confirmation

```
┌────────────────────────────────────────┐
│                                        │
│   Delete Account                       │
│   ──────────────                       │
│                                        │
│   [!] This action cannot be undone.    │
│                                        │
│   Deleting your account will:          │
│   - Remove all your personal data      │
│   - Remove you from your organization  │
│   - Delete your activity history       │
│                                        │
│   Type "DELETE" to confirm:            │
│   ┌───────────────────────────────┐    │
│   │                               │    │
│   └───────────────────────────────┘    │
│                                        │
│   [Cancel] [===== Delete Account =====]│
│                                        │
└────────────────────────────────────────┘
```

---

## Accessibility Notes

- Profile photo has alt text
- Form fields have visible labels
- Password visibility toggle is keyboard accessible
- Session list is navigable via keyboard
- Delete confirmation requires explicit text input
- Notification toggles have descriptive labels

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
