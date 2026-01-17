import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentUploader } from '../../client/src/components/DocumentUploader';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for upload
global.fetch = vi.fn();

describe('DocumentUploader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DocumentUploader {...props} />
      </QueryClientProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByText('Upload Company Documents')).toBeTruthy();
    expect(screen.getByText(/Drag & drop/)).toBeTruthy();
  });

  it.skip('handles file drop (simulation)', async () => {
    const { container } = renderComponent();
    
    // Find the hidden input
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeTruthy();
    });
  });

  it.skip('uploads files', async () => {
    const { container } = renderComponent();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => screen.getByText('test.pdf'));

    // Mock fetch success
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ extractedData: [{ filename: 'test.pdf', companyName: 'Test Corp' }] })
    });

    const uploadBtn = screen.getByText('Upload & Extract Data');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeTruthy(); // Toast title usually mocked
    });
  });
});
