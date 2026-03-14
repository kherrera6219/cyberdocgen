import type { Meta, StoryObj } from '@storybook/react';
import { GenerationProgressDialog } from '../../components/dashboard/GenerationProgressDialog';

const meta = {
  title: 'App/dashboard/GenerationProgressDialog',
  component: GenerationProgressDialog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GenerationProgressDialog>;

export default meta;
type Story = StoryObj<typeof GenerationProgressDialog>;

export const Default: Story = {
  args: {} as any,
};
