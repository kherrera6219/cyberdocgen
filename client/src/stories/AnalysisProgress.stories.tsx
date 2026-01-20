import type { Meta, StoryObj } from '@storybook/react';
import { AnalysisProgress } from '../src/components/repository/AnalysisProgress';

const meta = {
  title: 'Repository/AnalysisProgress',
  component: AnalysisProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnalysisProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

const phases = [
  {
    name: 'Repository Overview',
    description: 'Extract system description and architecture',
    status: 'completed' as const,
  },
  {
    name: 'Build & CI/CD',
    description: 'Analyze build process and deployment pipeline',
    status: 'completed' as const,
  },
  {
    name: 'Configuration & Secrets',
    description: 'Review configuration management and secrets handling',
    status: 'running' as const,
  },
  {
    name: 'Authentication & Authorization',
    description: 'Analyze access controls and user management',
    status: 'pending' as const,
  },
  {
    name: 'Data Handling',
    description: 'Review data encryption and protection',
    status: 'pending' as const,
  },
  {
    name: 'Operational Controls',
    description: 'Check logging, monitoring, and backups',
    status: 'pending' as const,
  },
  {
    name: 'Gap Identification',
    description: 'Identify missing or partial controls',
    status: 'pending' as const,
  },
];

export const InProgress: Story = {
  args: {
    phases,
    currentPhase: 'Configuration & Secrets',
    progress: 43,
    metrics: {
      filesAnalyzed: 1234,
      findingsGenerated: 12,
      llmCallsMade: 5,
      tokensUsed: 45000,
    },
  },
  render: (args) => (
    <div className="w-[700px]">
      <AnalysisProgress {...args} />
    </div>
  ),
};

export const JustStarted: Story = {
  args: {
    phases: phases.map((p, i) => ({
      ...p,
      status: i === 0 ? 'running' : 'pending',
    })) as any,
    currentPhase: 'Repository Overview',
    progress: 7,
    metrics: {
      filesAnalyzed: 45,
      findingsGenerated: 0,
    },
  },
  render: (args) => (
    <div className="w-[700px]">
      <AnalysisProgress {...args} />
    </div>
  ),
};

export const NearlyComplete: Story = {
  args: {
    phases: phases.map((p, i) => ({
      ...p,
      status: i < 6 ? 'completed' : 'running',
    })) as any,
    currentPhase: 'Gap Identification',
    progress: 93,
    metrics: {
      filesAnalyzed: 2456,
      findingsGenerated: 67,
      llmCallsMade: 34,
      tokensUsed: 234000,
    },
  },
  render: (args) => (
    <div className="w-[700px]">
      <AnalysisProgress {...args} />
    </div>
  ),
};

export const WithFailure: Story = {
  args: {
    phases: [
      ...phases.slice(0, 3).map((p) => ({ ...p, status: 'completed' as const })),
      { ...phases[3], status: 'failed' as const },
      ...phases.slice(4).map((p) => ({ ...p, status: 'pending' as const })),
    ],
    currentPhase: 'Authentication & Authorization',
    progress: 43,
    metrics: {
      filesAnalyzed: 987,
      findingsGenerated: 18,
    },
  },
  render: (args) => (
    <div className="w-[700px]">
      <AnalysisProgress {...args} />
    </div>
  ),
};
