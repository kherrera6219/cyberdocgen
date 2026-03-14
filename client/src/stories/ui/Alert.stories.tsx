import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../../components/ui/alert';

const meta = {
  title: 'App/ui/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {} as any,
};
