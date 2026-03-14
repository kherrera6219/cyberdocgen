import type { Meta, StoryObj } from '@storybook/react';
import MobileNavigation from '../../components/layout/mobile-navigation';

const meta = {
  title: 'App/layout/MobileNavigation',
  component: MobileNavigation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileNavigation>;

export default meta;
type Story = StoryObj<typeof MobileNavigation>;

export const Default: Story = {
  args: {} as any,
};
