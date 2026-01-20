import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Input } from '../components/ui/input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'date', 'file'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Email',
  },
};

export const File: Story = {
  args: {
    type: 'file',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Pre-filled value',
  },
};
