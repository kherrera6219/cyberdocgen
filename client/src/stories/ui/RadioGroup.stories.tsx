import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from '../../components/ui/radio-group';

const meta = {
  title: 'App/ui/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {} as any,
};
