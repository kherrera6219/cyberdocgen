import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '../../components/ui/sheet';

const meta = {
  title: 'App/ui/Sheet',
  component: Sheet,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  args: {} as any,
};
