import type { Meta, StoryObj } from '@storybook/react';
import { UploadDialog } from '../../components/storage/UploadDialog';

const meta = {
  title: 'App/storage/UploadDialog',
  component: UploadDialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UploadDialog>;

export default meta;
type Story = StoryObj<typeof UploadDialog>;

export const Default: Story = {
  args: {} as any,
};
