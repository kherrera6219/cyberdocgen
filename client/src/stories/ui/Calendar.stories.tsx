import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '../../components/ui/calendar';

const meta = {
  title: 'App/ui/Calendar',
  component: Calendar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  args: {} as any,
};
