import type { Meta, StoryObj } from '@storybook/react';
import { PreferencesForm } from '../../components/profile/PreferencesForm';

const meta = {
  title: 'App/profile/PreferencesForm',
  component: PreferencesForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PreferencesForm>;

export default meta;
type Story = StoryObj<typeof PreferencesForm>;

export const Default: Story = {
  args: {} as any,
};
