import type { Meta, StoryObj } from '@storybook/react';
import { LoadingErrorStates } from '../../components/ui/loading-error-states';

const meta = {
  title: 'App/ui/LoadingErrorStates',
  component: LoadingErrorStates,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingErrorStates>;

export default meta;
type Story = StoryObj<typeof LoadingErrorStates>;

export const Default: Story = {
  args: {} as any,
};
