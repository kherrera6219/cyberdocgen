# Signup / Registration Wireframe

**Screen:** Enterprise Signup
**Status:** Complete
**Priority:** High (User Acquisition)

---

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (64px)                                  │
│  [Logo] CyberDocGen                                    [Login] [Contact Us] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        CREATE YOUR ACCOUNT                                  │
│                        ───────────────────                                  │
│                                                                             │
│   ┌─────────────────────────────┐   ┌─────────────────────────────────┐     │
│   │                             │   │                                 │     │
│   │   ORGANIZATION DETAILS      │   │   WHY CYBERDOCGEN?              │     │
│   │   ─────────────────────     │   │   ─────────────────             │     │
│   │                             │   │                                 │     │
│   │   Organization Name *       │   │   [*] AI-Powered Compliance     │     │
│   │   ┌───────────────────────┐ │   │       Automate document         │     │
│   │   │                       │ │   │       generation and analysis   │     │
│   │   └───────────────────────┘ │   │                                 │     │
│   │                             │   │   [*] Multi-Framework Support   │     │
│   │   Industry *                │   │       ISO 27001, SOC 2,         │     │
│   │   ┌───────────────────[v]─┐ │   │       FedRAMP, NIST 800-53      │     │
│   │   │ Select industry...    │ │   │                                 │     │
│   │   └───────────────────────┘ │   │   [*] Enterprise Security       │     │
│   │                             │   │       Field-level encryption,   │     │
│   │   Company Size *            │   │       MFA, audit logging        │     │
│   │   ┌───────────────────[v]─┐ │   │                                 │     │
│   │   │ Select size...        │ │   │   [*] Cloud Integrations        │     │
│   │   └───────────────────────┘ │   │       Connect to Google Drive,  │     │
│   │                             │   │       OneDrive, and more         │     │
│   │   ───────────────────────── │   │                                 │     │
│   │                             │   │   ─────────────────────────     │     │
│   │   ADMIN ACCOUNT             │   │                                 │     │
│   │   ─────────────             │   │   "CyberDocGen reduced our      │     │
│   │                             │   │    compliance prep time by 70%" │     │
│   │   Full Name *               │   │                                 │     │
│   │   ┌───────────────────────┐ │   │   - Sarah Chen, CISO            │     │
│   │   │                       │ │   │     TechCorp Industries         │     │
│   │   └───────────────────────┘ │   │                                 │     │
│   │                             │   └─────────────────────────────────┘     │
│   │   Email Address *           │                                           │
│   │   ┌───────────────────────┐ │   ┌─────────────────────────────────┐     │
│   │   │                       │ │   │                                 │     │
│   │   └───────────────────────┘ │   │   TRUSTED BY                    │     │
│   │                             │   │                                 │     │
│   │   Password *                │   │   [Logo] [Logo] [Logo] [Logo]   │     │
│   │   ┌───────────────────────┐ │   │                                 │     │
│   │   │ ●●●●●●●●           [O]│ │   │   500+ Organizations            │     │
│   │   └───────────────────────┘ │   │   10,000+ Documents Generated   │     │
│   │   Must be at least 12 chars │   │   99.9% Uptime                  │     │
│   │                             │   │                                 │     │
│   │   Confirm Password *        │   └─────────────────────────────────┘     │
│   │   ┌───────────────────────┐ │                                           │
│   │   │ ●●●●●●●●           [O]│ │                                           │
│   │   └───────────────────────┘ │                                           │
│   │                             │                                           │
│   │   ───────────────────────── │                                           │
│   │                             │                                           │
│   │   [x] I agree to the        │                                           │
│   │       Terms of Service and  │                                           │
│   │       Privacy Policy        │                                           │
│   │                             │                                           │
│   │   [x] I want to receive     │                                           │
│   │       product updates       │                                           │
│   │                             │                                           │
│   │   [======= Create Account =======]                                      │
│   │                             │                                           │
│   │   Already have an account?  │                                           │
│   │   Sign in here              │                                           │
│   │                             │                                           │
│   └─────────────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Form Fields

### Organization Details
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization Name | Text | Yes | 2-100 chars |
| Industry | Select | Yes | From predefined list |
| Company Size | Select | Yes | 1-10, 11-50, 51-200, 201-500, 500+ |

### Admin Account
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text | Yes | 2-50 chars |
| Email | Email | Yes | Valid email format |
| Password | Password | Yes | Min 12 chars, complexity |
| Confirm Password | Password | Yes | Must match password |

---

## Component States

### Form Fields
- **Default:** Empty with placeholder text
- **Focus:** Blue border highlight
- **Filled:** Value visible, valid checkmark
- **Error:** Red border, error message below
- **Disabled:** Greyed out (during submission)

