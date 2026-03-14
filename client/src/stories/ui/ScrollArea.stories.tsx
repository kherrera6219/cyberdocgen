import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from '../../components/ui/scroll-area';

const meta = {
  title: 'App/ui/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  args: {} as any,
};
