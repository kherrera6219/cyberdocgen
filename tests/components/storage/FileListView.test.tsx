import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileListView } from '../../../client/src/components/storage/FileListView';
import { File } from 'lucide-react';

describe('FileListView', () => {
  it('renders file list', () => {
    const files = ['file1.txt', 'file2.pdf'];
    render(
      <FileListView 
        files={files} 
        title="My Files" 
        icon={<File />} 
        onDelete={vi.fn()} 
      />
    );

    expect(screen.getByText('My Files')).toBeTruthy();
    expect(screen.getByText('file1.txt')).toBeTruthy();
    expect(screen.getByText('file2.pdf')).toBeTruthy();
  });

  it('renders empty state', () => {
    render(
      <FileListView 
        files={[]} 
        title="My Files" 
        icon={<File />} 
        onDelete={vi.fn()} 
      />
    );
    expect(screen.getByText('No files')).toBeTruthy();
  });

  it('calls delete handler', () => {
    const onDelete = vi.fn();
    render(
      <FileListView 
        files={['file1.txt']} 
        title="My Files" 
        icon={<File />} 
        onDelete={onDelete} 
      />
    );

    const deleteBtn = screen.getByLabelText('Delete file1.txt');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('file1.txt');
  });
});
