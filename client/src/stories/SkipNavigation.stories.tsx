import type { Meta, StoryObj } from '@storybook/react';
import { SkipNavigation } from '../components/SkipNavigation';

const meta = {
  title: 'App/Uncategorized/SkipNavigation',
  component: SkipNavigation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SkipNavigation>;

export default meta;
type Story = StoryObj<typeof SkipNavigation>;

export const Default: Story = {
  args: {} as any,
};
