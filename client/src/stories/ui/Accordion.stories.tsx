import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from '../../components/ui/accordion';

const meta = {
  title: 'App/ui/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {} as any,
};
