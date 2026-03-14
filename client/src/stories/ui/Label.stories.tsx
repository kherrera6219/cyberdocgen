import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../../components/ui/label';

const meta = {
  title: 'App/ui/Label',
  component: Label,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {} as any,
};
