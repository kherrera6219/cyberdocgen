import type { Meta, StoryObj } from '@storybook/react';
import { WebImportDialog } from '../components/evidence/WebImportDialog';
import { Button } from '../components/ui/button';
import { Globe } from 'lucide-react';

const meta: Meta<typeof WebImportDialog> = {
  title: 'Evidence/WebImportDialog',
  component: WebImportDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WebImportDialog>;

export const Default: Story = {
  args: {
    snapshotId: 'mock-snapshot-id',
  },
};

export const CustomTrigger: Story = {
  args: {
    snapshotId: 'mock-snapshot-id',
    trigger: (
        <Button variant="default" className="gap-2">
            <Globe className="w-4 h-4" />
            Custom Import Button
        </Button>
    )
  },
};

export const DisabledNoSnapshot: Story = {
  args: {
    snapshotId: null,
  },
};
