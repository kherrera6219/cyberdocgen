import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../../components/ui/textarea';

const meta = {
  title: 'App/ui/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {} as any,
};
