# MFA Setup Wireframe

**Screen:** Multi-Factor Authentication Setup
**Status:** Complete
**Priority:** High (Security Critical)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                           [User Menu v] │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   SIDEBAR (240px)      │              MFA SETUP                             │
│   ─────────────────    │              ─────────                             │
│                        │                                                    │
│   > Dashboard          │   ┌────────────────────────────────────────────┐   │
│     Documents          │   │                                            │   │
│     Gap Analysis       │   │   Secure Your Account                      │   │
│     Audit Trail        │   │   ─────────────────────                    │   │
│     Reports            │   │                                            │   │
│     ─────────────      │   │   Choose your preferred authentication    │   │
│     Cloud Storage      │   │   method to add an extra layer of         │   │
│     Settings           │   │   security to your account.               │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   STEP 1: Select Method                    │   │
│                        │   │   ─────────────────────                    │   │
│                        │   │                                            │   │
│                        │   │   ( ) Authenticator App (Recommended)      │   │
│                        │   │       Use Google Authenticator, Authy,     │   │
│                        │   │       or similar TOTP app                  │   │
│                        │   │                                            │   │
│                        │   │   ( ) SMS Verification                     │   │
│                        │   │       Receive codes via text message       │   │
│                        │   │                                            │   │
│                        │   │   ( ) Email Verification                   │   │
│                        │   │       Receive codes via email              │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   STEP 2: Setup Authenticator              │   │
│                        │   │   ─────────────────────────                │   │
│                        │   │                                            │   │
│                        │   │   ┌──────────────┐                         │   │
│                        │   │   │              │   1. Install an         │   │
│                        │   │   │   [QR CODE]  │      authenticator app  │   │
│                        │   │   │              │                         │   │
│                        │   │   │              │   2. Scan this QR code  │   │
│                        │   │   └──────────────┘                         │   │
│                        │   │                                            │   │
│                        │   │   Can't scan? Enter this key manually:     │   │
│                        │   │   ┌───────────────────────────────┐        │   │
│                        │   │   │ ABCD-EFGH-IJKL-MNOP          │ [Copy] │   │
│                        │   │   └───────────────────────────────┘        │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   STEP 3: Verify Code                      │   │
│                        │   │   ───────────────────                      │   │
│                        │   │                                            │   │
│                        │   │   Enter the 6-digit code from your app:    │   │
│                        │   │                                            │   │
│                        │   │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │   │
│                        │   │   │   │ │   │ │   │ │   │ │   │ │   │     │   │
│                        │   │   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │   │
│                        │   │                                            │   │
│                        │   │   [========= Verify & Enable MFA =========]│   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
│                        │   ┌────────────────────────────────────────────┐   │
│                        │   │                                            │   │
│                        │   │   Recovery Codes                           │   │
│                        │   │   ──────────────                           │   │
│                        │   │                                            │   │
│                        │   │   Save these backup codes in a safe place. │   │
│                        │   │   Each code can only be used once.         │   │
│                        │   │                                            │   │
│                        │   │   ┌───────────────────────────────┐        │   │
│                        │   │   │ XXXX-XXXX-XXXX                │        │   │
│                        │   │   │ XXXX-XXXX-XXXX                │        │   │
│                        │   │   │ XXXX-XXXX-XXXX                │        │   │
│                        │   │   │ XXXX-XXXX-XXXX                │        │   │
│                        │   │   │ XXXX-XXXX-XXXX                │        │   │
│                        │   │   └───────────────────────────────┘        │   │
│                        │   │                                            │   │
│                        │   │   [Download] [Copy] [Print]                │   │
│                        │   │                                            │   │
│                        │   └────────────────────────────────────────────┘   │
│                        │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

---

## Component States

### Method Selection
- **Default:** All options visible, none selected
- **Selected:** Radio button filled, card highlighted
- **Disabled:** Greyed out if not available for org

