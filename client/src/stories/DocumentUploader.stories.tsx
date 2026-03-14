import type { Meta, StoryObj } from '@storybook/react';
import { DocumentUploader } from '../components/DocumentUploader';

const meta = {
  title: 'App/Uncategorized/DocumentUploader',
  component: DocumentUploader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentUploader>;

export default meta;
type Story = StoryObj<typeof DocumentUploader>;

export const Default: Story = {
  args: {} as any,
};
