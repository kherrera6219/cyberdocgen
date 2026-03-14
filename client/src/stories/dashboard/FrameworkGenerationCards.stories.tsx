import type { Meta, StoryObj } from '@storybook/react';
import { FrameworkGenerationCards } from '../../components/dashboard/FrameworkGenerationCards';

const meta = {
  title: 'App/dashboard/FrameworkGenerationCards',
  component: FrameworkGenerationCards,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FrameworkGenerationCards>;

export default meta;
type Story = StoryObj<typeof FrameworkGenerationCards>;

export const Default: Story = {
  args: {} as any,
};
