import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectStorageManager } from '../../client/src/components/ObjectStorageManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as queryLib from '../../client/src/lib/queryClient';

// Mock UI components if they cause issues, but typically we want to test them.
// We need to mock the apiRequest function.

vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  }
}));

// Mock hooks if needed? No, using real QueryClient.

describe('ObjectStorageManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false, 
          staleTime: 0,
          queryFn: ({ queryKey }) => {
             // Basic mock delegating to the mocked apiRequest
             return (queryLib.apiRequest as any)(queryKey[0] as string);
          }
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ObjectStorageManager />
      </QueryClientProvider>
    );
  };

  it('renders loading state and then stats', async () => {
    // Mock stats response
    (queryLib.apiRequest as any).mockImplementation((url: string) => {
      if (url.includes('stats')) {
        return Promise.resolve({
          success: true,
          stats: {
            totalFiles: 10,
            byFolder: { documents: 5, profiles: 2, backups: 1, files: 2, auditLogs: 0, other: 0 },
            lastUpdated: new Date().toISOString()
          }
        });
      }
      if (url.includes('list')) {
        return Promise.resolve({ success: true, files: ['doc1.pdf'] });
      }
      return Promise.resolve({});
    });

    renderComponent();

    expect(screen.getByText('Object Storage Manager')).toBeTruthy();
    
    // Wait for stats to load using findByText which has built-in wait
    screen.debug();
    const statsElement = await screen.findByText('10', {}, { timeout: 4000 });
    expect(statsElement).toBeTruthy();
    
    expect(screen.getByText('System Status')).toBeTruthy();
  });

  it('allows tab switching', async () => {
    renderComponent();
    
    const uploadTab = screen.getByText('Upload');
    fireEvent.click(uploadTab);
    
    await waitFor(() => {
        expect(screen.getByText('Upload File')).toBeTruthy();
    });
  });
});
