# CyberDocGen Design System

**Version:** 1.0.0
**Last Updated:** November 25, 2025
**Status:** Active

---

## Table of Contents

1. [Introduction](#introduction)
2. [Design Principles](#design-principles)
3. [Design Tokens](#design-tokens)
4. [Typography](#typography)
5. [Color System](#color-system)
6. [Spacing & Layout](#spacing--layout)
7. [Components](#components)
8. [Patterns](#patterns)
9. [Accessibility](#accessibility)
10. [Responsive Design](#responsive-design)

---

## Introduction

The CyberDocGen Design System is a comprehensive guide to the visual and interaction design of the CyberDocGen Enterprise Compliance Management System. This system ensures consistency, accessibility, and scalability across the entire application.

### Goals

- **Consistency:** Provide a unified experience across all features
- **Efficiency:** Enable rapid development with reusable components
- **Accessibility:** Ensure WCAG 2.2 AA compliance minimum
- **Scalability:** Support future features and expansions
- **Maintainability:** Make updates and modifications straightforward

### Technology Stack

- **UI Framework:** React 18.3 with TypeScript
- **Component Library:** Radix UI primitives
- **Styling:** Tailwind CSS 3.4 with custom configuration
- **Icons:** Lucide React
- **Animations:** Framer Motion + Tailwind CSS Animate

---

## Design Principles

### 1. Clarity Over Cleverness
- Clear, straightforward interfaces
- Avoid unnecessary complexity
- Use familiar patterns
- Provide clear feedback

### 2. Enterprise Professional
- Professional, trustworthy aesthetic
- Serious without being boring
- Clean, modern design
- Data-dense where appropriate

### 3. Accessible by Default
- WCAG 2.2 AA minimum compliance
- Keyboard navigation always works
- Screen reader friendly
- High contrast mode support

### 4. Performance First
- Fast, responsive interactions
- Minimal animation where appropriate
- Optimized for large datasets
- Progressive enhancement

### 5. User-Centric
- Put user needs first
- Minimize cognitive load
- Provide helpful error messages
- Guide users through complex flows

---

## Design Tokens

Design tokens are the atomic values that define the visual design of the system.

### Color Tokens

#### Primary Colors
```css
--color-primary-50: #eff6ff;   /* Very light blue */
--color-primary-100: #dbeafe;  /* Light blue */
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Primary brand blue */
--color-primary-600: #2563eb;  /* Primary hover */
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;  /* Very dark blue */
```

#### Secondary Colors
```css
--color-secondary-50: #f0fdf4;
--color-secondary-100: #dcfce7;
--color-secondary-200: #bbf7d0;
--color-secondary-300: #86efac;
--color-secondary-400: #4ade80;
--color-secondary-500: #10b981;  /* Secondary brand green */
--color-secondary-600: #059669;  /* Secondary hover */
--color-secondary-700: #047857;
--color-secondary-800: #065f46;
--color-secondary-900: #064e3b;
```

#### Accent Colors
```css
--color-accent-50: #faf5ff;
--color-accent-100: #f3e8ff;
--color-accent-200: #e9d5ff;
--color-accent-300: #d8b4fe;
--color-accent-400: #c084fc;
--color-accent-500: #8b5cf6;    /* Accent purple */
--color-accent-600: #7c3aed;
--color-accent-700: #6d28d9;
--color-accent-800: #5b21b6;
--color-accent-900: #4c1d95;
```

#### Semantic Colors

**Success**
```css
--color-success-light: #d1fae5;
--color-success: #10b981;        /* Green 500 */
--color-success-dark: #047857;
```

**Warning**
```css
--color-warning-light: #fed7aa;
--color-warning: #f59e0b;        /* Amber 500 */
--color-warning-dark: #d97706;
```

**Error**
```css
--color-error-light: #fecaca;
--color-error: #ef4444;          /* Red 500 */
--color-error-dark: #dc2626;
```

**Info**
```css
--color-info-light: #bfdbfe;
--color-info: #3b82f6;           /* Blue 500 */
--color-info-dark: #1d4ed8;
```

#### Neutral Colors (Grayscale)

**Light Mode**
```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
--color-gray-950: #030712;
```

**Dark Mode**
```css
--color-dark-bg: #0f172a;        /* Slate 900 */
--color-dark-surface: #1e293b;   /* Slate 800 */
--color-dark-border: #334155;    /* Slate 700 */
--color-dark-text: #f1f5f9;      /* Slate 100 */
--color-dark-text-muted: #94a3b8; /* Slate 400 */
```

### Typography Tokens

#### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
             'Droid Sans', 'Helvetica Neue', sans-serif;

--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco',
             'Courier New', monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

#### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

#### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Spacing Tokens

```css
--space-0: 0px;
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */
--space-32: 8rem;        /* 128px */
```

**Usage Guidelines:**
- `space-1` to `space-3`: Tight spacing within components
- `space-4` to `space-6`: Standard component spacing
- `space-8` to `space-12`: Section spacing
- `space-16+`: Page layout spacing

### Border Radius Tokens

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-default: 0.25rem; /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Fully rounded */
```

**Usage Guidelines:**
- `radius-sm`: Small UI elements (badges, tags)
- `radius-default`: Buttons, inputs
- `radius-md` to `radius-lg`: Cards, panels
- `radius-xl` to `radius-2xl`: Large containers, modals
- `radius-full`: Pills, avatars, circular buttons

### Shadow Tokens

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
             0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-default: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-2xl: 0 50px 100px -20px rgba(0, 0, 0, 0.25);
```

### Transition Tokens

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slower: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Z-Index Tokens

```css
--z-0: 0;
--z-10: 10;
--z-20: 20;
--z-30: 30;
--z-40: 40;
--z-50: 50;           /* Dropdowns, popovers */
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;      /* Fixed headers/footers */
--z-modal-backdrop: 1040;
--z-modal: 1050;      /* Modals, dialogs */
--z-popover: 1060;
--z-tooltip: 1070;    /* Tooltips */
--z-notification: 1080; /* Toast notifications */
```

---

## Typography

### Type Scale

#### Heading Styles

**H1 - Page Title**
```css
font-size: 2.25rem;      /* 36px */
font-weight: 700;        /* Bold */
line-height: 1.25;       /* Tight */
letter-spacing: -0.025em;
```
Usage: Main page titles

**H2 - Section Title**
```css
font-size: 1.875rem;     /* 30px */
font-weight: 600;        /* Semibold */
line-height: 1.25;
letter-spacing: -0.02em;
```
Usage: Major section headings

**H3 - Subsection Title**
```css
font-size: 1.5rem;       /* 24px */
font-weight: 600;
line-height: 1.375;
```
Usage: Subsection headings, card titles

**H4 - Component Title**
```css
font-size: 1.25rem;      /* 20px */
font-weight: 600;
line-height: 1.5;
```
Usage: Component headings, smaller section titles

**H5 - Small Heading**
```css
font-size: 1.125rem;     /* 18px */
font-weight: 500;        /* Medium */
line-height: 1.5;
```
Usage: Form section labels, list headings

**H6 - Tiny Heading**
```css
font-size: 1rem;         /* 16px */
font-weight: 500;
line-height: 1.5;
```
Usage: Small component headings

#### Body Text Styles

**Body Large**
```css
font-size: 1.125rem;     /* 18px */
font-weight: 400;
line-height: 1.75;
```
Usage: Intro paragraphs, emphasized content

**Body Regular**
```css
font-size: 1rem;         /* 16px */
font-weight: 400;
line-height: 1.5;
```
Usage: Default body text, descriptions

**Body Small**
```css
font-size: 0.875rem;     /* 14px */
font-weight: 400;
line-height: 1.5;
```
Usage: Secondary information, captions

**Body Tiny**
```css
font-size: 0.75rem;      /* 12px */
font-weight: 400;
line-height: 1.5;
```
Usage: Timestamps, metadata, footnotes

#### Interactive Text Styles

**Link**
```css
color: var(--color-primary-600);
text-decoration: underline;
cursor: pointer;

&:hover {
  color: var(--color-primary-700);
}

&:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

**Label**
```css
font-size: 0.875rem;     /* 14px */
font-weight: 500;
line-height: 1.5;
color: var(--color-gray-700);
```

**Code Inline**
```css
font-family: var(--font-mono);
font-size: 0.875em;
padding: 0.125rem 0.25rem;
background: var(--color-gray-100);
border-radius: var(--radius-sm);
```

---

## Color System

### Color Usage Guidelines

#### Primary Color (Blue)
- **Purpose:** Primary actions, links, active states
- **Use for:** Primary buttons, active navigation, selected items, focus states
- **Avoid:** Error states, destructive actions

#### Secondary Color (Green)
- **Purpose:** Success states, positive actions
- **Use for:** Success messages, completion indicators, positive metrics
- **Avoid:** Warning or error states

#### Accent Color (Purple)
- **Purpose:** Special features, AI-related elements
- **Use for:** AI badges, premium features, highlights
- **Avoid:** Overuse (should be sparingly used)

#### Semantic Colors

**Success (Green)**
- ✅ Success messages
- ✅ Completion indicators
- ✅ Positive status badges
- ✅ Checkmarks and confirmations

**Warning (Amber)**
- ⚠️ Warning messages
- ⚠️ Caution indicators
- ⚠️ Pending actions
- ⚠️ Attention-needed states

**Error (Red)**
- ❌ Error messages
- ❌ Validation errors
- ❌ Destructive actions
- ❌ Critical alerts

**Info (Blue)**
- ℹ️ Informational messages
- ℹ️ Helper text
- ℹ️ Tooltips
- ℹ️ Neutral notifications

### Color Accessibility

All color combinations must meet WCAG 2.2 AA standards:
- **Normal text:** 4.5:1 contrast ratio minimum
- **Large text (18px+):** 3:1 contrast ratio minimum
- **UI components:** 3:1 contrast ratio minimum

### Dark Mode

Dark mode uses inverted color relationships:
- Background: Dark slate (900)
- Surface: Medium slate (800)
- Text: Light slate (100)
- Muted text: Medium slate (400)

All semantic colors remain the same but with adjusted opacity for dark backgrounds.

---

## Spacing & Layout

### Layout Grid

**Desktop (>1024px)**
- 12-column grid
- Gutter: 24px
- Margin: 48px
- Max width: 1440px

**Tablet (768px - 1024px)**
- 8-column grid
- Gutter: 16px
- Margin: 32px

**Mobile (<768px)**
- 4-column grid
- Gutter: 16px
- Margin: 16px

### Container Widths

```css
--container-sm: 640px;   /* Small content */
--container-md: 768px;   /* Medium content */
--container-lg: 1024px;  /* Large content */
--container-xl: 1280px;  /* Extra large content */
--container-2xl: 1536px; /* Maximum width */
```

### Common Spacing Patterns

**Component Internal Spacing:**
- Buttons: `px-4 py-2` (16px × 8px)
- Input fields: `px-3 py-2` (12px × 8px)
- Cards: `p-6` (24px all sides)
- Modals: `p-8` (32px all sides)

**Component External Spacing:**
- Stacked elements: `space-y-4` (16px between)
- Grid items: `gap-6` (24px between)
- Sections: `space-y-12` (48px between)
- Page sections: `space-y-16` (64px between)

---

## Components

### Button Component

#### Variants

**Primary**
```css
background: var(--color-primary-600);
color: white;
padding: 0.5rem 1rem;
border-radius: var(--radius-default);
font-weight: 500;
transition: var(--transition-base);

&:hover {
  background: var(--color-primary-700);
}

&:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Secondary**
```css
background: var(--color-gray-100);
color: var(--color-gray-900);
border: 1px solid var(--color-gray-300);

&:hover {
  background: var(--color-gray-200);
}
```

**Destructive**
```css
background: var(--color-error);
color: white;

&:hover {
  background: var(--color-error-dark);
}
```

**Ghost**
```css
background: transparent;
color: var(--color-gray-700);

&:hover {
  background: var(--color-gray-100);
}
```

**Link**
```css
background: transparent;
color: var(--color-primary-600);
padding: 0;

&:hover {
  text-decoration: underline;
}
```

#### Sizes

- **xs:** `px-2 py-1 text-xs` (8px × 4px, 12px text)
- **sm:** `px-3 py-1.5 text-sm` (12px × 6px, 14px text)
- **md:** `px-4 py-2 text-base` (16px × 8px, 16px text) - Default
- **lg:** `px-6 py-3 text-lg` (24px × 12px, 18px text)
- **xl:** `px-8 py-4 text-xl` (32px × 16px, 20px text)

#### States

- **Default:** Standard appearance
- **Hover:** Slightly darker background
- **Active:** Even darker background, slightly scaled down
- **Focus:** Visible outline for keyboard navigation
- **Disabled:** Reduced opacity, no interaction
- **Loading:** Spinner icon, disabled interaction

### Input Component

#### Variants

**Text Input**
```css
border: 1px solid var(--color-gray-300);
border-radius: var(--radius-default);
padding: 0.5rem 0.75rem;
font-size: 1rem;
transition: var(--transition-base);

&:focus {
  border-color: var(--color-primary-500);
  outline: 2px solid var(--color-primary-500);
  outline-offset: 0;
}

&:error {
  border-color: var(--color-error);
}

&:disabled {
  background: var(--color-gray-50);
  cursor: not-allowed;
}
```

**Textarea**
- Same as text input
- Min height: 100px
- Resize: vertical

**Select**
- Same as text input
- Chevron down icon on right
- Custom dropdown styling

**Checkbox & Radio**
- 16px × 16px
- Border: 2px solid gray-300
- Checked: Primary color background
- Focus: Primary color outline

### Card Component

```css
background: white;
border: 1px solid var(--color-gray-200);
border-radius: var(--radius-lg);
padding: 1.5rem;
box-shadow: var(--shadow-sm);
transition: var(--transition-base);

&:hover {
  box-shadow: var(--shadow-md);
}
```

**Interactive Card (clickable):**
```css
cursor: pointer;

&:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Badge Component

```css
display: inline-flex;
padding: 0.125rem 0.625rem;
border-radius: var(--radius-full);
font-size: 0.75rem;
font-weight: 500;
```

**Variants:**
- **Default:** Gray background
- **Primary:** Primary color background
- **Success:** Green background
- **Warning:** Amber background
- **Error:** Red background

### Modal/Dialog Component

```css
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: white;
border-radius: var(--radius-xl);
padding: 2rem;
box-shadow: var(--shadow-2xl);
max-width: 32rem;
width: 90%;
z-index: var(--z-modal);
```

**Backdrop:**
```css
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.5);
z-index: var(--z-modal-backdrop);
```

### Table Component

```css
width: 100%;
border-collapse: separate;
border-spacing: 0;
```

**Table Header:**
```css
background: var(--color-gray-50);
border-bottom: 2px solid var(--color-gray-200);
padding: 0.75rem 1rem;
text-align: left;
font-weight: 600;
font-size: 0.875rem;
color: var(--color-gray-700);
```

**Table Cell:**
```css
padding: 0.75rem 1rem;
border-bottom: 1px solid var(--color-gray-200);
```

**Table Row Hover:**
```css
&:hover {
  background: var(--color-gray-50);
}
```

---

## Patterns

### Form Patterns

**Form Field Structure:**
```
<FormField>
  <Label>Field Label</Label>
  <Input />
  <HelperText>Optional helper text</HelperText>
  <ErrorMessage>Error message if invalid</ErrorMessage>
</FormField>
```

**Form Layout:**
- Single column for simple forms
- Two columns for complex forms (desktop only)
- Full width inputs on mobile
- Stacked labels above inputs
- 16px spacing between fields

### Loading States

**Skeleton Loaders:**
- Use animated gradient (shimmer effect)
- Match content dimensions
- Gray-200 background, gray-300 shimmer

**Spinners:**
- Primary color
- 24px diameter (default)
- Used for inline loading states

**Progress Bars:**
- 4px height
- Primary color fill
- Gray-200 background
- Show percentage when known

### Empty States

```
[Icon]
Empty State Title
Short description of why it's empty
[Call to Action Button]
```

**Guidelines:**
- Friendly, helpful tone
- Suggest next action
- Use appropriate icon
- Keep text concise

### Error States

**Form Validation:**
- Inline errors below fields
- Red text and red border on input
- Error icon (alert circle)
- Clear, actionable message

**Page Errors:**
- Full page error state
- Error code (404, 500, etc.)
- Friendly explanation
- Link back to safe location

---

## Accessibility

### Focus Management

**Focus Indicators:**
- 2px solid outline
- Primary color
- 2px offset from element
- Visible on all interactive elements

**Skip Links:**
- First focusable element
- Hidden until focused
- Jumps to main content

### Keyboard Navigation

**Requirements:**
- All interactive elements keyboard accessible
- Logical tab order
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys for lists/menus

### Screen Readers

**ARIA Labels:**
- All icon buttons have labels
- Complex widgets have appropriate roles
- Live regions for dynamic content
- Hidden decorative elements

### Color Contrast

**Minimum Ratios:**
- Normal text: 4.5:1
- Large text: 3:1
- UI components: 3:1

**Testing:**
- Test with color blindness simulators
- Verify in dark mode
- Use automated tools (Axe, Lighthouse)

---

## Responsive Design

### Breakpoints

```css
--screen-sm: 640px;    /* Mobile landscape */
--screen-md: 768px;    /* Tablet portrait */
--screen-lg: 1024px;   /* Tablet landscape */
--screen-xl: 1280px;   /* Desktop */
--screen-2xl: 1536px;  /* Large desktop */
```

### Mobile-First Approach

Design for mobile first, then enhance for larger screens:

1. **Mobile (<768px):**
   - Single column layouts
   - Stacked navigation
   - Full-width components
   - Touch-friendly targets (44px minimum)

2. **Tablet (768px - 1024px):**
   - Two-column layouts where appropriate
   - Side navigation possible
   - Increased whitespace

3. **Desktop (>1024px):**
   - Multi-column layouts
   - Persistent navigation
   - Rich interactions
   - Hover states

### Touch Targets

- Minimum: 44px × 44px
- Recommended: 48px × 48px
- Spacing: 8px between targets

---

## Usage Examples

### Button Usage

```tsx
// Primary action
<Button variant="primary" size="md">
  Save Document
</Button>

// Secondary action
<Button variant="secondary" size="md">
  Cancel
</Button>

// Destructive action
<Button variant="destructive" size="md">
  Delete Account
</Button>
```

### Card Usage

```tsx
<Card>
  <CardHeader>
    <CardTitle>Document Name</CardTitle>
    <CardDescription>Last updated: 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Document preview content...</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">View</Button>
    <Button variant="ghost" size="sm">Edit</Button>
  </CardFooter>
</Card>
```

### Form Usage

```tsx
<Form>
  <FormField>
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      required
    />
    <HelperText>We'll never share your email.</HelperText>
  </FormField>

  <FormField>
    <Label htmlFor="password">Password</Label>
    <Input
      id="password"
      type="password"
      required
    />
    {error && <ErrorMessage>{error}</ErrorMessage>}
  </FormField>

  <Button type="submit" variant="primary">
    Sign In
  </Button>
</Form>
```

---

## Component Checklist

When creating new components, ensure:

- [ ] Follows design token values
- [ ] Supports all defined variants
- [ ] Has all necessary states (hover, focus, disabled, etc.)
- [ ] Is keyboard accessible
- [ ] Has proper ARIA labels
- [ ] Is responsive (mobile, tablet, desktop)
- [ ] Supports dark mode
- [ ] Has proper TypeScript types
- [ ] Is documented with examples
- [ ] Has unit tests

---

## Design Resources

### Figma Libraries
- Component library: [Link to Figma]
- Icon library: Lucide React
- Design tokens: Documented in this file

### Development Resources
- Tailwind CSS config: `/tailwind.config.js`
- Component source: `/client/src/components/ui/`
- Radix UI docs: https://www.radix-ui.com/

---

## Maintenance

### Version History

- **v1.0.0** (Nov 25, 2025) - Initial design system documentation

### Contributing

When proposing design changes:
1. Document the change with rationale
2. Show before/after comparisons
3. Consider accessibility impact
4. Update this documentation
5. Get design review approval

---

**Design System maintained by:** CyberDocGen Team
**Last audit:** November 25, 2025
**Next review:** Quarterly
