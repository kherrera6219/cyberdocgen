import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';

const meta = {
  title: 'App/navigation/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {} as any,
};