### QR Code Section
- **Loading:** Spinner while generating QR code
- **Ready:** QR code displayed with manual key
- **Error:** Error message if generation fails

### Verification Input
- **Empty:** Placeholder dashes in each box
- **Active:** Cursor in current box, border highlighted
- **Filled:** Numbers visible in boxes
- **Error:** Red border with error message
- **Success:** Green checkmark, proceed to next step

### Recovery Codes
- **Hidden:** Only shown after successful verification
- **Visible:** Grid of codes with copy/download options
- **Acknowledged:** Checkbox to confirm codes saved

### Verify Button
- **Default:** Active, primary color
- **Hover:** Slightly elevated background
- **Loading:** Spinner, disabled state
- **Disabled:** Greyed out if code incomplete
- **Success:** Green checkmark, redirect

### Page States
- **Loading:** Skeleton loaders for method options
- **Empty:** N/A (always shows setup options)
- **Error:** Error banner with retry option
- **Success:** Confirmation message with redirect

---

## Interactions

1. **Method Selection:** Click radio to select MFA method
2. **QR Code:** Tap/click to enlarge on mobile
3. **Manual Key:** Click Copy to copy to clipboard
4. **Code Input:** Auto-focus next box after digit entry
5. **Verify Button:** Validate code and enable MFA
6. **Recovery Codes:** Download as text file or copy all

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [=] [Logo] CyberDocGen                        [User Menu v] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              MFA SETUP                                       │
│              ─────────                                       │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   Secure Your Account                                │   │
│   │   Choose your preferred authentication method        │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   STEP 1: Select Method                              │   │
│   │   ─────────────────────                              │   │
│   │                                                      │   │
│   │   ( ) Authenticator App (Recommended)                │   │
│   │   ( ) SMS Verification                               │   │
│   │   ( ) Email Verification                             │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   STEP 2: Setup Authenticator                        │   │
│   │   ─────────────────────────                          │   │
│   │                                                      │   │
│   │   ┌────────────┐   1. Install an authenticator app   │   │
│   │   │            │   2. Scan this QR code              │   │
│   │   │ [QR CODE]  │                                     │   │
│   │   │            │   Manual Key: ABCD-EFGH... [Copy]   │   │
│   │   └────────────┘                                     │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   STEP 3: Verify Code                                │   │
│   │   ───────────────────                                │   │
│   │                                                      │   │
│   │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │   │
│   │   │   │ │   │ │   │ │   │ │   │ │   │               │   │
│   │   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘               │   │
│   │                                                      │   │
│   │   [============ Verify & Enable MFA ============]    │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│         MFA SETUP               │
│    ──────────────────────       │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Secure Your Account    │    │
│  │  Add extra security     │    │
│  └─────────────────────────┘    │
│                                 │
│  Step 1: Select Method          │
│  ─────────────────────          │
│                                 │
│  ┌─────────────────────────┐    │
│  │ (*) Authenticator App   │    │
│  │     Recommended         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ( ) SMS Verification    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ( ) Email Verification  │    │
│  └─────────────────────────┘    │
│                                 │
│  Step 2: Scan QR Code           │
│  ─────────────────────          │
│                                 │
│       ┌──────────────┐          │
│       │              │          │
│       │   [QR CODE]  │          │
│       │              │          │
│       └──────────────┘          │
│                                 │
│  Manual Key: ABCD-EFGH... [Copy]│
│                                 │
│  Step 3: Verify                 │
│  ─────────────────              │
│                                 │
│  ┌───┬───┬───┬───┬───┬───┐     │
│  │   │   │   │   │   │   │     │
│  └───┴───┴───┴───┴───┴───┘     │
│                                 │
│  [======= Enable MFA =======]   │
│                                 │
└─────────────────────────────────┘
```

---

## Accessibility Notes

- All form inputs have associated labels
- Error messages announced to screen readers
- Keyboard navigation between code input boxes
- QR code has text alternative (manual key)
- Recovery codes can be downloaded for offline access

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
