import type { Meta, StoryObj } from '@storybook/react';
import { RepoUploadZone } from '../components/repository/RepoUploadZone';

const meta = {
  title: 'Repository/RepoUploadZone',
  component: RepoUploadZone,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    maxSize: {
      control: { type: 'number', min: 1, max: 1000 },
      description: 'Maximum file size in MB',
    },
  },
} satisfies Meta<typeof RepoUploadZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    organizationId: 'org-123',
    companyProfileId: 'profile-456',
    maxSize: 500,
    onUpload: async (file, metadata) => {
      console.log('Uploading file:', file.name, 'with metadata:', metadata);
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};

export const WithCustomSize: Story = {
  args: {
    ...Default.args,
    maxSize: 100,
  },
};

export const WithPrefilledName: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => {
    return (
      <div className="w-[600px]">
        <RepoUploadZone {...args} />
      </div>
    );
  },
};
