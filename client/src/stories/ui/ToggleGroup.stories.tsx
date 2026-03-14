import type { Meta, StoryObj } from '@storybook/react';
import { ToggleGroup } from '../../components/ui/toggle-group';

const meta = {
  title: 'App/ui/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  args: {} as any,
};
