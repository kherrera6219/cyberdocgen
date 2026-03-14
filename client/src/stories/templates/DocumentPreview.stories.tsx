import type { Meta, StoryObj } from '@storybook/react';
import { DocumentPreview } from '../../components/templates/document-preview';

const meta = {
  title: 'App/templates/DocumentPreview',
  component: DocumentPreview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentPreview>;

export default meta;
type Story = StoryObj<typeof DocumentPreview>;

export const Default: Story = {
  args: {} as any,
};
