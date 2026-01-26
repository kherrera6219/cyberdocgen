import type { Meta, StoryObj } from '@storybook/react';
import { FindingsTable } from '../components/repository/FindingsTable';

const meta = {
  title: 'Repository/FindingsTable',
  component: FindingsTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FindingsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFindings = [
  {
    id: '1',
    controlId: 'CC6.1',
    framework: 'SOC2',
    status: 'partial' as const,
    confidenceLevel: 'high' as const,
    summary: 'JWT authentication detected',
    signalType: 'authentication_jwt',
    evidenceReferences: [
      {
        filePath: 'server/middleware/auth.ts',
        lineStart: 42,
        lineEnd: 45,
        snippet: 'jwt.verify(token, secret)',
      },
      {
        filePath: 'server/routes/auth.ts',
        lineStart: 23,
        lineEnd: 27,
        snippet: 'const token = jwt.sign({ userId }, JWT_SECRET)',
      },
    ],
    recommendation: 'Verify JWT tokens use strong signing algorithms (HS256+ or RS256), include expiration, and are properly validated on all endpoints',
    createdAt: '2026-01-19T10:30:00Z',
  },
  {
    id: '2',
    controlId: 'CC6.6',
    framework: 'SOC2',
    status: 'fail' as const,
    confidenceLevel: 'high' as const,
    summary: 'No encryption at rest detected',
    signalType: 'encryption_at_rest',
    evidenceReferences: [],
    recommendation: 'Implement encryption for sensitive data at rest using AES-256 or stronger encryption',
    createdAt: '2026-01-19T10:31:00Z',
  },
  {
    id: '3',
    controlId: 'CC7.2',
    framework: 'SOC2',
    status: 'pass' as const,
    confidenceLevel: 'high' as const,
    summary: 'Structured logging implementation detected',
    signalType: 'logging_structured',
    evidenceReferences: [
      {
        filePath: 'server/utils/logger.ts',
        lineStart: 5,
        lineEnd: 10,
        snippet: 'import winston from "winston";\nconst logger = winston.createLogger({...})',
      },
    ],
    recommendation: 'Continue using winston for structured logging. Verify log retention policy is documented.',
    createdAt: '2026-01-19T10:32:00Z',
  },
  {
    id: '4',
    controlId: 'A.9.4.1',
    framework: 'ISO27001',
    status: 'partial' as const,
    confidenceLevel: 'medium' as const,
    summary: 'RBAC implementation detected',
    signalType: 'access_control_rbac',
    evidenceReferences: [
      {
        filePath: 'server/middleware/permissions.ts',
        lineStart: 12,
        lineEnd: 18,
        snippet: 'function hasRole(user, role) {\n  return user.roles.includes(role);\n}',
      },
    ],
    recommendation: 'Document access control matrix and verify least privilege principle is enforced',
    createdAt: '2026-01-19T10:33:00Z',
  },
  {
    id: '5',
    controlId: 'IA-2',
    framework: 'NIST80053',
    status: 'needs_human' as const,
    confidenceLevel: 'low' as const,
    summary: 'Authentication mechanism requires verification',
    signalType: 'authentication_unknown',
    evidenceReferences: [
      {
        filePath: 'server/auth/custom.ts',
        snippet: 'Custom authentication implementation',
      },
    ],
    recommendation: 'Manual review required to verify authentication meets NIST requirements',
    createdAt: '2026-01-19T10:34:00Z',
  },
];

export const Default: Story = {
  args: {
    findings: mockFindings,
    onReviewFinding: (id) => console.log('Review finding:', id),
  },
};

export const Empty: Story = {
  args: {
    findings: [],
  },
};

export const OnlyFailures: Story = {
  args: {
    findings: mockFindings.filter((f) => f.status === 'fail'),
    onReviewFinding: (id) => console.log('Review finding:', id),
  },
};

export const Mixed: Story = {
  args: {
    findings: mockFindings,
  },
};
