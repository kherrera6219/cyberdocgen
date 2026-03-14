import type { Meta, StoryObj } from '@storybook/react';
import { GenerationCustomizer } from '../../components/generation/GenerationCustomizer';

const meta = {
  title: 'App/generation/GenerationCustomizer',
  component: GenerationCustomizer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GenerationCustomizer>;

export default meta;
type Story = StoryObj<typeof GenerationCustomizer>;

export const Default: Story = {
  args: {} as any,
};
