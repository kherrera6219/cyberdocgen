import type { Meta, StoryObj } from '@storybook/react';
import { WebImportDialog } from '../../components/evidence/WebImportDialog';

const meta = {
  title: 'App/evidence/WebImportDialog',
  component: WebImportDialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WebImportDialog>;

export default meta;
type Story = StoryObj<typeof WebImportDialog>;

export const Default: Story = {
  args: {} as any,
};
