import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../../components/ui/input';

const meta = {
  title: 'App/ui/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {} as any,
};
