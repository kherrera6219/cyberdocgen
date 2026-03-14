import type { Meta, StoryObj } from '@storybook/react';
import { Form } from '../../components/ui/form';

const meta = {
  title: 'App/ui/Form',
  component: Form,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  args: {} as any,
};
