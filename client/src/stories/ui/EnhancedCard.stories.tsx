import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedCard } from '../../components/ui/enhanced-card';

const meta = {
  title: 'App/ui/EnhancedCard',
  component: EnhancedCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EnhancedCard>;

export default meta;
type Story = StoryObj<typeof EnhancedCard>;

export const Default: Story = {
  args: {} as any,
};
