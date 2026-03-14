import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../../components/ui/card';

const meta = {
  title: 'App/ui/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {} as any,
};
