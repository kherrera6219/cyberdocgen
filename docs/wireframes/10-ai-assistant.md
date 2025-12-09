# AI Assistant Wireframe

**Screen:** AI Compliance Assistant / Chatbot
**Status:** Complete
**Priority:** High (Core Feature)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                           [User Menu v] │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   SIDEBAR (240px)      │              AI ASSISTANT                          │
│   ─────────────────    │              ────────────                          │
│                        │                                                    │
│   > Dashboard          │   ┌──────────────────────────────────────────┐     │
│     Documents          │   │                                          │     │
│     Gap Analysis       │   │   CONVERSATION HISTORY                   │     │
│     Audit Trail        │   │   ────────────────────                   │     │
│     Reports            │   │                                          │     │
│     ─────────────      │   │   ┌──────────────────────────────────┐   │     │
│   * AI Assistant       │   │   │ [AI]                              │   │     │
│     Cloud Storage      │   │   │                                  │   │     │
│     Settings           │   │   │ Hello! I'm your compliance       │   │     │
│                        │   │   │ assistant. I can help you with:  │   │     │
│   ─────────────        │   │   │                                  │   │     │
│                        │   │   │ - Document generation            │   │     │
│   QUICK ACTIONS        │   │   │ - Compliance questions           │   │     │
│   ─────────────        │   │   │ - Gap analysis                   │   │     │
│                        │   │   │ - Risk assessment                │   │     │
│   [Generate Doc]       │   │   │                                  │   │     │
│   [Analyze Gap]        │   │   │ What would you like help with?   │   │     │
│   [Risk Assessment]    │   │   │                                  │   │     │
│                        │   │   └──────────────────────────────────┘   │     │
│   ─────────────        │   │                                          │     │
│                        │   │   ┌──────────────────────────────────┐   │     │
│   RECENT CHATS         │   │   │                           [USER] │   │     │
│   ─────────────        │   │   │                                  │   │     │
│                        │   │   │ I need to create an access       │   │     │
│   > ISO 27001 Q&A      │   │   │ control policy for ISO 27001.    │   │     │
│     SOC 2 Analysis     │   │   │ What should be included?         │   │     │
│     Risk Report        │   │   │                                  │   │     │
│     Policy Draft       │   │   └──────────────────────────────────┘   │     │
│                        │   │                                          │     │
│   [+ New Chat]         │   │   ┌──────────────────────────────────┐   │     │
│                        │   │   │ [AI]                              │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   │ Great question! An ISO 27001     │   │     │
│                        │   │   │ access control policy should     │   │     │
│                        │   │   │ include:                         │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   │ 1. Access Control Objectives     │   │     │
│                        │   │   │ 2. User Access Management        │   │     │
│                        │   │   │ 3. User Responsibilities         │   │     │
│                        │   │   │ 4. Network Access Control        │   │     │
│                        │   │   │ 5. Operating System Access       │   │     │
│                        │   │   │ 6. Application Access Control    │   │     │
│                        │   │   │ 7. Mobile & Remote Access        │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   │ Would you like me to generate    │   │     │
│                        │   │   │ a draft policy document?         │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   │ [Generate Policy] [More Details] │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   │ Sources: ISO 27001:2022 A.9     │   │     │
│                        │   │   └──────────────────────────────────┘   │     │
│                        │   │                                          │     │
│                        │   └──────────────────────────────────────────┘     │
│                        │                                                    │
│                        │   ┌──────────────────────────────────────────┐     │
│                        │   │                                          │     │
│                        │   │   ┌──────────────────────────────────┐   │     │
│                        │   │   │ Ask me anything about compliance │   │     │
│                        │   │   │                                  │   │     │
│                        │   │   └──────────────────────────────────┘   │     │
│                        │   │                                          │     │
│                        │   │   [Attach] [Framework v] [======= Send]  │     │
│                        │   │                                          │     │
│                        │   └──────────────────────────────────────────┘     │
│                        │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Message Types

### AI Response
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Avatar]                                                  │
│                                                              │
│ [Message content with markdown support]                      │
│                                                              │
│ - Bullet points                                              │
│ - **Bold text**                                              │
│ - `Code snippets`                                            │
│                                                              │
│ [Action Button 1] [Action Button 2]                          │
│                                                              │
│ Sources: [Link 1] [Link 2]                                   │
│                                                              │
│ [Copy] [Regenerate] [Rate: +/-]          10:32 AM           │
└──────────────────────────────────────────────────────────────┘
```

### User Message
```
┌──────────────────────────────────────────────────────────────┐
│                                              [User Avatar]   │
│                                                              │
│                              [Message content from user]     │
│                                                              │
│                                               10:31 AM       │
└──────────────────────────────────────────────────────────────┘
```

### Document Reference
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Avatar]                                                  │
│                                                              │
│ I found a relevant document in your library:                 │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [DOC ICON] ISO-27001-Access-Control-Policy.docx        │   │
│ │                                                        │   │
│ │ Last updated: Dec 5, 2025                              │   │
│ │ Framework: ISO 27001                                   │   │
│ │ Status: Approved                                       │   │
│ │                                                        │   │
│ │ [View Document] [Analyze] [Compare]                    │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Avatar]                                                  │
│                                                              │
│ [....] Thinking...                                           │
│                                                              │
│ Analyzing your request and compliance requirements           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Input Area Features

### Basic Input
```
┌────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Ask me anything about compliance...                        │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ [Attach File]  [Framework: ISO 27001 v]  [======= Send =====]  │
└────────────────────────────────────────────────────────────────┘
```

### With Attachment
```
┌────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [DOC] policy-draft.docx              [x Remove]            │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ Please review this policy against ISO 27001...             │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ [Attach File]  [Framework: ISO 27001 v]  [======= Send =====]  │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Actions Panel

