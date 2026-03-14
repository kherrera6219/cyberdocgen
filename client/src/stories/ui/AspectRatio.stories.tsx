import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from '../../components/ui/aspect-ratio';

const meta = {
  title: 'App/ui/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  args: {} as any,
};
