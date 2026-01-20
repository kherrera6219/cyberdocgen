import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
);

export const Default: Story = {
  render: (args) => (
    <ScrollArea className="h-72 w-48 rounded-md border" {...args}>
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: (args) => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border" {...args}>
      <div className="flex w-max space-x-4 p-4">
        {tags.map((tag) => (
          <div key={tag} className="w-[150px] shrink-0">
            <div className="overflow-hidden rounded-md">
              <div className="h-20 w-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo by <span className="font-semibold text-foreground">Author</span>
            </figcaption>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
