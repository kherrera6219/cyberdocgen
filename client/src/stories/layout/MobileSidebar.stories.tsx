import type { Meta, StoryObj } from '@storybook/react';
import MobileSidebar from '../../components/layout/mobile-sidebar';

const meta = {
  title: 'App/layout/MobileSidebar',
  component: MobileSidebar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileSidebar>;

export default meta;
type Story = StoryObj<typeof MobileSidebar>;

export const Default: Story = {
  args: {} as any,
};
