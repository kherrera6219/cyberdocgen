import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '../components/IconButton';
import { Plus, Trash2, X, Download, Settings } from 'lucide-react';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Plus,
    'aria-label': 'Add item',
  },
};

export const Primary: Story = {
  args: {
    icon: Download,
    variant: 'primary',
    'aria-label': 'Download',
  },
};

export const Destructive: Story = {
  args: {
    icon: Trash2,
    variant: 'destructive',
    'aria-label': 'Delete item',
  },
};

export const Loading: Story = {
  args: {
    icon: Settings,
    isLoading: true,
    'aria-label': 'Settings',
  },
};

export const Sizes: Story = {
  args: {
    'aria-label': 'Sizes Example',
    icon: X,
  },
  render: () => (
    <div className="flex gap-4 items-center">
      <IconButton icon={X} size="sm" aria-label="Small" />
      <IconButton icon={X} size="md" aria-label="Medium" />
      <IconButton icon={X} size="lg" aria-label="Large" />
    </div>
  ),
};
