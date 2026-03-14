import type { Meta, StoryObj } from '@storybook/react';
import { ProfileForm } from '../../components/profile/ProfileForm';

const meta = {
  title: 'App/profile/ProfileForm',
  component: ProfileForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProfileForm>;

export default meta;
type Story = StoryObj<typeof ProfileForm>;

export const Default: Story = {
  args: {} as any,
};
