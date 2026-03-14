import type { Meta, StoryObj } from '@storybook/react';
import { VisuallyHidden } from '../../components/ui/visually-hidden';

const meta = {
  title: 'App/ui/VisuallyHidden',
  component: VisuallyHidden,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

export const Default: Story = {
  args: {} as any,
};
