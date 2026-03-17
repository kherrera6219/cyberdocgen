import type { Meta, StoryObj } from '@storybook/react';
import { LoadingCard, ErrorCard, EmptyStateCard } from '../components/ui/loading-error-states';
import { FileWarning } from 'lucide-react';

const meta = {
  title: 'UI/LoadingErrorStates',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingState: StoryObj<typeof LoadingCard> = {
  render: (args) => <LoadingCard {...args} />,
  args: {
    title: 'Loading Data...',
  },
};

export const LoadingStateNoTitle: StoryObj<typeof LoadingCard> = {
  render: (args) => <LoadingCard {...args} />,
  args: {},
};

export const ErrorState: StoryObj<typeof ErrorCard> = {
  render: (args) => <ErrorCard {...args} />,
  args: {
    title: 'Connection Failed',
    message: 'We could not connect to the server to fetch your documents.',
    onRetry: () => alert('Retry clicked'),
  },
};

export const ErrorStateNoRetry: StoryObj<typeof ErrorCard> = {
  render: (args) => <ErrorCard {...args} />,
  args: {
    title: 'Access Denied',
    message: 'You do not have permission to view this resource.',
  },
};

export const EmptyState: StoryObj<typeof EmptyStateCard> = {
  render: (args) => <EmptyStateCard {...args} />,
  args: {
    title: 'No Documents Found',
    message: 'You haven\'t uploaded any compliance documents yet.',
    action: {
      label: 'Upload Document',
      onClick: () => alert('Upload clicked'),
    },
  },
};

export const EmptyStateCustomIcon: StoryObj<typeof EmptyStateCard> = {
  render: (args) => <EmptyStateCard {...args} />,
  args: {
    title: 'No Security Warnings',
    message: 'All your configurations look secure.',
    icon: <FileWarning className="h-6 w-6 text-yellow-500" />,
  },
};
