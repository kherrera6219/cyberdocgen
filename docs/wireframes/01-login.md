# Login Page Wireframe

**Screen:** Authentication - Login
**Route:** `/login`
**Viewport:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
**Status:** Core screen

---

## Desktop Layout (1920x1080)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                              CyberDocGen                                   │
│                     Enterprise Compliance Management                       │
│                                                                            │
│                                                                            │
│                    ┌──────────────────────────────┐                       │
│                    │                              │                       │
│                    │     [  CyberDocGen Logo  ]   │                       │
│                    │                              │                       │
│                    │    Welcome Back              │                       │
│                    │    Sign in to your account   │                       │
│                    │                              │                       │
│                    │    Email                     │                       │
│                    │    ┌───────────────────────┐│                       │
│                    │    │ you@example.com       ││                       │
│                    │    └───────────────────────┘│                       │
│                    │                              │                       │
│                    │    Password                  │                       │
│                    │    ┌───────────────────────┐│                       │
│                    │    │ ••••••••••            ││                       │
│                    │    └───────────────────────┘│                       │
│                    │                              │                       │
│                    │    [x] Remember me           │                       │
│                    │                              │                       │
│                    │    ┌═══════════════════════┐│                       │
│                    │    ║   Sign In             ║│                       │
│                    │    └═══════════════════════┘│                       │
│                    │                              │                       │
│                    │    Forgot password?          │                       │
│                    │                              │                       │
│                    │    ─────────  or  ─────────  │                       │
│                    │                              │                       │
│                    │    ┌───────────────────────┐│                       │
│                    │    │ [G] Sign in with Google ││                       │
│                    │    └───────────────────────┘│                       │
│                    │                              │                       │
│                    │    ┌───────────────────────┐│                       │
│                    │    │ [R] Sign in with Replit││                       │
│                    │    └───────────────────────┘│                       │
│                    │                              │                       │
│                    │    Don't have an account?    │                       │
│                    │    Sign up                   │                       │
│                    │                              │                       │
│                    └──────────────────────────────┘                       │
│                                                                            │
│                                                                            │
│                      © 2025 CyberDocGen. All rights reserved.             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768x1024)

```
┌──────────────────────────────────────┐
│                                      │
│         CyberDocGen                  │
│                                      │
│   ┌──────────────────────────────┐  │
│   │                              │  │
│   │  [  CyberDocGen Logo  ]      │  │
│   │                              │  │
│   │  Welcome Back                │  │
│   │  Sign in to your account     │  │
│   │                              │  │
│   │  Email                       │  │
│   │  ┌─────────────────────────┐│  │
│   │  │ you@example.com         ││  │
│   │  └─────────────────────────┘│  │
│   │                              │  │
│   │  Password                    │  │
│   │  ┌─────────────────────────┐│  │
│   │  │ ••••••••••              ││  │
│   │  └─────────────────────────┘│  │
│   │                              │  │
│   │  [x] Remember me             │  │
│   │                              │  │
│   │  ┌═════════════════════════┐│  │
│   │  ║   Sign In               ║│  │
│   │  └═════════════════════════┘│  │
│   │                              │  │
│   │  Forgot password?            │  │
│   │                              │  │
│   │  ───────  or  ───────        │  │
│   │                              │  │
│   │  ┌─────────────────────────┐│  │
│   │  │ [G] Sign in with Google ││  │
│   │  └─────────────────────────┘│  │
│   │                              │  │
│   │  ┌─────────────────────────┐│  │
│   │  │ [R] Sign in with Replit ││  │
│   │  └─────────────────────────┘│  │
│   │                              │  │
│   │  Don't have an account?      │  │
│   │  Sign up                     │  │
│   │                              │  │
│   └──────────────────────────────┘  │
│                                      │
│  © 2025 CyberDocGen                  │
│                                      │
└──────────────────────────────────────┘
```

---

## Mobile Layout (375x812)

```
┌─────────────────────────┐
│  ☰  CyberDocGen         │
├─────────────────────────┤
│                         │
│  [  Logo  ]             │
│                         │
│  Welcome Back           │
│  Sign in to continue    │
│                         │
│  Email                  │
│  ┌────────────────────┐│
│  │ you@example.com    ││
│  └────────────────────┘│
│                         │
│  Password               │
│  ┌────────────────────┐│
│  │ ••••••••••         ││
│  └────────────────────┘│
│                         │
│  [x] Remember me        │
│                         │
│  ┌════════════════════┐│
│  ║  Sign In           ║│
│  └════════════════════┘│
│                         │
│  Forgot password?       │
│                         │
│  ──────  or  ──────     │
│                         │
│  ┌────────────────────┐│
│  │ [G] Google         ││
│  └────────────────────┘│
│                         │
│  ┌────────────────────┐│
│  │ [R] Replit         ││
│  └────────────────────┘│
│                         │
│  Don't have account?    │
│  Sign up                │
│                         │
└─────────────────────────┘
```

---

## Component Specifications

### Form Container
- **Width:** 400px (desktop), 90% (mobile)
- **Padding:** 48px (desktop), 24px (mobile)
- **Background:** White
- **Border radius:** 12px
- **Shadow:** Large shadow (0 20px 25px -5px rgba(0, 0, 0, 0.1))

### Logo
- **Size:** 120px × 40px
- **Position:** Center aligned
- **Margin bottom:** 32px

### Heading
- **Font size:** 24px (desktop), 20px (mobile)
- **Font weight:** 600 (Semibold)
- **Color:** Gray 900
- **Margin bottom:** 8px

### Subheading
- **Font size:** 14px
- **Font weight:** 400 (Regular)
- **Color:** Gray 600
- **Margin bottom:** 32px