### Generate Document
```
┌────────────────────────────────────────┐
│                                        │
│   Generate Document                    │
│   ─────────────────                    │
│                                        │
│   Document Type:                       │
│   ┌──────────────────────────────[v]┐  │
│   │ Access Control Policy           │  │
│   └─────────────────────────────────┘  │
│                                        │
│   Framework:                           │
│   ┌──────────────────────────────[v]┐  │
│   │ ISO 27001                       │  │
│   └─────────────────────────────────┘  │
│                                        │
│   Additional Context:                  │
│   ┌─────────────────────────────────┐  │
│   │                                 │  │
│   │                                 │  │
│   └─────────────────────────────────┘  │
│                                        │
│   [Cancel] [======= Generate ======]   │
│                                        │
└────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [=] [Logo] CyberDocGen                        [User Menu v] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              AI ASSISTANT                                    │
│              ────────────                                    │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   CONVERSATION                                       │   │
│   │   ────────────                                       │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐     │   │
│   │   │ [AI]                                       │     │   │
│   │   │                                            │     │   │
│   │   │ Hello! I'm your compliance assistant.      │     │   │
│   │   │ I can help with document generation,       │     │   │
│   │   │ compliance questions, and gap analysis.    │     │   │
│   │   │                                            │     │   │
│   │   │ What would you like help with?             │     │   │
│   │   │                                 10:30 AM   │     │   │
│   │   └────────────────────────────────────────────┘     │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐     │   │
│   │   │                                    [USER]  │     │   │
│   │   │                                            │     │   │
│   │   │ I need an access control policy for        │     │   │
│   │   │ ISO 27001. What should be included?        │     │   │
│   │   │                                 10:31 AM   │     │   │
│   │   └────────────────────────────────────────────┘     │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐     │   │
│   │   │ [AI]                                       │     │   │
│   │   │                                            │     │   │
│   │   │ An ISO 27001 access control policy         │     │   │
│   │   │ should include:                            │     │   │
│   │   │                                            │     │   │
│   │   │ 1. Access Control Objectives               │     │   │
│   │   │ 2. User Access Management                  │     │   │
│   │   │ 3. User Responsibilities                   │     │   │
│   │   │ ...                                        │     │   │
│   │   │                                            │     │   │
│   │   │ [Generate Policy] [More Details]           │     │   │
│   │   │                                 10:32 AM   │     │   │
│   │   └────────────────────────────────────────────┘     │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ ┌────────────────────────────────────────────────┐   │   │
│   │ │ Ask me anything about compliance...            │   │   │
│   │ └────────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │ [Attach] [Framework: ISO 27001 v] [====== Send ====] │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component States

### Chat Input
- **Default:** Placeholder text visible
- **Focus:** Border highlighted
- **Filled:** Text visible with send enabled
- **Disabled:** During message sending
- **With Attachment:** File preview shown

### Send Button
- **Default:** Active, primary color
- **Hover:** Slightly elevated
- **Loading:** Spinner (sending)
- **Disabled:** When input empty

### AI Message
- **Loading:** Animated typing indicator
- **Default:** Message with actions
- **With Sources:** Citation links visible
- **With Document:** Document card embedded
- **Error:** Error message with retry

### Chat History
- **Loading:** Skeleton messages
- **Empty:** Welcome message only
- **Populated:** Messages with timestamps
- **Error:** "Failed to load history" message

### Quick Actions
- **Default:** Action buttons visible
- **Hover:** Button elevated
- **Loading:** Spinner on button
- **Disabled:** During active request

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│  [=] AI ASSISTANT        [...]  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ [AI]                    │    │
│  │                         │    │
│  │ Hello! I can help with: │    │
│  │ - Document generation   │    │
│  │ - Compliance questions  │    │
│  │ - Gap analysis          │    │
│  │                         │    │
│  │ What do you need?       │    │
│  │                         │    │
│  │              10:30 AM   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │            [USER]       │    │
│  │                         │    │
│  │ I need an access        │    │
│  │ control policy          │    │
│  │                         │    │
│  │              10:31 AM   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [AI]                    │    │
│  │                         │    │
│  │ An ISO 27001 access     │    │
│  │ control policy should   │    │
│  │ include...              │    │
│  │                         │    │
│  │ [Generate Policy]       │    │
│  │                         │    │
│  │              10:32 AM   │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ Ask about compliance... │    │
│  └─────────────────────────┘    │
│                                 │
│  [+] [ISO 27001 v] [== Send ==] │
│                                 │
└─────────────────────────────────┘
```

---

## Framework Context Selector

Available frameworks for context:
- ISO 27001
- SOC 2 Type II
- FedRAMP
- NIST 800-53
- GDPR
- HIPAA
- PCI-DSS
- All Frameworks

---

## Error States

### API Error
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Avatar]                                                  │
│                                                              │
│ I'm having trouble processing your request right now.        │
│ Please try again in a moment.                                │
│                                                              │
│ [Retry]                                                      │
└──────────────────────────────────────────────────────────────┘
```

### Rate Limit
```
┌──────────────────────────────────────────────────────────────┐
│ [AI Avatar]                                                  │
│                                                              │
│ You've reached your daily AI request limit.                  │
│ Limit resets in 2 hours.                                     │
│                                                              │
│ [Upgrade Plan]                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Accessibility Notes

- Chat messages are in a live region for screen readers
- Keyboard navigation between messages
- Focus management for new messages
- Action buttons are keyboard accessible
- Loading states announced
- File attachments have accessible names

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
