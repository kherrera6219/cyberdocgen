# Client Frontend Documentation

This directory contains the React frontend application for CyberDocGen.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Key Technologies](#key-technologies)
- [Pages](#pages)
- [Components](#components)
- [State Management](#state-management)
- [Routing](#routing)
- [Styling](#styling)
- [Development](#development)

## Overview

The frontend is a modern React 18 application built with TypeScript, utilizing Vite for fast development and building. It provides a comprehensive UI for enterprise compliance management with features including document generation, gap analysis, audit trails, and multi-factor authentication.

### Key Features

- **AI-Powered Document Generation** - Interactive document workspace with AI assistance
- **Compliance Management** - Gap analysis, risk assessment, and compliance tracking
- **Enterprise Features** - Organization management, user roles, audit trails
- **Cloud Integrations** - Google Drive and Microsoft OneDrive support
- **Security** - Multi-factor authentication, secure sessions
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS

## Architecture

### Technology Stack

- **React 18.3.1** - UI framework with concurrent features
- **TypeScript 5.9** - Type safety and developer experience
- **Vite 6.4** - Fast build tool with HMR
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack React Query** - Server state management
- **Wouter** - Lightweight routing
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Design Patterns

- **Component-Based Architecture** - Reusable, composable components
- **Container/Presentation Pattern** - Separation of logic and UI
- **Custom Hooks** - Shared logic extraction
- **Error Boundaries** - Graceful error handling
- **Lazy Loading** - Code splitting for performance

## Directory Structure

```
client/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles
│   │
│   ├── pages/                # Page components (21 pages)
│   │   ├── dashboard.tsx             # Main dashboard
│   │   ├── document-workspace.tsx    # Document editor
│   │   ├── gap-analysis.tsx          # Compliance gap analysis
│   │   ├── company-profile.tsx       # Organization profile
│   │   ├── audit-trail.tsx           # Audit logging
│   │   ├── cloud-integrations.tsx    # Cloud storage
│   │   ├── mfa-setup.tsx             # MFA configuration
│   │   ├── admin-settings.tsx        # Admin panel
│   │   ├── enterprise-signup.tsx     # Registration
│   │   ├── login.tsx                 # Authentication
│   │   ├── document-generation.tsx   # AI generation
│   │   ├── risk-assessment.tsx       # Risk analysis
│   │   ├── quality-scoring.tsx       # Document quality
│   │   ├── user-management.tsx       # User admin
│   │   ├── organization-setup.tsx    # Org configuration
│   │   ├── settings.tsx              # User settings
│   │   ├── documents.tsx             # Document list
│   │   ├── profile.tsx               # User profile
│   │   ├── templates.tsx             # Document templates
│   │   ├── reports.tsx               # Reporting
│   │   └── notifications.tsx         # Notifications
│   │
│   ├── components/           # Reusable components (80+)
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (30+ more)
│   │   │
│   │   ├── ai/               # AI-powered components
│   │   │   ├── ComplianceChatbot.tsx
│   │   │   ├── DocumentAnalyzer.tsx
│   │   │   ├── AIInsights.tsx
│   │   │   └── FineTuningService.tsx
│   │   │
│   │   ├── auth/             # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── MFASetup.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── collaboration/    # Collaboration features
│   │   │   ├── DocumentComments.tsx
│   │   │   └── CommentThread.tsx
│   │   │
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── generation/       # Document generation
│   │   │   ├── GenerationForm.tsx
│   │   │   ├── GenerationProgress.tsx
│   │   │   └── GenerationResults.tsx
│   │   │
│   │   └── templates/        # Document templates
│   │       └── TemplateSelector.tsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-auth.tsx              # Authentication hook
│   │   ├── use-local-storage.tsx     # Local storage hook
│   │   ├── use-mobile.tsx            # Mobile detection
│   │   └── use-toast.tsx             # Toast notifications
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── queryClient.ts            # React Query config
│   │   ├── serviceWorker.ts          # PWA support
│   │   └── utils.ts                  # General utilities
│   │
│   └── styles/               # Styling
│       └── globals.css               # Global CSS
│
├── public/                   # Static assets
│   ├── favicon.ico
│   └── ...
│
└── index.html                # HTML template
```

## Key Technologies

### React Query (TanStack Query)

Used for server state management, caching, and data fetching:

```typescript
// Example: Fetching documents
const { data, isLoading, error } = useQuery({
  queryKey: ['documents'],
  queryFn: async () => {
    const response = await fetch('/api/documents');
    return response.json();
  }
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

### React Hook Form + Zod

Form handling with schema validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

### Radix UI

Accessible, unstyled component primitives:

- Dialog
- Dropdown Menu
- Select
- Tabs
- Tooltip
- Accordion
- And 20+ more

### Tailwind CSS

Utility-first CSS framework:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

## Pages

### Dashboard (`dashboard.tsx`)

Main landing page showing:
- Organization overview
- Recent documents
- Compliance status
- Quick actions

### Document Workspace (`document-workspace.tsx`)

Document editor with:
- Rich text editing
- Real-time collaboration
- Version history
- Comments and annotations
- AI assistance

### Gap Analysis (`gap-analysis.tsx`)

Compliance gap analysis showing:
- Missing controls
- Compliance percentage
- Recommendations
- Framework comparison

### Company Profile (`company-profile.tsx`)

Organization information:
- Company details
- Compliance frameworks
- Industry information
- Contact information

### Audit Trail (`audit-trail.tsx`)

Audit log viewer:
- User actions
- Document changes
- System events
- Compliance logs

### Cloud Integrations (`cloud-integrations.tsx`)

Cloud storage connections:
- Google Drive integration
- Microsoft OneDrive integration
- File synchronization
- Access management

### MFA Setup (`mfa-setup.tsx`)

Multi-factor authentication:
- QR code generation
- TOTP verification
- Backup codes
- Device management

### Admin Settings (`admin-settings.tsx`)

Administrative controls:
- User management
- Organization settings
- Security configuration
- System settings

## Components

### UI Components (`components/ui/`)

Base components built on Radix UI:

- **Button** - Various styles and sizes
- **Input** - Text inputs with validation
- **Card** - Content containers
- **Dialog** - Modal dialogs
- **Form** - Form components
- **Select** - Dropdown selects
- **Table** - Data tables
- **Toast** - Notifications

### AI Components (`components/ai/`)

AI-powered features:

- **ComplianceChatbot** - Interactive AI assistant
- **DocumentAnalyzer** - Document analysis
- **AIInsights** - AI-generated insights
- **FineTuningService** - Model fine-tuning

### Auth Components (`components/auth/`)

Authentication features:

- **LoginForm** - User login
- **SignupForm** - User registration
- **MFASetup** - MFA configuration
- **ProtectedRoute** - Route protection

## State Management

### Server State (React Query)

All server data managed with React Query:

```typescript
// queries.ts
export const documentQueries = {
  all: () => ['documents'] as const,
  lists: () => [...documentQueries.all(), 'list'] as const,
  list: (filters: Filters) => [...documentQueries.lists(), filters] as const,
  details: () => [...documentQueries.all(), 'detail'] as const,
  detail: (id: string) => [...documentQueries.details(), id] as const,
};
```

### Client State

Minimal client state using:
- React hooks (useState, useReducer)
- Local storage hook
- Context API for global state

### Authentication State

Auth state managed via custom hook:

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

## Routing

Using Wouter for lightweight routing:

```typescript
import { Route, Switch } from 'wouter';

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/:id" component={DocumentWorkspace} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### Protected Routes

```typescript
<ProtectedRoute path="/admin" component={AdminSettings} />
```

## Styling

### Tailwind Configuration

Custom theme in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... custom colors
      }
    }
  }
}
```

### CSS Variables

Theme colors defined in `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more variables */
}
```

### Responsive Design

Mobile-first approach:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## Development

### Running Development Server

```bash
npm run dev
```

Access at `http://localhost:5000`

### Building for Production

```bash
npm run build
```

Output to `dist/public/`

### Type Checking

```bash
npm run check
```

### Code Quality

```bash
# Linting
npx eslint client/src

# Formatting
npx prettier --write client/src
```

### Adding New Components

1. **Create component file:**
   ```bash
   touch client/src/components/MyComponent.tsx
   ```

2. **Write component:**
   ```typescript
   export function MyComponent() {
     return <div>My Component</div>;
   }
   ```

3. **Export from index (if needed):**
   ```typescript
   export { MyComponent } from './MyComponent';
   ```

### Adding New Pages

1. **Create page file:**
   ```bash
   touch client/src/pages/my-page.tsx
   ```

2. **Add route in App.tsx:**
   ```typescript
   <Route path="/my-page" component={MyPage} />
   ```

### Custom Hooks

Create reusable hooks in `hooks/`:

```typescript
// hooks/use-feature.tsx
export function useFeature() {
  const [state, setState] = useState();

  // Hook logic

  return { state, setState };
}
```

## Best Practices

### Component Structure

```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
  onSave: () => void;
}

// Component
export function MyComponent({ title, onSave }: Props) {
  // Hooks
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleClick = () => {
    setIsLoading(true);
    onSave();
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={isLoading}>
        Save
      </Button>
    </div>
  );
}
```

### Performance Optimization

- Use `React.memo` for expensive components
- Implement code splitting with lazy loading
- Optimize images and assets
- Use pagination for large lists
- Debounce search inputs

### Accessibility

- Use semantic HTML
- Provide ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast

### Error Handling

- Use error boundaries
- Show user-friendly error messages
- Log errors for debugging
- Provide recovery options

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [TanStack Query](https://tanstack.com/query)

---

For more information, see the main [README.md](../README.md) and [DEVELOPMENT_GUIDE.md](../docs/DEVELOPMENT_GUIDE.md).
