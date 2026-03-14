import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../../components/ui/select';

const meta = {
  title: 'App/ui/Select',
  component: Select,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {} as any,
};
