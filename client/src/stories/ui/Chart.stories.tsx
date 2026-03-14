import type { Meta, StoryObj } from '@storybook/react';
import { Chart } from '../../components/ui/chart';

const meta = {
  title: 'App/ui/Chart',
  component: Chart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof Chart>;

export const Default: Story = {
  args: {} as any,
};
