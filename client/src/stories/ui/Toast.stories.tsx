import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '../../components/ui/toast';

const meta = {
  title: 'App/ui/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: {} as any,
};
