import type { Meta, StoryObj } from '@storybook/react';
import { PublicHeader } from '../../components/layout/PublicHeader';

const meta = {
  title: 'App/layout/PublicHeader',
  component: PublicHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PublicHeader>;

export default meta;
type Story = StoryObj<typeof PublicHeader>;

export const Default: Story = {
  args: {} as any,
};
