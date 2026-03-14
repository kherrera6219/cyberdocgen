import type { Meta, StoryObj } from '@storybook/react';
import { ProgressModal } from '../../components/ui/progress-modal';

const meta = {
  title: 'App/ui/ProgressModal',
  component: ProgressModal,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressModal>;

export default meta;
type Story = StoryObj<typeof ProgressModal>;

export const Default: Story = {
  args: {} as any,
};
