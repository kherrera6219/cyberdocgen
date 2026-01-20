import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Label } from '../components/ui/label';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};

export const Required: Story = {
  args: {
    children: 'Email *',
    className: 'text-destructive',
  },
};