### Password Field
- **Hidden:** Dots/bullets shown
- **Visible:** Plain text (toggle with eye icon)
- **Strength:** Indicator bar (weak/medium/strong)

### Submit Button
- **Default:** Active, primary color
- **Hover:** Slightly elevated background
- **Loading:** Spinner, disabled
- **Disabled:** Greyed out if form invalid

### Dropdown Fields
- **Default:** Placeholder text visible
- **Focus:** Border highlighted, dropdown open
- **Selected:** Selected value visible
- **Error:** Red border with error message

### Page States
- **Loading:** Skeleton loaders for form
- **Empty:** N/A (form always shown)
- **Error:** Error banner at top of form
- **Success:** Redirect to verification page

---

## Validation Rules

1. **Organization Name:** Required, 2-100 characters
2. **Industry:** Must select from dropdown
3. **Company Size:** Must select from dropdown
4. **Full Name:** Required, 2-50 characters
5. **Email:** Valid format, not already registered
6. **Password:** 
   - Minimum 12 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
7. **Confirm Password:** Must match password
8. **Terms:** Must be checked

---

## Tablet Layout (768x1024)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (56px)                         │
│  [Logo] CyberDocGen                       [Login] [Contact]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              CREATE YOUR ACCOUNT                             │
│              ───────────────────                             │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │   ORGANIZATION DETAILS                               │   │
│   │   ─────────────────────                              │   │
│   │                                                      │   │
│   │   Organization Name *                                │   │
│   │   ┌──────────────────────────────────────────────┐   │   │
│   │   │                                              │   │   │
│   │   └──────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │   Industry *                  Company Size *         │   │
│   │   ┌─────────────────[v]┐     ┌─────────────────[v]┐  │   │
│   │   │ Select industry   │     │ Select size       │  │   │
│   │   └───────────────────┘     └───────────────────┘  │   │
│   │                                                      │   │
│   │   ADMIN ACCOUNT                                      │   │
│   │   ─────────────                                      │   │
│   │                                                      │   │
│   │   Full Name *                                        │   │
│   │   ┌──────────────────────────────────────────────┐   │   │
│   │   │                                              │   │   │
│   │   └──────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │   Email Address *                                    │   │
│   │   ┌──────────────────────────────────────────────┐   │   │
│   │   │                                              │   │   │
│   │   └──────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   │   Password *                  Confirm Password *     │   │
│   │   ┌─────────────────────┐     ┌─────────────────────┐│   │
│   │   │ ●●●●●●●●         [O]│     │ ●●●●●●●●         [O]││   │
│   │   └─────────────────────┘     └─────────────────────┘│   │
│   │   [==========] Strong                                │   │
│   │                                                      │   │
│   │   [x] I agree to Terms    [ ] Send me updates       │   │
│   │                                                      │   │
│   │   [============= Create Account ==============]      │   │
│   │                                                      │   │
│   │   Already have an account? Sign in here              │   │
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────────────┐
│  [Logo] CyberDocGen             │
│                                 │
│     CREATE YOUR ACCOUNT         │
│     ───────────────────         │
│                                 │
│  Organization Details           │
│  ─────────────────────          │
│                                 │
│  Organization Name *            │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Industry *                     │
│  ┌───────────────────────[v]┐   │
│  │ Select industry...       │   │
│  └──────────────────────────┘   │
│                                 │
│  Company Size *                 │
│  ┌───────────────────────[v]┐   │
│  │ Select size...           │   │
│  └──────────────────────────┘   │
│                                 │
│  Admin Account                  │
│  ─────────────                  │
│                                 │
│  Full Name *                    │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Email Address *                │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Password *                     │
│  ┌─────────────────────────┐    │
│  │ ●●●●●●●●             [O]│    │
│  └─────────────────────────┘    │
│  [===========] Strong           │
│                                 │
│  Confirm Password *             │
│  ┌─────────────────────────┐    │
│  │ ●●●●●●●●             [O]│    │
│  └─────────────────────────┘    │
│                                 │
│  [x] I agree to Terms           │
│  [ ] Send me updates            │
│                                 │
│  [===== Create Account =====]   │
│                                 │
│  Already have an account?       │
│  Sign in here                   │
│                                 │
└─────────────────────────────────┘
```

---

## Post-Registration Flow

1. **Email Verification:** Redirect to verification pending page
2. **Email Sent:** User receives verification email
3. **Verification:** Click link to verify email
4. **MFA Setup:** Optional MFA setup prompt
5. **Onboarding:** Guided tour of features

---

## Accessibility Notes

- All form fields have visible labels
- Error messages linked to form fields
- Password requirements announced
- Focus management after submission
- Progress indicators for multi-step flow

---

**Created:** December 9, 2025
**Last Updated:** December 9, 2025
