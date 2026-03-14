import type { Meta, StoryObj } from '@storybook/react';
import { GlobalSearch } from '../../components/navigation/GlobalSearch';

const meta = {
  title: 'App/navigation/GlobalSearch',
  component: GlobalSearch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalSearch>;

export default meta;
type Story = StoryObj<typeof GlobalSearch>;

export const Default: Story = {
  args: {} as any,
};
