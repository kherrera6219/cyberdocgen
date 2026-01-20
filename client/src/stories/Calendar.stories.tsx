import type { Meta, StoryObj } from '@storybook/react'; // eslint-disable-line storybook/no-renderer-packages
import { Calendar } from '../components/ui/calendar';
import React from 'react';

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const CalendarDemo = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  )
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};
