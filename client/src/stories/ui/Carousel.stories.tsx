import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from '../../components/ui/carousel';

const meta = {
  title: 'App/ui/Carousel',
  component: Carousel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  args: {} as any,
};
