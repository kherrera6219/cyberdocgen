import type { Meta, StoryObj } from '@storybook/react';
import { TaskBoard } from '../components/repository/TaskBoard';

const meta = {
  title: 'Repository/TaskBoard',
  component: TaskBoard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TaskBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTasks = [
  {
    id: '1',
    title: '❌ Fix: CC6.6 - Encryption at Rest',
    description: 'Implement encryption for sensitive data at rest using AES-256 or stronger encryption. No encryption implementation detected in codebase.',
    category: 'code_change' as const,
    priority: 'critical' as const,
    status: 'open' as const,
    findingId: 'finding-2',
    assignedToRole: 'developer',
    createdAt: '2026-01-19T10:30:00Z',
  },
  {
    id: '2',
    title: '⚠️ Review: CC6.1 - JWT Authentication',
    description: 'Verify JWT tokens use strong signing algorithms (HS256+ or RS256), include expiration, and are properly validated on all endpoints',
    category: 'code_change' as const,
    priority: 'high' as const,
    status: 'in_progress' as const,
    findingId: 'finding-1',
    dueDate: '2026-01-25T00:00:00Z',
    createdAt: '2026-01-19T10:31:00Z',
  },
  {
    id: '3',
    title: '📋 Document: Logging Retention Policy',
    description: 'Document log retention policy and ensure logs are protected from tampering per A.12.4.1 requirements',
    category: 'policy_needed' as const,
    priority: 'medium' as const,
    status: 'open' as const,
    assignedToRole: 'compliance',
    createdAt: '2026-01-19T10:32:00Z',
  },
  {
    id: '4',
    title: '✅ Verify: Access Control Matrix',
    description: 'Document access control matrix and verify least privilege principle is enforced',
    category: 'missing_evidence' as const,
    priority: 'medium' as const,
    status: 'completed' as const,
    createdAt: '2026-01-19T10:33:00Z',
  },
  {
    id: '5',
    title: '🔒 Implement: MFA for Admin Access',
    description: 'Enforce multi-factor authentication for all privileged users and admin access per IA-2(1) requirements',
    category: 'code_change' as const,
    priority: 'high' as const,
    status: 'in_progress' as const,
    dueDate: '2026-01-22T00:00:00Z',
    createdAt: '2026-01-19T10:34:00Z',
  },
  {
    id: '6',
    title: '📄 Create: Change Management Procedure',
    description: 'Formalize change control procedures with approval gates and testing requirements per A.14.2.2',
    category: 'procedure_needed' as const,
    priority: 'low' as const,
    status: 'open' as const,
    createdAt: '2026-01-19T10:35:00Z',
  },
];

export const Default: Story = {
  args: {
    tasks: mockTasks,
    onTaskClick: (task) => console.log('Task clicked:', task.id),
    onTaskStatusChange: (id, status) => console.log('Task status changed:', id, status),
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
  },
};

export const OnlyCritical: Story = {
  args: {
    tasks: mockTasks.filter((t) => t.priority === 'critical'),
    onTaskClick: (task) => console.log('Task clicked:', task.id),
    onTaskStatusChange: (id, status) => console.log('Task status changed:', id, status),
  },
};

export const InProgress: Story = {
  args: {
    tasks: mockTasks.filter((t) => t.status === 'in_progress'),
    onTaskClick: (task) => console.log('Task clicked:', task.id),
    onTaskStatusChange: (id, status) => console.log('Task status changed:', id, status),
  },
};
