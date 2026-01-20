import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Toggle } from '../components/ui/toggle';
import { Bold, Italic, Underline } from 'lucide-react';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    pressed: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-label': 'Toggle italic',
    children: <Bold className="h-4 w-4" />,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    'aria-label': 'Toggle italic',
    children: <Italic className="h-4 w-4" />,
  },
};

export const WithText: Story = {
  args: {
    'aria-label': 'Toggle italic',
    children: (
      <>
        <Italic className="mr-2 h-4 w-4" />
        Italic
      </>
    ),
  },
};
