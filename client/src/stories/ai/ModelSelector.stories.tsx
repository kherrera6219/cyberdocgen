import type { Meta, StoryObj } from '@storybook/react';
import { ModelSelector } from '../../components/ai/ModelSelector';

const meta = {
  title: 'App/ai/ModelSelector',
  component: ModelSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModelSelector>;

export default meta;
type Story = StoryObj<typeof ModelSelector>;

export const Default: Story = {
  args: {} as any,
};
