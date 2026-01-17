import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileListItem, UploadedFile } from '../../../client/src/components/upload/FileListItem';

describe('FileListItem', () => {
  it('renders pending file correctly', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const uploadedFile: UploadedFile = {
      file,
      progress: 0,
      status: 'pending'
    };

    render(
      <FileListItem 
        uploadedFile={uploadedFile} 
        isProcessing={false} 
        onRemove={vi.fn()} 
      />
    );

    expect(screen.getByText('test.pdf')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();
    expect(screen.getByLabelText('Remove test.pdf')).toBeTruthy();
  });

  it('renders completed file with metadata', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const uploadedFile: UploadedFile = {
      file,
      progress: 100,
      status: 'completed',
      extractedData: {
        companyName: 'Acme Corp'
      }
    };

    render(
      <FileListItem 
        uploadedFile={uploadedFile} 
        isProcessing={false} 
        onRemove={vi.fn()} 
      />
    );

    expect(screen.getByText('completed')).toBeTruthy();
    expect(screen.getByText('Acme Corp')).toBeTruthy();
  });

  it('does not show remove button when processing', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const uploadedFile: UploadedFile = {
      file,
      progress: 50,
      status: 'processing'
    };

    render(
      <FileListItem 
        uploadedFile={uploadedFile} 
        isProcessing={true} 
        onRemove={vi.fn()} 
      />
    );

    expect(screen.queryByLabelText('Remove test.pdf')).toBeNull();
  });
});
