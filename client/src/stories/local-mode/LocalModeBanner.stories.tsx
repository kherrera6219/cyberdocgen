import type { Meta, StoryObj } from '@storybook/react';
import { LocalModeBanner } from '../../components/local-mode/LocalModeBanner';

const meta = {
  title: 'App/local-mode/LocalModeBanner',
  component: LocalModeBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LocalModeBanner>;

export default meta;
type Story = StoryObj<typeof LocalModeBanner>;

export const Default: Story = {
  args: {} as any,
};
