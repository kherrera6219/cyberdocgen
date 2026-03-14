import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '../../components/ui/slider';

const meta = {
  title: 'App/ui/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {} as any,
};
