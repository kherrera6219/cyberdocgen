import type { Meta, StoryObj } from '@storybook/react';
import { RepositoryList } from '../src/components/repository/RepositoryList';

const meta = {
  title: 'Repository/RepositoryList',
  component: RepositoryList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RepositoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockRepositories = [
  {
    id: '1',
    name: 'CyberDocGen Main App',
    status: 'completed' as const,
    uploadedFileName: 'cyberdocgen-main.zip',
    fileCount: 2456,
    repositorySize: 45 * 1024 * 1024,
    detectedLanguages: ['TypeScript', 'JavaScript', 'Python'],
    detectedFrameworks: ['React', 'Express', 'Drizzle ORM', 'shadcn/ui'],
    createdAt: '2026-01-19T10:00:00Z',
    organizationId: 'org-1',
  },
  {
    id: '2',
    name: 'Authentication Service',
    status: 'analyzing' as const,
    uploadedFileName: 'auth-service.zip',
    fileCount: 234,
    repositorySize: 8 * 1024 * 1024,
    detectedLanguages: ['TypeScript', 'JavaScript'],
    detectedFrameworks: ['Passport.js', 'JWT'],
    analysisPhase: 'Authentication & Authorization',
    createdAt: '2026-01-19T11:30:00Z',
    organizationId: 'org-1',
  },
  {
    id: '3',
    name: 'Payment Gateway',
    status: 'indexed' as const,
    uploadedFileName: 'payment-gateway.zip',
    fileCount: 567,
    repositorySize: 12 * 1024 * 1024,
    detectedLanguages: ['Python', 'JavaScript'],
    detectedFrameworks: ['FastAPI', 'Stripe SDK'],
    createdAt: '2026-01-18T14:20:00Z',
    organizationId: 'org-1',
  },
  {
    id: '4',
    name: 'Legacy Monolith',
    status: 'failed' as const,
    uploadedFileName: 'legacy-app.zip',
    fileCount: 156,
    repositorySize: 3 * 1024 * 1024,
    detectedLanguages: ['PHP', 'JavaScript'],
    detectedFrameworks: [],
    createdAt: '2026-01-17T09:15:00Z',
    organizationId: 'org-1',
  },
];

export const Default: Story = {
  args: {
    repositories: mockRepositories,
    onSelect: (repo) => console.log('Selected:', repo.name),
    onDelete: (id) => console.log('Delete:', id),
    onAnalyze: (id) => console.log('Analyze:', id),
  },
};

export const Empty: Story = {
  args: {
    repositories: [],
  },
};

export const OnlyCompleted: Story = {
  args: {
    repositories: mockRepositories.filter((r) => r.status === 'completed'),
    onSelect: (repo) => console.log('Selected:', repo.name),
  },
};

export const Loading: Story = {
  args: {
    repositories: mockRepositories.filter((r) => r.status === 'analyzing' || r.status === 'extracting'),
    onSelect: (repo) => console.log('Selected:', repo.name),
  },
};
