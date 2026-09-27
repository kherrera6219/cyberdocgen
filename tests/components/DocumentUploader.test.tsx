import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentUploader } from '../../client/src/components/DocumentUploader';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for upload
global.fetch = vi.fn();

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('DocumentUploader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
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

  it('handles file drop (simulation)', async () => {
    const { container } = renderComponent();
    
    // Find the hidden input
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeTruthy();
    });
  });

  it('uploads files', async () => {
    const { container } = renderComponent();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByText('test.pdf'));

    // Mock fetch success
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ extractedData: [{ filename: 'test.pdf', companyName: 'Test Corp' }] })
    });

    const uploadBtn = screen.getByText('Upload & Extract Data');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Upload Complete' })
      );
    });
  });
});
