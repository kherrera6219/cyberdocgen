import type { Meta, StoryObj } from '@storybook/react';
import { ContextualHelp } from '../../components/help/ContextualHelp';

const meta = {
  title: 'App/help/ContextualHelp',
  component: ContextualHelp,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContextualHelp>;

export default meta;
type Story = StoryObj<typeof ContextualHelp>;

export const Default: Story = {
  args: {} as any,
};
