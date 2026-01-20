import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Slider } from '../components/ui/slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    max: {
      control: 'number',
    },
    min: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Slider defaultValue={[50]} max={100} step={1} className={'w-[60%]'} {...args} />
  ),
};

export const Range: Story = {
  render: (args) => (
    <Slider defaultValue={[25, 75]} max={100} step={1} className={'w-[60%]'} {...args} />
  ),
};
