import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../components/ui/button';

const meta = {
  title: 'App/ui/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {} as any,
};