### Input Fields
- **Height:** 40px
- **Padding:** 12px
- **Border:** 1px solid Gray 300
- **Border radius:** 6px
- **Font size:** 14px
- **Margin bottom:** 16px

**Focus State:**
- **Border:** 2px solid Primary 500
- **Outline:** 2px solid Primary 500 with 2px offset

**Error State:**
- **Border:** 1px solid Error 500
- **Helper text:** Error 600 color

### Checkbox
- **Size:** 16px × 16px
- **Border:** 2px solid Gray 300
- **Checked background:** Primary 600
- **Label font size:** 14px
- **Label color:** Gray 700

### Primary Button
- **Width:** 100%
- **Height:** 40px
- **Background:** Primary 600 (#2563eb)
- **Color:** White
- **Font size:** 14px
- **Font weight:** 500 (Medium)
- **Border radius:** 6px
- **Padding:** 10px 16px

**Hover:**
- **Background:** Primary 700

**Focus:**
- **Outline:** 2px solid Primary 500, 2px offset

**Loading:**
- **Show spinner:** Replace text with loading spinner
- **Disabled:** true

### OAuth Buttons
- **Width:** 100%
- **Height:** 40px
- **Background:** White
- **Border:** 1px solid Gray 300
- **Color:** Gray 900
- **Font size:** 14px
- **Icon:** 20px × 20px, left aligned
- **Border radius:** 6px

**Hover:**
- **Background:** Gray 50
- **Border:** 1px solid Gray 400

### Links
- **Color:** Primary 600
- **Font size:** 14px
- **Text decoration:** underline on hover
- **Font weight:** 400

**Hover:**
- **Color:** Primary 700

---

## State Variations

### Default State
- All fields empty
- "Sign In" button enabled
- No error messages

### Filled State
- Email and password filled
- "Remember me" checked
- Button ready to submit

### Validation Error State
```
┌──────────────────────────────┐
│  Email                       │
│  ┌─────────────────────────┐│ (Red border)
│  │ invalid-email           ││
│  └─────────────────────────┘│
│  ⚠ Please enter a valid email │ (Red text)
│                              │
│  Password                    │
│  ┌─────────────────────────┐│ (Red border)
│  │                         ││
│  └─────────────────────────┘│
│  ⚠ Password is required      │ (Red text)
└──────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────┐
│  ┌══════════════════════════┐│
│  ║  [⟳]  Signing in...      ║│ (Spinner + text)
│  └══════════════════════════┘│
└──────────────────────────────┘
```

### Authentication Error State
```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │ ⚠  Invalid email or password   │  │ (Error banner)
│  └────────────────────────────────┘  │
│                                      │
│  Email                               │
│  ┌─────────────────────────────────┐│
│  │ user@example.com                ││
│  └─────────────────────────────────┘│
└──────────────────────────────────────┘
```

### MFA Required State
After successful login, if MFA is enabled:
- Redirect to MFA verification screen
- Show "Enter verification code" prompt
- 6-digit code input
- "Verify" button

---

## Interactions

### Email Input
1. User clicks/taps field
2. Field gains focus (blue border)
3. User types email
4. On blur: Validate email format
5. If invalid: Show error message and red border
6. If valid: Remove error (if any)

### Password Input
1. User clicks/taps field
2. Field gains focus (blue border)
3. User types password (masked)
4. Optional: "Show/Hide" toggle icon on right
5. On blur: Validate not empty
6. If invalid: Show error message

### Remember Me Checkbox
1. User clicks checkbox or label
2. Checkbox toggles checked/unchecked
3. State saved for form submission

### Forgot Password Link
1. User clicks link
2. Navigate to `/forgot-password`
3. Show password recovery form

### Sign In Button
1. User clicks button
2. Validate all fields
3. If invalid: Show error messages, stop
4. If valid:
   - Show loading state (spinner)
   - Submit credentials to API
   - On success: Redirect to dashboard (or MFA if enabled)
   - On error: Show error banner, reset button

### OAuth Buttons
1. User clicks Google/Replit button
2. Redirect to OAuth provider
3. User authorizes
4. Redirect back with token
5. Complete authentication
6. Redirect to dashboard

### Sign Up Link
1. User clicks "Sign up" link
2. Navigate to `/signup`
3. Show registration form

---

## Accessibility

### Keyboard Navigation
- Tab order: Email → Password → Remember Me → Sign In → Forgot Password → Google → Replit → Sign Up
- Enter key: Submits form (if focused on input or button)
- Space key: Activates buttons and checkbox

### Screen Reader
- Form has `<form>` tag with `aria-label="Login form"`
- Email input: `<label for="email">Email</label>`
- Password input: `<label for="password">Password</label>`
- Error messages: `aria-describedby` linking to error text
- Loading state: `aria-live="polite"` announces "Signing in"

### Focus Management
- All interactive elements have visible focus indicator
- Focus returns to first error field on validation fail
- After login, focus moves to main content area

---

## Technical Notes

### API Endpoint
- **POST** `/api/auth/login`
- **Body:** `{ email, password, rememberMe }`
- **Response:** `{ success, token, user, requiresMFA }`

### Validation Rules
- **Email:** Valid email format, required
- **Password:** Minimum 8 characters, required

### Security
- Password field uses `type="password"`
- Form uses HTTPS
- CSRF token included
- Rate limiting: 5 attempts per 15 minutes

### Analytics
- Track: Page view, sign in attempt, sign in success/failure
- Track: OAuth button clicks
- Track: "Forgot password" link clicks
- Track: "Sign up" link clicks

---

**Created:** November 25, 2025
**Last updated:** November 25, 2025
**Status:** Complete
