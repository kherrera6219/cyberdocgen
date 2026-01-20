import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Skeleton } from '../components/ui/skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" {...args} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" {...args} />
        <Skeleton className="h-4 w-[200px]" {...args} />
      </div>
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: (args) => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" {...args} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" {...args} />
        <Skeleton className="h-4 w-[200px]" {...args} />
      </div>
    </div>
  ),
};
